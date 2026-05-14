// hooks/useWebRTC.js
// Manages the entire WebRTC lifecycle for one call.
//
// Usage:
//   const rtc = useWebRTC({ callId, localUserId, remoteUserId, callType, ws });
//   rtc.localStream   – MediaStream for <video> srcObject
//   rtc.remoteStream  – MediaStream for <video> srcObject
//   rtc.startAsCallerAfterAccept() – call this when receiver accepted
//   rtc.handleOffer(sdp)           – call when webrtc_offer WS event arrives
//   rtc.handleAnswer(sdp)          – call when webrtc_answer WS event arrives
//   rtc.handleIceCandidate(c)      – call when webrtc_ice_candidate WS event arrives
//   rtc.hangUp()                   – closes everything

import { useRef, useState, useCallback, useEffect } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers here for production — without them, calls fail on
    // restrictive NAT / firewalls. Example (Twilio / Metered / Xirsys):
    // { urls: "turn:your.turn.server:3478", username: "…", credential: "…" }
  ],
};

export function useWebRTC({ callId, localUserId, remoteUserId, callType, ws }) {
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCamOff,     setIsCamOff]     = useState(false);

  const pcRef              = useRef(null);   // RTCPeerConnection
  const localStreamRef     = useRef(null);
  const iceCandidateBuffer = useRef([]);     // Buffer ICE candidates until remote desc is set
  const remoteDescSet      = useRef(false);  // Track whether remote description has been set

  // ── Helper: send signaling messages via the existing WS ──
  const signal = useCallback((payload) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, [ws]);

  // ── Get local camera / mic ────────────────────────────────
  const getLocalMedia = useCallback(async () => {
    const constraints = {
      audio: true,
      video: callType === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [callType]);

  // ── Build RTCPeerConnection ───────────────────────────────
  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Reset ICE buffer state for new connection
    iceCandidateBuffer.current = [];
    remoteDescSet.current = false;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Remote track → set remoteStream state
    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(t => remoteMediaStream.addTrack(t));
    };

    // ICE candidate → send to peer via WS
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        signal({
          type: "webrtc_ice_candidate",
          call_id: callId,
          target_id: remoteUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
    };

    return pc;
  }, [callId, remoteUserId, signal]);

  // ── Helper: flush buffered ICE candidates after remote desc is set ──
  const flushIceCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const buffered = iceCandidateBuffer.current.splice(0);
    for (const c of buffered) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("[WebRTC] Buffered ICE candidate error:", e);
      }
    }
  }, []);

  // ── CALLER: called after receiver accepted the call ──────
  const startAsCallerAfterAccept = useCallback(async () => {
    const stream = await getLocalMedia();
    const pc = createPeerConnection(stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    signal({
      type: "webrtc_offer",
      call_id: callId,
      target_id: remoteUserId,
      sdp: pc.localDescription,
    });
  }, [callId, remoteUserId, getLocalMedia, createPeerConnection, signal]);

  // ── RECEIVER: called when webrtc_offer arrives ───────────
  const handleOffer = useCallback(async (sdp) => {
    const stream = await getLocalMedia();
    const pc = createPeerConnection(stream);

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    remoteDescSet.current = true;
    await flushIceCandidates(); // apply any candidates that arrived early

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signal({
      type: "webrtc_answer",
      call_id: callId,
      target_id: remoteUserId,
      sdp: pc.localDescription,
    });
  }, [callId, remoteUserId, getLocalMedia, createPeerConnection, signal, flushIceCandidates]);

  // ── CALLER: called when webrtc_answer arrives ────────────
  const handleAnswer = useCallback(async (sdp) => {
    const pc = pcRef.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    remoteDescSet.current = true;
    await flushIceCandidates(); // apply any candidates that arrived early
  }, [flushIceCandidates]);

  // ── Both sides: called when webrtc_ice_candidate arrives ─
  // Buffers candidates until remote description is set to avoid race conditions
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (!remoteDescSet.current) {
      // Remote description not set yet — buffer the candidate
      iceCandidateBuffer.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("[WebRTC] ICE candidate error:", e);
    }
  }, []);

  // ── Mute / unmute mic ─────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }, []);

  // ── Camera on / off ───────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(c => !c);
  }, []);

  // ── Hang up ───────────────────────────────────────────────
  const hangUp = useCallback(() => {
    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);

    // Clear ICE buffer
    iceCandidateBuffer.current = [];
    remoteDescSet.current = false;

    // Close RTCPeerConnection
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => hangUp(), []);  // eslint-disable-line

  return {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    startAsCallerAfterAccept,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleCamera,
    hangUp,
  };
}
