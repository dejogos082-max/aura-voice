import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { Phone, PhoneOff } from 'lucide-react';

export default function CallNotification() {
  const { profile } = useAuthStore();
  const { isInCall, startCall, view, selectedDmId, selectedChannelId } = useAppStore();
  
  const [incomingCall, setIncomingCall] = useState<{ roomId: string, type: 'audio' | 'video', callerName: string } | null>(null);

  useEffect(() => {
    if (!profile || isInCall) {
      setIncomingCall(null);
      return;
    }

    // Listen to all signaling rooms to see if there's an active call we should be notified about
    // For simplicity, we'll just check if there's a call in the currently selected DM or Channel
    
    let currentRoomId: string | null = null;
    
    if (view === 'dms' && selectedDmId) {
      // Find DM chat ID
      const dmsRef = ref(db, `dms/${profile.uid}`);
      onValue(dmsRef, (snap) => {
        if (snap.exists()) {
          const dms = snap.val();
          const existingDm = Object.entries(dms).find(([_, id]) => id === selectedDmId);
          if (existingDm) {
            currentRoomId = `${existingDm[0]}_call`;
            checkRoom(currentRoomId, 'Friend');
          }
        }
      });
    } else if (view === 'server' && selectedChannelId) {
      currentRoomId = `${selectedChannelId}_call`;
      checkRoom(currentRoomId, 'Server Channel');
    }

    function checkRoom(roomId: string, callerName: string) {
      const roomRef = ref(db, `webrtc_signaling/${roomId}`);
      onValue(roomRef, (snap) => {
        const data = snap.val();
        if (data && data.offer && !isInCall) {
          // There is an active call in this room
          setIncomingCall({
            roomId,
            type: 'video', // Defaulting to video for now
            callerName
          });
        } else {
          setIncomingCall(null);
        }
      });
    }

  }, [profile, isInCall, view, selectedDmId, selectedChannelId]);

  if (!incomingCall) return null;

  return (
    <div className="absolute top-4 right-4 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 flex items-center gap-4 z-50 animate-in slide-in-from-top-4">
      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
        <Phone className="animate-pulse" />
      </div>
      <div>
        <h3 className="font-bold text-white">Incoming Call</h3>
        <p className="text-sm text-zinc-400">{incomingCall.callerName} is calling...</p>
      </div>
      <div className="flex gap-2 ml-4">
        <button 
          onClick={() => setIncomingCall(null)}
          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
        >
          <PhoneOff size={18} />
        </button>
        <button 
          onClick={() => {
            startCall('', incomingCall.type, incomingCall.roomId);
            setIncomingCall(null);
          }}
          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
        >
          <Phone size={18} />
        </button>
      </div>
    </div>
  );
}
