import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, get, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  serverName: string;
}

export default function InviteModal({ isOpen, onClose, serverId, serverName }: InviteModalProps) {
  const { profile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const inviteLink = `${window.location.origin}/invite/${serverId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) return;

    try {
      const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
      const snap = await get(usernameRef);
      
      if (!snap.exists()) {
        setError('User not found');
        return;
      }
      
      const targetUserId = snap.val();
      
      // Add user to server members
      const memberRef = ref(db, `servers/${serverId}/members`);
      await update(memberRef, {
        [targetUserId]: true
      });
      
      setSuccess(`Successfully invited ${username}!`);
      setUsername('');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800 p-6"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-white mb-2">Invite friends to {serverName}</h2>
          <p className="text-sm text-zinc-400 mb-6">Send a server invite link to a friend or invite them directly.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <Check size={16} /> {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
              Send a server invite link to a friend
            </label>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-300 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  copied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Your invite link will never expire.
            </p>
          </div>

          <div className="relative flex items-center py-2 mb-4">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs font-medium uppercase">Or</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <form onSubmit={handleInvite}>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
              Invite directly by username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!username.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
