import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, set, get, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { uploadService } from '../services/uploadService';
import { X, Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileModal() {
  const { isProfileModalOpen, setProfileModalOpen } = useAppStore();
  const { profile, setProfile } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isProfileModalOpen && profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setAvatarUrl(profile.avatarUrl);
      setError('');
      setSuccess('');
    }
  }, [isProfileModalOpen, profile]);

  if (!isProfileModalOpen || !profile) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const url = await uploadService.uploadAvatar(file, profile.uid);
      setAvatarUrl(url);
    } catch (err: any) {
      setError('Failed to upload avatar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates: any = {
        displayName,
        avatarUrl
      };

      // Check username change
      const newUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (newUsername !== profile.username) {
        const usernameRef = ref(db, `usernames/${newUsername}`);
        const snap = await get(usernameRef);
        
        if (snap.exists()) {
          setError('Username already taken');
          setLoading(false);
          return;
        }

        // Remove old username, add new
        await set(ref(db, `usernames/${profile.username}`), null);
        await set(usernameRef, profile.uid);
        updates.username = newUsername;
      }

      await update(ref(db, `users/${profile.uid}`), updates);
      
      setProfile({ ...profile, ...updates });
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setProfileModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
        >
          <div className="h-32 bg-indigo-600 w-full relative">
            <button 
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="px-6 pb-6 relative">
            <div className="absolute -top-12 left-6">
              <div className="relative group">
                <img 
                  src={avatarUrl} 
                  alt={profile.username} 
                  className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-zinc-800 object-cover"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={24} className="text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>
            
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
              
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

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Only lowercase letters, numbers, and underscores.
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
