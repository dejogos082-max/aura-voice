import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, onDisconnect, set } from 'firebase/database';
import { auth, db } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Main from './pages/Main';
import Invite from './pages/Invite';

import ServerSettings from './pages/ServerSettings';

export default function App() {
  const { user, loading, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        // Handle presence
        const connectedRef = ref(db, '.info/connected');
        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            const statusRef = ref(db, `users/${firebaseUser.uid}/status`);
            const lastSeenRef = ref(db, `users/${firebaseUser.uid}/lastSeen`);
            
            onDisconnect(statusRef).set('offline');
            onDisconnect(lastSeenRef).set(Date.now());
            
            set(statusRef, 'online');
          }
        });

        // Listen to profile changes
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ uid: firebaseUser.uid, ...snapshot.val() });
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Main /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/invite/:serverId" element={<Invite />} />
        <Route path="/server/:serverId/settings" element={user ? <ServerSettings /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
