import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'dnd' | 'incall';
  lastSeen: number;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  loading: true,
  setLoading: (loading) => set({ loading }),
}));
