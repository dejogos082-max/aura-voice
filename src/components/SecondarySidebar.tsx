import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, onValue, push, set, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Hash, Volume2, UserPlus, Users, MessageSquare, UserPlus2 } from 'lucide-react';
import InviteModal from './InviteModal';
import ChannelList from './ChannelList';
import { motion, AnimatePresence } from 'motion/react';

export default function SecondarySidebar() {
  const { view, selectedServerId, selectedChannelId, selectChannel, selectDm, selectedDmId } = useAppStore();
  const { profile } = useAuthStore();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [serverName, setServerName] = useState('');
  
  const [friends, setFriends] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendError, setFriendError] = useState('');

  // Fetch Server Channels
  useEffect(() => {
    if (view !== 'server' || !selectedServerId) return;
    
    const serverRef = ref(db, `servers/${selectedServerId}`);
    onValue(serverRef, (snap) => {
      if (snap.exists()) setServerName(snap.val().name);
    });
  }, [view, selectedServerId]);

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
    return <ChannelList serverName={serverName} />;
  }

  return (
    <div className="w-64 bg-zinc-900/95 backdrop-blur-md flex flex-col border-r border-white/5 h-full">
      <div className="h-14 flex items-center justify-between px-5 font-semibold text-zinc-100 shadow-sm border-b border-white/5 shrink-0">
        <span>Direct Messages</span>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddFriend(true)}
          className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
          title="Add Friend"
        >
          <UserPlus size={18} />
        </motion.button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4 hide-scrollbar">
        <div>
          <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
            <Users size={12} /> Friends
          </h3>
          <div className="space-y-1">
            {friends.map((friend) => (
              <motion.button
                key={friend.id}
                whileHover={{ x: 4 }}
                onClick={() => startDm(friend.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                  selectedDmId === friend.id ? 'bg-zinc-800/80 text-white shadow-sm' : ''
                }`}
              >
                <div className="relative">
                  <img src={friend.avatarUrl} alt={friend.username} className="w-9 h-9 rounded-full bg-zinc-800 object-cover" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                    friend.status === 'online' ? 'bg-emerald-500' : 
                    friend.status === 'dnd' ? 'bg-red-500' : 
                    friend.status === 'incall' ? 'bg-indigo-500' : 'bg-zinc-500'
                  }`} />
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className="text-sm font-medium text-zinc-200 truncate">{friend.displayName}</span>
                  <span className="text-xs text-zinc-500 truncate">@{friend.username}</span>
                </div>
              </motion.button>
            ))}
            {friends.length === 0 && (
              <div className="text-sm text-zinc-500 px-3 py-4 text-center bg-zinc-800/30 rounded-xl border border-white/5">
                No friends yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddFriend(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative z-10"
            >
              <h2 className="text-xl font-semibold mb-2 text-white">Add Friend</h2>
              <p className="text-zinc-400 text-sm mb-6">
                You can add a friend with their AuraVoice username.
              </p>
              {friendError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
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
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFriend(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
