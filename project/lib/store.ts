import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Message, Room, Location } from '@/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Chat state
  messages: Record<string, Message[]>;
  activeRoom: Room | null;
  typingUsers: Record<string, string[]>;
  
  // Location state
  currentLocation: Location | null;
  nearbyUsers: User[];
  
  // App state
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  soundEnabled: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  addMessage: (roomId: string, message: Message) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  setActiveRoom: (room: Room | null) => void;
  addTypingUser: (roomId: string, userId: string) => void;
  removeTypingUser: (roomId: string, userId: string) => void;
  
  setCurrentLocation: (location: Location | null) => void;
  setNearbyUsers: (users: User[]) => void;
  
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  messages: {},
  activeRoom: null,
  typingUsers: {},
  currentLocation: null,
  nearbyUsers: [],
  theme: 'auto' as const,
  notifications: true,
  soundEnabled: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      addMessage: (roomId, message) => set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: [...(state.messages[roomId] || []), message]
        }
      })),
      
      setMessages: (roomId, messages) => set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: messages
        }
      })),
      
      setActiveRoom: (room) => set({ activeRoom: room }),
      
      addTypingUser: (roomId, userId) => set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomId]: [...(state.typingUsers[roomId] || []).filter(id => id !== userId), userId]
        }
      })),
      
      removeTypingUser: (roomId, userId) => set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomId]: (state.typingUsers[roomId] || []).filter(id => id !== userId)
        }
      })),
      
      setCurrentLocation: (location) => set({ currentLocation: location }),
      setNearbyUsers: (users) => set({ nearbyUsers: users }),
      
      setTheme: (theme) => set({ theme }),
      setNotifications: (notifications) => set({ notifications }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'hoodly-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
); 