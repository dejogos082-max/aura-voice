import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../lib/firebase';
import { MessageCircle, Plus, LogOut, User } from 'lucide-react';
import { auth } from '../lib/firebase';

interface Server {
  id: string;
  name: string;
  iconUrl: string;
  ownerId: string;
}

export default function Sidebar() {
  const { view, setView, selectServer, selectedServerId, setProfileModalOpen } = useAppStore();
  const { profile } = useAuthStore();
  const [servers, setServers] = useState<Server[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  useEffect(() => {
    if (!profile) return;
    
    // Listen to servers the user is a member of
    const serversRef = ref(db, 'servers');
    const unsubscribe = onValue(serversRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setServers([]);
        return;
      }
      
      const userServers = Object.entries(data)
        .filter(([_, server]: [string, any]) => server.members && server.members[profile.uid])
        .map(([id, server]: [string, any]) => ({
          id,
          name: server.name,
          iconUrl: server.iconUrl,
          ownerId: server.ownerId
        }));
        
      setServers(userServers);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newServerName.trim()) return;

    const serversRef = ref(db, 'servers');
    const newServerRef = push(serversRef);
    
    await set(newServerRef, {
      name: newServerName,
      iconUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${newServerName}`,
      ownerId: profile.uid,
      members: {
        [profile.uid]: true
      }
    });

    // Create default channel
    const channelsRef = ref(db, `channels/${newServerRef.key}`);
    const newChannelRef = push(channelsRef);
    await set(newChannelRef, {
      name: 'general',
      type: 'text',
      createdAt: Date.now()
    });

    setNewServerName('');
    setShowCreate(false);
    selectServer(newServerRef.key);
  };

  return (
    <div className="w-18 bg-zinc-950 flex flex-col items-center py-3 gap-3 overflow-y-auto hide-scrollbar">
      {/* Home / DMs */}
      <div className="relative group">
        <button
          onClick={() => setView('dms')}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center bg-zinc-800 text-zinc-100 group-hover:bg-indigo-500 group-hover:text-white ${
            view === 'dms' ? 'bg-indigo-500 text-white rounded-[16px]' : ''
          }`}
        >
          <MessageCircle size={24} />
        </button>
        {view === 'dms' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}
      </div>

      <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />

      {/* Servers */}
      {servers.map((server) => (
        <div key={server.id} className="relative group">
          <button
            onClick={() => selectServer(server.id)}
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 overflow-hidden ${
              selectedServerId === server.id ? 'rounded-[16px] ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950' : ''
            }`}
          >
            <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
          </button>
          {selectedServerId === server.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
          )}
          {selectedServerId !== server.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-5 bg-white rounded-r-full transition-all duration-200" />
          )}
        </div>
      ))}

      {/* Add Server */}
      <div className="relative group">
        <button
          onClick={() => setShowCreate(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center bg-zinc-800 text-green-500 hover:bg-green-500 hover:text-white"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-3">
        <button
          onClick={() => setProfileModalOpen(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-indigo-500 hover:text-white"
          title="Profile"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Profile" className="w-full h-full rounded-[inherit] object-cover" />
          ) : (
            <User size={20} />
          )}
        </button>
        <button
          onClick={() => auth.signOut()}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center bg-zinc-800 text-red-500 hover:bg-red-500 hover:text-white"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Create Server Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-center">Create a Server</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Your server is where you and your friends hang out. Make yours and start talking.
            </p>
            <form onSubmit={handleCreateServer}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  required
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full bg-zinc-900 border-none rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="My Awesome Server"
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-zinc-400 hover:underline px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
