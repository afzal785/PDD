import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or ANON KEY is missing. Check .env configuration.');
}

// Use localStorage on web, AsyncStorage on native
const webStorage = {
  getItem: (key) => Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key, value) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); return Promise.resolve(); },
  removeItem: (key) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); return Promise.resolve(); },
};

const storageAdapter = Platform.OS === 'web' ? webStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
