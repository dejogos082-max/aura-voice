import { ref, set, push, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export const messageService = {
  async sendMessage(channelId: string, senderId: string, content: string) {
    const messagesRef = ref(db, `messages/${channelId}`);
    const newMsgRef = push(messagesRef);
    const messageId = newMsgRef.key!;

    const messageData: Omit<Message, 'id'> = {
      senderId,
      content,
      timestamp: Date.now()
    };

    await set(newMsgRef, messageData);
    return messageId;
  },

  listenMessages(channelId: string, callback: (messages: Message[]) => void) {
    const messagesRef = ref(db, `messages/${channelId}`);
    const listener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const messages = Object.entries(data).map(([id, m]: [string, any]) => ({ id, ...m })) as Message[];
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    });

    return () => off(messagesRef, 'value', listener);
  }
};
