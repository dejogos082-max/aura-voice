import React from 'react';
import Sidebar from '../components/Sidebar';
import SecondarySidebar from '../components/SecondarySidebar';
import ChatArea from '../components/ChatArea';
import CallArea from '../components/CallArea';
import CallNotification from '../components/CallNotification';
import { useAppStore } from '../store/useAppStore';

export default function Main() {
  const { selectedChannelId, selectedDmId, isInCall } = useAppStore();

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden relative">
      <Sidebar />
      <SecondarySidebar />
      
      <div className="flex-1 flex flex-col bg-zinc-800 relative">
        <CallNotification />
        
        {(selectedChannelId || selectedDmId) ? (
          <ChatArea />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p>Select a channel or friend to start chatting</p>
            </div>
          </div>
        )}
        
        {isInCall && <CallArea />}
      </div>
    </div>
  );
}
