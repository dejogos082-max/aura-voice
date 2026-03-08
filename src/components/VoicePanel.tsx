import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { voiceService } from '../services/voiceService';
import { Mic, MicOff, Headphones, PhoneOff } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';

export default function VoicePanel() {
  const { profile } = useAuthStore();
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(null);
  const [channelName, setChannelName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const userVoiceRef = ref(db, `users/${profile.uid}/currentVoiceChannel`);
    const unsubscribe = onValue(userVoiceRef, (snap) => {
      const channelId = snap.val();
      setCurrentVoiceChannel(channelId);

      if (channelId) {
        setChannelName('Voice Connected');
        // Fetch token
        fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: channelId,
            participantName: profile.username || profile.displayName || 'User',
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.token) setToken(data.token);
          })
          .catch(console.error);
      } else {
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, [profile]);

  if (!currentVoiceChannel || !profile) return null;

  const handleDisconnect = async () => {
    await voiceService.leaveVoiceChannel(currentVoiceChannel, profile.uid);
    setToken(null);
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await voiceService.updateVoiceState(currentVoiceChannel, profile.uid, newMuted, isDeafened);
  };

  const toggleDeafen = async () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    await voiceService.updateVoiceState(currentVoiceChannel, profile.uid, isMuted, newDeafened);
  };

  return (
    <div className="h-14 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 shrink-0">
      {token && (
        <LiveKitRoom
          video={false}
          audio={!isDeafened}
          token={token}
          serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://aura-voice-1b74mebv.livekit.cloud'}
          connect={true}
          className="hidden"
        >
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
      <div className="flex flex-col">
        <span className="text-green-500 text-xs font-bold flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Voice Connected
        </span>
        <span className="text-zinc-400 text-xs truncate max-w-[120px]">{channelName}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleMute}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isMuted ? 'text-red-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button 
          onClick={toggleDeafen}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isDeafened ? 'text-red-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          <Headphones size={18} />
        </button>
        <button 
          onClick={handleDisconnect}
          className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-red-500 transition-colors"
          title="Disconnect"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
