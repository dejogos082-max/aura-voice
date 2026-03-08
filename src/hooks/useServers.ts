import { useState, useEffect } from 'react';
import { serverService, Server } from '../services/serverService';

export function useServers(userId: string | undefined) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setServers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = serverService.listenUserServers(userId, (data) => {
      setServers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { servers, loading };
}
