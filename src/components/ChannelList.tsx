import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChannels } from '../hooks/useChannels';
import { channelService } from '../services/channelService';
import { voiceService } from '../services/voiceService';
import { Hash, Volume2, UserPlus2, Plus, ChevronDown, ChevronRight, Settings, FolderPlus } from 'lucide-react';
import InviteModal from './InviteModal';

export default function ChannelList({ serverName }: { serverName: string }) {
  const navigate = useNavigate();
  const { selectedServerId, selectedChannelId, selectChannel } = useAppStore();
  const { profile } = useAuthStore();
  const { channels } = useChannels(selectedServerId);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'category'>('text');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServerId || !newChannelName.trim()) return;

    await channelService.createChannel(selectedServerId, newChannelName, newChannelType, selectedCategoryId);
    setNewChannelName('');
    setShowCreateChannel(false);
  };

  const handleChannelClick = async (channelId: string, type: string) => {
    if (type === 'category') return; // Categories are just headers for now
    selectChannel(channelId);
    if (type === 'voice' && profile) {
      await voiceService.joinVoiceChannel(channelId, profile.uid);
    }
  };

  const categories = channels.filter(c => c.type === 'category');
  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  return (
    <div className="w-60 bg-zinc-900 flex flex-col border-r border-zinc-800 h-full">
      <div className="h-12 flex items-center justify-between px-4 font-bold text-white shadow-sm border-b border-zinc-800 truncate">
        <span className="truncate">{serverName}</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setNewChannelType('category'); setShowCreateChannel(true); }}
            className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            title="Create Category"
          >
            <FolderPlus size={18} />
          </button>
          <button 
            onClick={() => navigate(`/server/${selectedServerId}/settings`)}
            className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            title="Server Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            title="Invite People"
          >
            <UserPlus2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Dynamic Categories (if any) */}
        {categories.map(category => {
          const catTextChannels = textChannels.filter(c => c.categoryId === category.id);
          const catVoiceChannels = voiceChannels.filter(c => c.categoryId === category.id);
          
          return (
            <div key={category.id}>
              <div className="flex items-center justify-between px-1 mb-1 group">
                <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 hover:text-zinc-300 cursor-pointer">
                  <ChevronDown size={12} /> {category.name}
                </h3>
                <button 
                  onClick={() => { setSelectedCategoryId(category.id); setNewChannelType('text'); setShowCreateChannel(true); }}
                  className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {catTextChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel.id, channel.type)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                      selectedChannelId === channel.id ? 'bg-zinc-800 text-white' : ''
                    }`}
                  >
                    <Hash size={18} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
                {catVoiceChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel.id, channel.type)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                      selectedChannelId === channel.id ? 'bg-zinc-800 text-white' : ''
                    }`}
                  >
                    <Volume2 size={18} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Default Text Channels */}
        {textChannels.filter(c => !c.categoryId).length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-1 group">
              <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 hover:text-zinc-300 cursor-pointer">
                <ChevronDown size={12} /> Text Channels
              </h3>
              <button 
                onClick={() => { setSelectedCategoryId(null); setNewChannelType('text'); setShowCreateChannel(true); }}
                className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {textChannels.filter(c => !c.categoryId).map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id, channel.type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                    selectedChannelId === channel.id ? 'bg-zinc-800 text-white' : ''
                  }`}
                >
                  <Hash size={18} />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Default Voice Channels */}
        {voiceChannels.filter(c => !c.categoryId).length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-1 group">
              <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 hover:text-zinc-300 cursor-pointer">
                <ChevronDown size={12} /> Voice Channels
              </h3>
              <button 
                onClick={() => { setSelectedCategoryId(null); setNewChannelType('voice'); setShowCreateChannel(true); }}
                className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {voiceChannels.filter(c => !c.categoryId).map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id, channel.type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
                    selectedChannelId === channel.id ? 'bg-zinc-800 text-white' : ''
                  }`}
                >
                  <Volume2 size={18} />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {selectedServerId && (
        <InviteModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
          serverId={selectedServerId} 
          serverName={serverName} 
        />
      )}

      {/* Create Channel/Category Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-center">
              {newChannelType === 'category' ? 'Create Category' : 'Create Channel'}
            </h2>
            <form onSubmit={handleCreateChannel}>
              {newChannelType !== 'category' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                    Channel Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewChannelType('text')}
                      className={`flex-1 py-2 rounded flex items-center justify-center gap-2 ${newChannelType === 'text' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                    >
                      <Hash size={18} /> Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChannelType('voice')}
                      className={`flex-1 py-2 rounded flex items-center justify-center gap-2 ${newChannelType === 'voice' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                    >
                      <Volume2 size={18} /> Voice
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  {newChannelType === 'category' ? 'Category Name' : 'Channel Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(newChannelType === 'category' ? e.target.value : e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-zinc-900 border-none rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={newChannelType === 'category' ? 'New Category' : 'new-channel'}
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="text-zinc-400 hover:underline px-4 py-2"
                >
                  Cancel
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
