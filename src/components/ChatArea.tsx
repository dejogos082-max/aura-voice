import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ref, onValue, push, set, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { uploadService } from '../services/uploadService';
import { Send, Phone, Video, Image as ImageIcon, Paperclip, File } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import FileUpload from './FileUpload';

export default function ChatArea() {
  const { view, selectedChannelId, selectedServerId, selectedDmId } = useAppStore();
  const { profile } = useAuthStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatName, setChatName] = useState('Chat');
  const [chatId, setChatId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine chat context
  useEffect(() => {
    if (view === 'server' && selectedChannelId && selectedServerId) {
      setChatId(selectedChannelId);
      
      const channelRef = ref(db, `channels/${selectedServerId}/${selectedChannelId}`);
      get(channelRef).then(snap => {
        if (snap.exists()) setChatName(`# ${snap.val().name}`);
      });
      
    } else if (view === 'dms' && selectedDmId && profile) {
      // Find DM chat ID
      const dmsRef = ref(db, `dms/${profile.uid}`);
      get(dmsRef).then(async snap => {
        if (snap.exists()) {
          const dms = snap.val();
          const existingDm = Object.entries(dms).find(([_, id]) => id === selectedDmId);
          if (existingDm) {
            setChatId(existingDm[0]);
          }
        }
        
        const userRef = ref(db, `users/${selectedDmId}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          setChatName(`@${userSnap.val().username}`);
        }
      });
    }
  }, [view, selectedChannelId, selectedServerId, selectedDmId, profile]);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;

    const messagesPath = view === 'server' ? `messages/${chatId}` : `dm_messages/${chatId}`;
    const messagesRef = ref(db, messagesPath);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }
      
      const msgList = Object.entries(data).map(([id, msg]: [string, any]) => ({
        id,
        ...msg
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      // Fetch sender details
      const fetchSenders = async () => {
        const enrichedMsgs = await Promise.all(msgList.map(async (msg) => {
          const userSnap = await get(ref(db, `users/${msg.senderId}`));
          return { ...msg, sender: userSnap.val() };
        }));
        
        setMessages(enrichedMsgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      };
      
      fetchSenders();
    });

    return () => unsubscribe();
  }, [chatId, view]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !chatId || !newMessage.trim()) return;

    const messagesPath = view === 'server' ? `messages/${chatId}` : `dm_messages/${chatId}`;
    const newMsgRef = push(ref(db, messagesPath));
    
    await set(newMsgRef, {
      senderId: profile.uid,
      text: newMessage,
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!profile || !chatId) return;
    
    // Create a unique room ID for the call
    const roomId = `${chatId}_call`;
    
    // Use the store to start the call
    // We pass the partner ID if it's a DM, otherwise null for group
    const partnerId = view === 'dms' ? selectedDmId : null;
    
    useAppStore.getState().startCall(partnerId || '', type, roomId);
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Loading chat...
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={chatId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        {/* Header */}
        <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shadow-sm bg-zinc-800 z-10 shrink-0">
          <div className="font-bold text-white flex items-center gap-2">
            {chatName}
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => startCall('audio')} className="hover:text-zinc-200 transition-colors" title="Voice Call">
              <Phone size={20} />
            </button>
            <button onClick={() => startCall('video')} className="hover:text-zinc-200 transition-colors" title="Video Call">
              <Video size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-800">
          {messages.map((msg, index) => {
            const isConsecutive = index > 0 && messages[index - 1].senderId === msg.senderId && (msg.timestamp - messages[index - 1].timestamp < 300000); // 5 mins
            
            return (
              <div key={msg.id} className={`flex gap-4 hover:bg-zinc-700/30 px-2 py-1 -mx-2 rounded ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                {!isConsecutive ? (
                  <img src={msg.sender?.avatarUrl} alt={msg.sender?.username} className="w-10 h-10 rounded-full bg-zinc-700 mt-0.5" />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0" />
                )}
                
                <div className="flex flex-col flex-1 min-w-0">
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-indigo-400 hover:underline cursor-pointer">
                        {msg.sender?.displayName}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(msg.timestamp), 'MM/dd/yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  {msg.mediaUrl ? (
                    <div className="mt-1">
                      {msg.mediaType === 'image' && (
                        <img src={msg.mediaUrl} alt="attachment" className="max-w-sm max-h-80 rounded-lg object-contain bg-zinc-900" />
                      )}
                      {msg.mediaType === 'video' && (
                        <video src={msg.mediaUrl} controls className="max-w-sm max-h-80 rounded-lg bg-zinc-900" />
                      )}
                      {msg.mediaType === 'file' && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-colors w-fit border border-zinc-700">
                          <File size={24} className="text-indigo-400" />
                          <span className="text-zinc-200 underline">{msg.fileName}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-200 break-words whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-zinc-800 shrink-0">
          <form onSubmit={handleSendMessage} className="bg-zinc-700 rounded-lg flex items-center px-4 py-2 gap-2 relative">
            <FileUpload
              onUpload={async (file) => {
                if (!profile || !chatId) return;
                await uploadService.uploadMessageFile(file, chatId, profile.uid, view === 'dms');
              }}
              className="flex-shrink-0"
            >
              <button 
                type="button" 
                className="text-zinc-400 hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-600 transition-colors"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
            </FileUpload>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${chatName}`}
              className="flex-1 bg-transparent border-none focus:outline-none text-zinc-200 placeholder-zinc-500 py-2"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="text-indigo-400 hover:text-indigo-300 disabled:text-zinc-500 disabled:hover:text-zinc-500 p-2 rounded-full hover:bg-zinc-600 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
