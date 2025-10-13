'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<Database['public']['Tables']['profiles']['Update']>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create supabase client once outside the component to prevent infinite loops
const supabase = createBrowserClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('[AuthContext] Session retrieved:', {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          email: initialSession?.user?.email,
          expiresAt: initialSession?.expires_at ? new Date(initialSession.expires_at * 1000).toISOString() : null,
        });

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          console.log('[AuthContext] Fetching user profile...');
          await fetchProfile(initialSession.user.id);
        } else {
          console.log('[AuthContext] No user session found');
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        console.log('[AuthContext] Authentication initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('[AuthContext] Auth state changed:', {
        event: _event,
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
      });

      (async () => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          console.log('[AuthContext] User logged in, fetching profile...');
          await fetchProfile(currentSession.user.id);
        } else {
          console.log('[AuthContext] User logged out, clearing profile');
          setProfile(null);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  const fetchProfile = async (userId: string) => {
    console.log(`[AuthContext] Fetching profile for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        return;
      }

      const profileData = data as Database['public']['Tables']['profiles']['Row'] | null;

      console.log('[AuthContext] Profile loaded:', {
        hasProfile: !!profileData,
        fullName: profileData?.full_name,
      });
      setProfile(profileData);
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Attempting sign in:', { email });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in failed:', error.message);
        throw error;
      }

      console.log('[AuthContext] Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    console.log('[AuthContext] Sign out complete');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateProfile = async (updateData: Partial<Database['public']['Tables']['profiles']['Update']>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const result = await supabase
        .from('profiles')
        // @ts-expect-error - Type mismatch with Supabase generated types
        .update(updateData)
        .eq('id', user.id);

      const { error } = result;

      if (error) throw error;

      await fetchProfile(user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
