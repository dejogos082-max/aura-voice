import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, set, onValue, onDisconnect, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function CallArea() {
  const { callRoomId, callPartnerId, callType, endCall } = useAppStore();
  const { profile } = useAuthStore();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!callRoomId || !profile) return;

    const initCall = async () => {
      // 1. Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Setup Peer Connection
        const servers = {
          iceServers: [
            { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
          ]
        };
        
        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;

        // Add local tracks to PC
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Listen for remote tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // 3. Signaling
        const roomRef = ref(db, `webrtc_signaling/${callRoomId}`);
        const callerCandidatesRef = ref(db, `webrtc_signaling/${callRoomId}/callerCandidates`);
        const calleeCandidatesRef = ref(db, `webrtc_signaling/${callRoomId}/calleeCandidates`);

        // Check if we are caller or callee
        // We assume whoever creates the room is caller. For simplicity, we check if offer exists.
        // Actually, let's determine role by checking if offer exists.
        let isCaller = false;
        
        const roomSnap = await new Promise<any>((resolve) => {
          onValue(roomRef, (snap) => resolve(snap.val()), { onlyOnce: true });
        });

        if (!roomSnap || !roomSnap.offer) {
          isCaller = true;
          
          // Create Offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);
          
          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type
          };
          
          await set(ref(db, `webrtc_signaling/${callRoomId}/offer`), offer);
          
          // Listen for Answer
          onValue(ref(db, `webrtc_signaling/${callRoomId}/answer`), (snap) => {
            const data = snap.val();
            if (!pc.currentRemoteDescription && data) {
              const answerDescription = new RTCSessionDescription(data);
              pc.setRemoteDescription(answerDescription);
            }
          });

          // ICE Candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const newCandidateRef = ref(db, `webrtc_signaling/${callRoomId}/callerCandidates/${Date.now()}`);
              set(newCandidateRef, event.candidate.toJSON());
            }
          };

          onValue(calleeCandidatesRef, (snap) => {
            const data = snap.val();
            if (data) {
              Object.values(data).forEach((candidate: any) => {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
              });
            }
          });

        } else {
          // We are Callee
          const offerDescription = roomSnap.offer;
          await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
          
          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);
          
          const answer = {
            sdp: answerDescription.sdp,
            type: answerDescription.type
          };
          
          await set(ref(db, `webrtc_signaling/${callRoomId}/answer`), answer);

          // ICE Candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const newCandidateRef = ref(db, `webrtc_signaling/${callRoomId}/calleeCandidates/${Date.now()}`);
              set(newCandidateRef, event.candidate.toJSON());
            }
          };

          onValue(callerCandidatesRef, (snap) => {
            const data = snap.val();
            if (data) {
              Object.values(data).forEach((candidate: any) => {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
              });
            }
          });
        }
        
        // Cleanup on disconnect
        onDisconnect(roomRef).remove();
      } catch (err) {
        console.error("Error starting call:", err);
      }
    };

    initCall();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      remove(ref(db, `webrtc_signaling/${callRoomId}`));
    };
  }, [callRoomId, profile, callType]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  return (
    <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col">
      <div className="flex-1 relative flex items-center justify-center p-4 gap-4">
        {/* Remote Video */}
        <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-sm">
            Partner
          </div>
        </div>

        {/* Local Video (PiP) */}
        <div className="absolute bottom-24 right-8 w-64 aspect-video bg-zinc-800 rounded-xl overflow-hidden shadow-xl border-2 border-zinc-700">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-white text-xs backdrop-blur-sm">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-6">
        <button 
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button 
          onClick={handleEndCall}
          className="w-16 h-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
