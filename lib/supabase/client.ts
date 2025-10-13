import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let client: SupabaseClient<Database> | null = null;
let currentUrl: string | null = null;
let currentKey: string | null = null;

export const createBrowserClient = (): SupabaseClient<Database> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (client && currentUrl === url && currentKey === key) {
    return client;
  }

  client = createClient<Database>(url, key);
  currentUrl = url;
  currentKey = key;

  return client;
};

