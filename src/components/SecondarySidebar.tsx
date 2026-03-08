import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, onValue, push, set, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Hash, Volume2, UserPlus, Users, MessageSquare } from 'lucide-react';

export default function SecondarySidebar() {
  const { view, selectedServerId, selectedChannelId, selectChannel, selectDm, selectedDmId } = useAppStore();
  const { profile } = useAuthStore();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [serverName, setServerName] = useState('');
  
  const [friends, setFriends] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendError, setFriendError] = useState('');

  // Fetch Server Channels
  useEffect(() => {
    if (view !== 'server' || !selectedServerId) return;
    
    const serverRef = ref(db, `servers/${selectedServerId}`);
    onValue(serverRef, (snap) => {
      if (snap.exists()) setServerName(snap.val().name);
    });

    const channelsRef = ref(db, `channels/${selectedServerId}`);
    const unsubscribe = onValue(channelsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setChannels([]);
        return;
      }
      
      const channelList = Object.entries(data).map(([id, channel]: [string, any]) => ({
        id,
        ...channel
      }));
      setChannels(channelList);
      
      // Auto-select first channel if none selected
      if (!selectedChannelId && channelList.length > 0) {
        selectChannel(channelList[0].id);
      }
    });

    return () => unsubscribe();
  }, [view, selectedServerId, selectedChannelId, selectChannel]);

  // Fetch Friends and DMs
  useEffect(() => {
    if (view !== 'dms' || !profile) return;

    const friendsRef = ref(db, `friends/${profile.uid}`);
    const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setFriends([]);
        return;
      }
      
      const fetchFriends = async () => {
        const friendIds = Object.keys(data);
        const friendProfiles = await Promise.all(
          friendIds.map(async (id) => {
            const userSnap = await get(ref(db, `users/${id}`));
            return { id, ...userSnap.val() };
          })
        );
        setFriends(friendProfiles);
      };
      fetchFriends();
    });

    const dmsRef = ref(db, `dms/${profile.uid}`);
    const unsubscribeDms = onValue(dmsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setDms([]);
        return;
      }
      
      const fetchDms = async () => {
        const dmList = await Promise.all(
          Object.entries(data).map(async ([chatId, friendId]: [string, any]) => {
            const userSnap = await get(ref(db, `users/${friendId}`));
            return { chatId, friendId, ...userSnap.val() };
          })
        );
        setDms(dmList);
      };
      fetchDms();
    });

    return () => {
      unsubscribeFriends();
      unsubscribeDms();
    };
  }, [view, profile]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError('');
    if (!profile || !friendUsername.trim()) return;

    try {
      const usernameRef = ref(db, `usernames/${friendUsername.toLowerCase()}`);
      const snap = await get(usernameRef);
      
      if (!snap.exists()) {
        setFriendError('User not found');
        return;
      }
      
      const friendId = snap.val();
      if (friendId === profile.uid) {
        setFriendError('You cannot add yourself');
        return;
      }

      await set(ref(db, `friends/${profile.uid}/${friendId}`), true);
      await set(ref(db, `friends/${friendId}/${profile.uid}`), true);
      
      setFriendUsername('');
      setShowAddFriend(false);
    } catch (err: any) {
      setFriendError(err.message);
    }
  };

  const startDm = async (friendId: string) => {
    if (!profile) return;
    
    // Check if DM exists
    const dmsRef = ref(db, `dms/${profile.uid}`);
    const snap = await get(dmsRef);
    let chatId = null;
    
    if (snap.exists()) {
      const dms = snap.val();
      const existingDm = Object.entries(dms).find(([_, id]) => id === friendId);
      if (existingDm) chatId = existingDm[0];
    }
    
    if (!chatId) {
      // Create new DM
      const newDmRef = push(ref(db, 'dm_messages'));
      chatId = newDmRef.key;
      await set(ref(db, `dms/${profile.uid}/${chatId}`), friendId);
      await set(ref(db, `dms/${friendId}/${chatId}`), profile.uid);
    }
    
    selectDm(friendId);
  };

  if (view === 'server') {
    return (
      <div className="w-60 bg-zinc-900 flex flex-col border-r border-zinc-800">
        <div className="h-12 flex items-center px-4 font-bold text-white shadow-sm border-b border-zinc-800 truncate">
          {serverName}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => selectChannel(channel.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                selectedChannelId === channel.id ? 'bg-zinc-800 text-white' : ''
              }`}
            >
              {channel.type === 'voice' ? <Volume2 size={18} /> : <Hash size={18} />}
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-zinc-900 flex flex-col border-r border-zinc-800">
      <div className="h-12 flex items-center justify-between px-4 font-bold text-white shadow-sm border-b border-zinc-800">
        <span>Direct Messages</span>
        <button 
          onClick={() => setShowAddFriend(true)}
          className="text-zinc-400 hover:text-white transition-colors"
          title="Add Friend"
        >
          <UserPlus size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase px-2 mb-2 flex items-center gap-1">
            <Users size={12} /> Friends
          </h3>
          <div className="space-y-0.5">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => startDm(friend.id)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                  selectedDmId === friend.id ? 'bg-zinc-800 text-white' : ''
                }`}
              >
                <div className="relative">
                  <img src={friend.avatarUrl} alt={friend.username} className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                    friend.status === 'online' ? 'bg-green-500' : 
                    friend.status === 'dnd' ? 'bg-red-500' : 
                    friend.status === 'incall' ? 'bg-indigo-500' : 'bg-zinc-500'
                  }`} />
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className="text-sm font-medium text-zinc-200 truncate">{friend.displayName}</span>
                  <span className="text-xs text-zinc-500 truncate">@{friend.username}</span>
                </div>
              </button>
            ))}
            {friends.length === 0 && (
              <div className="text-xs text-zinc-500 px-2 italic">No friends yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-center">Add Friend</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              You can add a friend with their AuraVoice username.
            </p>
            {friendError && (
              <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm mb-4">
                {friendError}
              </div>
            )}
            <form onSubmit={handleAddFriend}>
              <div className="mb-6">
                <input
                  type="text"
                  required
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter username"
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(false)}
                  className="text-zinc-400 hover:underline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
