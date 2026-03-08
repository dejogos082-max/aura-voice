import { create } from 'zustand';

export type ViewType = 'dms' | 'server';

interface AppState {
  view: ViewType;
  selectedServerId: string | null;
  selectedChannelId: string | null;
  selectedDmId: string | null; // This is the UID of the friend
  
  // Mobile UI State
  isMobileMenuOpen: boolean;
  
  // Modals
  isProfileModalOpen: boolean;
  
  // Call State
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  callPartnerId: string | null;
  callRoomId: string | null;
  
  setView: (view: ViewType) => void;
  selectServer: (serverId: string | null) => void;
  selectChannel: (channelId: string | null) => void;
  selectDm: (dmId: string | null) => void;
  
  toggleMobileMenu: () => void;
  setProfileModalOpen: (open: boolean) => void;
  
  startCall: (partnerId: string, type: 'audio' | 'video', roomId: string) => void;
  endCall: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dms',
  selectedServerId: null,
  selectedChannelId: null,
  selectedDmId: null,
  
  isMobileMenuOpen: false,
  
  isProfileModalOpen: false,
  
  isInCall: false,
  callType: null,
  callPartnerId: null,
  callRoomId: null,
  
  setView: (view) => set({ view, isMobileMenuOpen: false }),
  selectServer: (serverId) => {
    set({ selectedServerId: serverId, view: 'server', selectedDmId: null });
    // Also update in Firebase if needed, but we don't have direct access to uid here without auth store.
    // Let's just keep it in local state for now, or we can update it from the component.
  },
  selectChannel: (channelId) => set({ selectedChannelId: channelId, isMobileMenuOpen: false }),
  selectDm: (dmId) => set({ selectedDmId: dmId, view: 'dms', selectedServerId: null, selectedChannelId: null, isMobileMenuOpen: false }),
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  
  startCall: (partnerId, type, roomId) => set({ isInCall: true, callPartnerId: partnerId, callType: type, callRoomId: roomId }),
  endCall: () => set({ isInCall: false, callPartnerId: null, callType: null, callRoomId: null }),
}));
