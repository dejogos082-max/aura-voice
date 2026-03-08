import { create } from 'zustand';

export type ViewType = 'dms' | 'server';

interface AppState {
  view: ViewType;
  selectedServerId: string | null;
  selectedChannelId: string | null;
  selectedDmId: string | null; // This is the UID of the friend
  
  // Call State
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  callPartnerId: string | null;
  callRoomId: string | null;
  
  setView: (view: ViewType) => void;
  selectServer: (serverId: string | null) => void;
  selectChannel: (channelId: string | null) => void;
  selectDm: (dmId: string | null) => void;
  
  startCall: (partnerId: string, type: 'audio' | 'video', roomId: string) => void;
  endCall: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dms',
  selectedServerId: null,
  selectedChannelId: null,
  selectedDmId: null,
  
  isInCall: false,
  callType: null,
  callPartnerId: null,
  callRoomId: null,
  
  setView: (view) => set({ view }),
  selectServer: (serverId) => set({ selectedServerId: serverId, view: 'server', selectedDmId: null }),
  selectChannel: (channelId) => set({ selectedChannelId: channelId }),
  selectDm: (dmId) => set({ selectedDmId: dmId, view: 'dms', selectedServerId: null, selectedChannelId: null }),
  
  startCall: (partnerId, type, roomId) => set({ isInCall: true, callPartnerId: partnerId, callType: type, callRoomId: roomId }),
  endCall: () => set({ isInCall: false, callPartnerId: null, callType: null, callRoomId: null }),
}));
