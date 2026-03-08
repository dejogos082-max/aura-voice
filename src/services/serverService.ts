import { ref, set, get, push, update, remove, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';

export interface Server {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  createdAt: number;
  frame?: string;
}

export interface ServerMember {
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

export const serverService = {
  async createServer(name: string, ownerId: string, iconUrl?: string) {
    const serversRef = ref(db, 'servers');
    const newServerRef = push(serversRef);
    const serverId = newServerRef.key!;

    const serverData: Omit<Server, 'id'> = {
      name,
      icon: iconUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      ownerId,
      createdAt: Date.now()
    };

    await set(newServerRef, serverData);

    // Add owner to members
    const memberRef = ref(db, `serverMembers/${serverId}/${ownerId}`);
    await set(memberRef, {
      role: 'owner',
      joinedAt: Date.now()
    });

    return serverId;
  },

  listenUserServers(userId: string, callback: (servers: Server[]) => void) {
    // In a real app, we might want a denormalized list of user's servers.
    // For now, we listen to all serverMembers and filter, or we can listen to servers and check if user is member.
    // Since we need to find servers the user is in, let's listen to serverMembers.
    // Actually, RTDB doesn't support querying across multiple nodes easily like this.
    // A better way is to have `userServers/uid/serverId = true`.
    // But the prompt says: "Buscar em serverMembers".
    // Let's listen to all servers and check if user is in serverMembers. (Not scalable, but fits the prompt constraints if we don't add userServers).
    // Wait, we can listen to `serverMembers`? No, we can't query `serverMembers` by `uid` unless we index it, but RTDB structure is `serverMembers/serverId/uid`.
    // Let's just listen to all servers for now, or fetch them.
    // Actually, we can just fetch all servers and then check `serverMembers`.
    // Let's do a simple approach: listen to `servers`, then for each server, check if `serverMembers/${serverId}/${userId}` exists.
    
    const serversRef = ref(db, 'servers');
    const listener = onValue(serversRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const allServers = Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s }));
      const userServers: Server[] = [];

      for (const server of allServers) {
        const memberSnap = await get(ref(db, `serverMembers/${server.id}/${userId}`));
        if (memberSnap.exists()) {
          userServers.push(server as Server);
        }
      }

      callback(userServers);
    });

    return () => off(serversRef, 'value', listener);
  }
};
