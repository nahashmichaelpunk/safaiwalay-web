import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookingPricingMetadata } from '@/lib/service-pricing';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

interface ChatStore {
  messages: Message[];
  isOpen: boolean;
  isTyping: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChat = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isTyping: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),
      setIsOpen: (isOpen) => set({ isOpen }),
      setIsTyping: (isTyping) => set({ isTyping }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
    }
  )
);

export interface BookingItem {
  id: string;
  serviceName: string;
  serviceId: string;
  price: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Human-readable pricing breakdown (sq.ft / KW / tank slab / units) */
  pricingSummary?: string;
  /** Structured pricing details for cart/checkout display */
  pricingMetadata?: BookingPricingMetadata;
}

interface CartStore {
  items: BookingItem[];
  addItem: (item: BookingItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'cleaning_partner';
  emailVerified: boolean;
  isActive?: boolean;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'safaiwalay-auth',
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error saving auth state:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing auth state:', error);
          }
        },
      },
    }
  )
);