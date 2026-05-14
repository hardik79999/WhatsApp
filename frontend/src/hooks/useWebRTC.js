import { useRef, useCallback } from 'react';

// ─── ICE Server config ────────────────────────────────────────────────────────
// STUN-only works on same/home networks.
// For production, add TURN credentials here:
// { urls: 'turn:your.turn.server', username: '...', credential: '...' }
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC({ ws, localUserId, remoteUserId, callType, isCaller, callId }) {
  const pcRef         = useRef(null);
  const localStream   = useRef(null);
  const remoteStream  = useRef(null);

  // ── Hard stop: ALWAYS kills camera/mic + closes PeerConnection ───────────
  // Called both from endCall() and from CallScreen's unmount cleanup,
  // so the browser camera indicator turns off no matter how the call ends.
  const cleanup = useCallback(() => {
    // Stop every track — this turns off the camera/mic LED
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => {
        t.stop();
        localStream.current.removeTrack(t);
      });
      localStream.current = null;
    }
    // Also clear the remote stream ref
    if (remoteStream.current) {
      remoteStream.current = null;
    }
    // Close RTCPeerConnection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const sendWS = useCallback((payload) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, [ws]);

  const getLocalMedia = useCallback(async () => {
    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: 1280, height: 720 } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream.current = stream;
    return stream;
  }, [callType]);

  const createPeerConnection = useCallback((onRemoteStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Forward ICE candidates to remote peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendWS({
          type: 'call_ice_candidate',
          call_id: callId,
          target_user_id: remoteUserId,
          candidate,
        });
      }
    };

    // Surface remote stream
    pc.ontrack = ({ streams }) => {
      if (streams[0]) {
        remoteStream.current = streams[0];
        onRemoteStream && onRemoteStream(streams[0]);
      }
    };

    return pc;
  }, [callId, remoteUserId, sendWS]);

  // ── Caller flow ──────────────────────────────────────────────────────────
  const startCall = useCallback(async (onLocalStream, onRemoteStream) => {
    const stream = await getLocalMedia();
    onLocalStream && onLocalStream(stream);

    const pc = createPeerConnection(onRemoteStream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendWS({
      type: 'call_offer',
      call_id: callId,
      target_user_id: remoteUserId,
      sdp: offer,
      call_type: callType,
    });
  }, [getLocalMedia, createPeerConnection, sendWS, callId, remoteUserId, callType]);

  // ── Callee flow ──────────────────────────────────────────────────────────
  const answerCall = useCallback(async (offerSdp, onLocalStream, onRemoteStream) => {
    const stream = await getLocalMedia();
    onLocalStream && onLocalStream(stream);

    const pc = createPeerConnection(onRemoteStream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sendWS({
      type: 'call_answer',
      call_id: callId,
      target_user_id: remoteUserId,
      sdp: answer,
    });
  }, [getLocalMedia, createPeerConnection, sendWS, callId, remoteUserId]);

  // ── Handle signalling events from WS ────────────────────────────────────
  const handleAnswer = useCallback(async (answerSdp) => {
    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('ICE candidate error', e);
    }
  }, []);

  // ── End / cleanup ────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    cleanup(); // stop camera + mic + close PC
    sendWS({ type: 'call_end', call_id: callId, target_user_id: remoteUserId });
  }, [cleanup, callId, remoteUserId, sendWS]);

  const toggleMute = useCallback(() => {
    const audio = localStream.current?.getAudioTracks()[0];
    if (audio) audio.enabled = !audio.enabled;
    return !localStream.current?.getAudioTracks()[0]?.enabled;
  }, []);

  const toggleCamera = useCallback(() => {
    const video = localStream.current?.getVideoTracks()[0];
    if (video) video.enabled = !video.enabled;
    return !localStream.current?.getVideoTracks()[0]?.enabled;
  }, []);

  return { startCall, answerCall, handleAnswer, handleIceCandidate, endCall, cleanup, toggleMute, toggleCamera };
}
