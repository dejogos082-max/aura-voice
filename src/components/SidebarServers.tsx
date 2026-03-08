import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useServers } from '../hooks/useServers';
import { serverService } from '../services/serverService';
import { MessageCircle, Plus, LogOut, User } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';

export default function SidebarServers() {
  const { view, setView, selectServer, selectedServerId, setProfileModalOpen } = useAppStore();
  const { profile } = useAuthStore();
  const { servers } = useServers(profile?.uid);
  const [showCreate, setShowCreate] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newServerName.trim()) return;

    const serverId = await serverService.createServer(newServerName, profile.uid);
    setNewServerName('');
    setShowCreate(false);
    handleSelectServer(serverId);
  };

  const handleSelectServer = (serverId: string) => {
    selectServer(serverId);
    if (profile) {
      set(ref(db, `users/${profile.uid}/currentServer`), serverId);
    }
  };

  return (
    <div className="w-20 bg-zinc-950/80 backdrop-blur-md border-r border-white/5 flex flex-col items-center py-4 gap-4 overflow-y-auto hide-scrollbar z-40">
      {/* Home / DMs */}
      <div className="relative group w-full flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setView('dms');
            if (profile) set(ref(db, `users/${profile.uid}/currentServer`), null);
          }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
            view === 'dms' ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          <MessageCircle size={22} />
        </motion.button>
        {view === 'dms' && (
          <motion.div layoutId="active-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
        )}
      </div>

      <div className="w-10 h-px bg-white/10" />

      {/* Servers */}
      <div className="flex flex-col gap-3 w-full items-center">
        {servers.map((server) => (
          <div key={server.id} className="relative group w-full flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectServer(server.id)}
              className={`w-12 h-12 rounded-xl overflow-hidden relative shadow-sm transition-all ${
                selectedServerId === server.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 shadow-indigo-500/20' : 'hover:ring-2 hover:ring-zinc-700 hover:ring-offset-2 hover:ring-offset-zinc-950'
              }`}
            >
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center text-zinc-300 font-medium text-lg">
                  {server.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Frame overlay */}
              {server.frame === 'gold' && (
                <div className="absolute inset-0 border-2 border-yellow-500/80 rounded-[inherit] pointer-events-none" />
              )}
              {server.frame === 'neon' && (
                <div className="absolute inset-0 border-2 border-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.5)] rounded-[inherit] pointer-events-none" />
              )}
            </motion.button>
            {selectedServerId === server.id && (
              <motion.div layoutId="active-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
            )}
            {selectedServerId !== server.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-5 bg-zinc-600 rounded-r-full transition-all duration-200" />
            )}
          </div>
        ))}
      </div>

      {/* Add Server */}
      <div className="relative group w-full flex justify-center mt-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-800/50 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors"
        >
          <Plus size={22} />
        </motion.button>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-3 w-full items-center pb-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setProfileModalOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors overflow-hidden border border-white/5"
          title="Profile"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={18} />
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => auth.signOut()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-colors"
          title="Sign Out"
        >
          <LogOut size={16} />
        </motion.button>
      </div>

      {/* Create Server Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative z-10"
            >
              <h2 className="text-xl font-semibold mb-2 text-white">Create a Workspace</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Set up a new space for your team or community to collaborate.
              </p>
              <form onSubmit={handleCreateServer}>
                <div className="mb-6">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Design Team"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Create Workspace
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
