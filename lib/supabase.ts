import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
// Support both the legacy ANON_KEY name and the new PUBLISHABLE_KEY name from the Supabase dashboard
export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const memoryStore = new Map<string, string>();

// Wrap AsyncStorage calls with a fallback to in-memory storage.
// The native module can be null when running in Expo Go without a native build.
const ssrSafeStorage: SupportedStorage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return memoryStore.get(key) ?? null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      memoryStore.set(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      memoryStore.delete(key);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
