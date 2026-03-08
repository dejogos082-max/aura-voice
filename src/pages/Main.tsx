import React from 'react';
import SidebarServers from '../components/SidebarServers';
import SecondarySidebar from '../components/SecondarySidebar';
import ChatArea from '../components/ChatArea';
import CallArea from '../components/CallArea';
import CallNotification from '../components/CallNotification';
import ProfileModal from '../components/ProfileModal';
import VoicePanel from '../components/VoicePanel';
import { useAppStore } from '../store/useAppStore';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Main() {
  const { selectedChannelId, selectedDmId, isInCall, isMobileMenuOpen, toggleMobileMenu } = useAppStore();

  return (
    <div className="flex h-[100dvh] bg-zinc-900 text-white overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobileMenu}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebars Container */}
      <div className={`fixed md:relative z-30 h-full flex transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarServers />
        <SecondarySidebar />
      </div>
      
      <div className="flex-1 flex flex-col bg-zinc-800 relative min-w-0">
        <CallNotification />
        
        {/* Mobile Header */}
        <div className="md:hidden h-12 border-b border-zinc-800 flex items-center px-4 bg-zinc-800 z-10 shrink-0">
          <button 
            onClick={toggleMobileMenu}
            className="text-zinc-400 hover:text-white mr-4"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold truncate">AuraVoice</span>
        </div>
        
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
        <VoicePanel />
      </div>

      <ProfileModal />
    </div>
  );
}
