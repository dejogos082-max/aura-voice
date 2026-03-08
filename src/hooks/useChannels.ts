import { useState, useEffect } from 'react';
import { channelService, Channel } from '../services/channelService';

export function useChannels(serverId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    const unsubscribe = channelService.listenServerChannels(serverId, (data) => {
      setChannels(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serverId]);

  return { channels, loading };
}
