// src/lib/supabase.js — Supabase client (Express backend'i tamamen replace eder)
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error('❌ VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY eksik! .env.local dosyasını kontrol et.');
}

export const supabase = createClient(URL, KEY);
