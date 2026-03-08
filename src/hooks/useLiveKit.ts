import { useState, useCallback } from 'react';

export function useLiveKit() {
  const [token, setToken] = useState<string | null>(null);

  const joinVoiceRoom = useCallback(async (channelId: string, username: string) => {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: channelId,
          participantName: username,
        }),
      });
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching LiveKit token:', error);
    }
  }, []);

  const leaveVoiceRoom = useCallback(async () => {
    setToken(null);
  }, []);

  return {
    token,
    joinVoiceRoom,
    leaveVoiceRoom
  };
}
