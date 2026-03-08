import { ref, set, remove, onValue, off, update } from 'firebase/database';
import { db } from '../lib/firebase';

export interface VoiceState {
  uid: string;
  muted: boolean;
  deafened: boolean;
  joinedAt: number;
}

export const voiceService = {
  async joinVoiceChannel(channelId: string, uid: string) {
    const userVoiceRef = ref(db, `users/${uid}/currentVoiceChannel`);
    await set(userVoiceRef, channelId);

    const voiceStateRef = ref(db, `voiceStates/${channelId}/${uid}`);
    await set(voiceStateRef, {
      muted: false,
      deafened: false,
      joinedAt: Date.now()
    });

    // TODO: LiveKit Integration
    // joinVoiceRoom(channelId, username)
  },

  async leaveVoiceChannel(channelId: string, uid: string) {
    const userVoiceRef = ref(db, `users/${uid}/currentVoiceChannel`);
    await remove(userVoiceRef);

    const voiceStateRef = ref(db, `voiceStates/${channelId}/${uid}`);
    await remove(voiceStateRef);
  },

  async updateVoiceState(channelId: string, uid: string, muted: boolean, deafened: boolean) {
    const voiceStateRef = ref(db, `voiceStates/${channelId}/${uid}`);
    await update(voiceStateRef, {
      muted,
      deafened
    });
  },

  listenVoiceStates(channelId: string, callback: (states: VoiceState[]) => void) {
    const voiceStatesRef = ref(db, `voiceStates/${channelId}`);
    const listener = onValue(voiceStatesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const states = Object.entries(data).map(([uid, s]: [string, any]) => ({ uid, ...s })) as VoiceState[];
      callback(states);
    });

    return () => off(voiceStatesRef, 'value', listener);
  }
};
