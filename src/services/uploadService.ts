import { ref, update, push, set } from 'firebase/database';
import { db } from '../lib/firebase';

export const uploadService = {
  async uploadFile(file: File, uid: string, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', uid);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  },

  async uploadAvatar(file: File, uid: string): Promise<string> {
    const url = await this.uploadFile(file, uid, 'avatars');
    await update(ref(db, `users/${uid}`), { avatarUrl: url });
    return url;
  },

  async uploadServerIcon(file: File, serverId: string, uid: string): Promise<string> {
    const url = await this.uploadFile(file, uid, 'server_icons');
    await update(ref(db, `servers/${serverId}`), { icon: url });
    return url;
  },

  async uploadMessageFile(file: File, channelId: string, uid: string, isDm: boolean = false): Promise<string> {
    const url = await this.uploadFile(file, uid, 'chat_media');
    
    const messagesPath = isDm ? `dm_messages/${channelId}` : `messages/${channelId}`;
    const newMsgRef = push(ref(db, messagesPath));
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    await set(newMsgRef, {
      senderId: uid,
      text: isImage ? 'Sent an image' : isVideo ? 'Sent a video' : `Sent a file: ${file.name}`,
      mediaUrl: url,
      mediaType: isImage ? 'image' : isVideo ? 'video' : 'file',
      fileName: file.name,
      timestamp: Date.now()
    });

    return url;
  }
};
