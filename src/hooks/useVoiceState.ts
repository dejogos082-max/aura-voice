import { useState, useEffect } from 'react';
import { voiceService, VoiceState } from '../services/voiceService';

export function useVoiceState(channelId: string | null) {
  const [voiceStates, setVoiceStates] = useState<VoiceState[]>([]);

  useEffect(() => {
    if (!channelId) {
      setVoiceStates([]);
      return;
    }

    const unsubscribe = voiceService.listenVoiceStates(channelId, (data) => {
      setVoiceStates(data);
    });

    return () => unsubscribe();
  }, [channelId]);

  return { voiceStates };
}
