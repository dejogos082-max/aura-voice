import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

export default function CallArea() {
  const { callRoomId, callType, endCall } = useAppStore();
  const { profile } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!callRoomId || !profile) return;

    const fetchToken = async () => {
      try {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: callRoomId,
            participantName: profile.username || profile.displayName || 'User',
          }),
        });
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching LiveKit token:', error);
      }
    };

    fetchToken();
  }, [callRoomId, profile]);

  if (!token) {
    return (
      <div className="absolute inset-0 bg-zinc-950 z-50 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p>Connecting to call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col overflow-hidden">
      <LiveKitRoom
        video={callType === 'video'}
        audio={true}
        token={token}
        serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://aura-voice-1b74mebv.livekit.cloud'}
        data-lk-theme="default"
        className="w-full h-full flex flex-col overflow-hidden"
        onDisconnected={endCall}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
