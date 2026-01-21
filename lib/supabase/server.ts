import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side operations.
 * Uses the SERVICE_ROLE key to bypass RLS for backend processing.
 */
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('[SUPABASE] No SERVICE_ROLE_KEY found, falling back to anon key (RLS will apply)');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
};
