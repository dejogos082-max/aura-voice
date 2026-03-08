import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ref, get, update } from 'firebase/database';
import { db } from '../lib/firebase';

export default function Invite() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthStore();
  const [error, setError] = useState('');
  const [serverName, setServerName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Redirect to login, but maybe save the invite link to redirect back later?
      // For simplicity, just redirect to login
      navigate('/login');
      return;
    }

    const fetchServer = async () => {
      if (!serverId) {
        setError('Invalid invite link');
        return;
      }

      try {
        const serverRef = ref(db, `servers/${serverId}`);
        const snap = await get(serverRef);
        
        if (!snap.exists()) {
          setError('Server not found or invite is invalid');
          return;
        }

        setServerName(snap.val().name);
      } catch (err: any) {
        setError('Failed to load server info');
      }
    };

    fetchServer();
  }, [serverId, user, loading, navigate]);

  const handleJoin = async () => {
    if (!profile || !serverId) return;
    setJoining(true);

    try {
      const memberRef = ref(db, `servers/${serverId}/members`);
      await update(memberRef, {
        [profile.uid]: true
      });
      
      // Redirect to main app
      navigate('/');
    } catch (err: any) {
      setError('Failed to join server: ' + err.message);
      setJoining(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">👋</span>
        </div>
        
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-zinc-400 mb-8">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">You've been invited to join</h1>
            <p className="text-xl font-medium text-indigo-400 mb-8">{serverName || 'Loading...'}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleJoin}
                disabled={joining || !serverName}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Accept Invite
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
