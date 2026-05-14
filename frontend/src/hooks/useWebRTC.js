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

  const pcRef          = useRef(null);   // RTCPeerConnection
  const localStreamRef = useRef(null);

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
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signal({
      type: "webrtc_answer",
      call_id: callId,
      target_id: remoteUserId,
      sdp: pc.localDescription,
    });
  }, [callId, remoteUserId, getLocalMedia, createPeerConnection, signal]);

  // ── CALLER: called when webrtc_answer arrives ────────────
  const handleAnswer = useCallback(async (sdp) => {
    const pc = pcRef.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }, []);

  // ── Both sides: called when webrtc_ice_candidate arrives ─
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc) return;
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
    setLocalStream(null);
    setRemoteStream(null);

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
