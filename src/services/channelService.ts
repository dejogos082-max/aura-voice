import { ref, set, push, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';

export interface Channel {
  id: string;
  name: string;
  type: 'category' | 'text' | 'voice';
  categoryId: string | null;
  position: number;
  createdAt: number;
}

export const channelService = {
  async createChannel(serverId: string, name: string, type: 'category' | 'text' | 'voice', categoryId: string | null = null, position: number = 0) {
    const channelsRef = ref(db, `channels/${serverId}`);
    const newChannelRef = push(channelsRef);
    const channelId = newChannelRef.key!;

    const channelData: Omit<Channel, 'id'> = {
      name,
      type,
      categoryId,
      position,
      createdAt: Date.now()
    };

    await set(newChannelRef, channelData);
    return channelId;
  },

  listenServerChannels(serverId: string, callback: (channels: Channel[]) => void) {
    const channelsRef = ref(db, `channels/${serverId}`);
    const listener = onValue(channelsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const channels = Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })) as Channel[];
      channels.sort((a, b) => a.position - b.position);
      callback(channels);
    });

    return () => off(channelsRef, 'value', listener);
  }
};
