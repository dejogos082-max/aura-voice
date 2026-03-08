import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, update, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { uploadService } from '../services/uploadService';
import { X, Upload, Copy, Check, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function ServerSettings() {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'invites'>('overview');
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [frame, setFrame] = useState('none');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverId) {
      get(ref(db, `servers/${serverId}`)).then(snap => {
        if (snap.exists()) {
          const data = snap.val();
          setName(data.name);
          setIconUrl(data.icon || '');
          setFrame(data.frame || 'none');
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [serverId]);

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId) return;
    
    await update(ref(db, `servers/${serverId}`), {
      name,
      frame
    });
    navigate('/');
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !serverId || !user) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadServerIcon(file, serverId, user.uid);
      setIconUrl(url);
    } catch (error) {
      console.error('Error uploading icon:', error);
    } finally {
      setUploading(false);
    }
  };

  const inviteLink = `${window.location.origin}/invite/${serverId}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-zinc-900 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-zinc-800/50 p-4 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xs font-bold text-zinc-400 uppercase truncate">{name} Settings</h2>
        </div>
        
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap text-left px-3 py-2 rounded transition-colors ${activeTab === 'overview' ? 'bg-zinc-700/50 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`whitespace-nowrap text-left px-3 py-2 rounded transition-colors ${activeTab === 'roles' ? 'bg-zinc-700/50 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`whitespace-nowrap text-left px-3 py-2 rounded transition-colors ${activeTab === 'invites' ? 'bg-zinc-700/50 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          >
            Invites
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        <button onClick={() => navigate('/')} className="hidden md:flex absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors items-center justify-center w-8 h-8 rounded-full border border-zinc-700 hover:bg-zinc-800">
          <X size={18} />
        </button>

        {activeTab === 'overview' && (
          <div className="max-w-xl mx-auto md:mx-0">
            <h1 className="text-2xl font-bold text-white mb-8">Server Overview</h1>
            
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className={`relative w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-4 ${frame === 'gold' ? 'border-yellow-500' : frame === 'neon' ? 'border-cyan-500' : 'border-transparent'}`}>
                  {iconUrl ? (
                    <img src={iconUrl} alt="Server Icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-500 font-bold text-2xl">{name.charAt(0)}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleIconUpload} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Upload size={16} /> Change Icon
                </button>
              </div>

              <form onSubmit={handleSaveOverview} className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Server Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Profile Frame</label>
                  <select
                    value={frame}
                    onChange={(e) => setFrame(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="none">None</option>
                    <option value="gold">Gold Border</option>
                    <option value="neon">Neon Cyan</option>
                  </select>
                </div>

                <button type="submit" className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded font-medium transition-colors">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="max-w-xl mx-auto md:mx-0">
            <h1 className="text-2xl font-bold text-white mb-8">Roles</h1>
            <p className="text-zinc-400 mb-4">Use roles to organize your members and customize their permissions.</p>
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-zinc-500" />
                <span className="font-medium text-white">@everyone</span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Default Role</span>
            </div>
            <button className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded font-medium transition-colors text-sm">
              Create Role
            </button>
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="max-w-xl mx-auto md:mx-0">
            <h1 className="text-2xl font-bold text-white mb-8">Invites</h1>
            <p className="text-zinc-400 mb-4">Share this link with others to grant them access to your server.</p>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <span className="text-indigo-400 font-mono break-all">{inviteLink}</span>
              <button
                onClick={handleCopyInvite}
                className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
