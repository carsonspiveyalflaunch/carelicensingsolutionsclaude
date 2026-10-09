"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  updateProfile: (updates: {
    first_name?: string | null;
    last_name?: string | null;
  }) => Promise<any>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  profileStatus: 'idle' | 'loading' | 'success' | 'failed';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const userIdRef = useRef<string | null>(null);

  const loadProfile = async (userId: string | null, retryCount = 0, force = false) => {
    if (!supabase || !userId) {
      setProfile(null);
      setProfileStatus('success');
      return;
    }

    // Check if we already have a successful profile for this user
    const cachedProfileKey = `admin-profile-${userId}`;
    const cachedProfile = sessionStorage.getItem(cachedProfileKey);
    if (!force && cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setProfile(parsed);
        setProfileStatus('success');
        return;
      } catch (e) {
        // Invalid cache, continue with load
      }
    }

    setProfileStatus('loading');

    try {
      const profilePromise = supabase
        .from('profiles')
        .select('first_name,last_name,is_admin')
        .eq('id', userId)
        .single();

      const timeoutMs = retryCount === 0 ? 10000 : 6000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), timeoutMs)
      );

      const { data, error } = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        const isNotFoundError =
          error?.message?.includes('No rows found') ||
          error?.message?.includes('Could not find') ||
          error?.details?.includes('Results contain 0 rows');

        if (isNotFoundError) {
          setProfile(null);
          setProfileStatus('success');
          sessionStorage.removeItem(cachedProfileKey);
          return;
        }

        if (retryCount < 2) {
          console.warn('Profile load error, retrying:', error.message);
          await new Promise((resolve) => setTimeout(resolve, 500));
          return loadProfile(userId, retryCount + 1, force);
        }

        console.warn('Unable to load profile after retry:', error.message);
        setProfile(null);
        setProfileStatus('failed');
        sessionStorage.removeItem(cachedProfileKey);
        return;
      }

      setProfile(data ?? null);
      setProfileStatus('success');
      sessionStorage.setItem(cachedProfileKey, JSON.stringify(data ?? null));
    } catch (err: any) {
      if (retryCount < 2 && err?.message === 'Profile load timeout') {
        console.warn('Profile load timeout, retrying:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return loadProfile(userId, retryCount + 1, force);
      }

      console.warn('Profile load error:', err?.message);
      setProfile(null);
      setProfileStatus('failed');
      sessionStorage.removeItem(`admin-profile-${userId}`);
    }
  };

  useEffect(() => {
    const supabaseClient = supabase;
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        const currentUserId = session?.user?.id ?? null;
        userIdRef.current = currentUserId;

        if (currentUserId) {
          await loadProfile(currentUserId);
        } else {
          setProfile(null);
          setProfileStatus('success');
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const previousUserId = userIdRef.current;
      const newUserId = session?.user?.id ?? null;
      
      setSession(session);
      setUser(session?.user ?? null);
      userIdRef.current = newUserId;
      
      if (newUserId) {
        const shouldLoadProfile = event === 'SIGNED_IN' || previousUserId !== newUserId;
        if (shouldLoadProfile) {
          await loadProfile(newUserId);
        }
      } else {
        setProfile(null);
        setProfileStatus('success');
        if (previousUserId) {
          sessionStorage.removeItem(`admin-profile-${previousUserId}`);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase) return { data: null, error: { message: 'Authentication not configured' } };
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: metadata,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { data: null, error: { message: 'Authentication not configured' } };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data) return { data, error };

    // After sign in, check profiles.is_active for this user and block if disabled
    try {
      const userId = data.user?.id ?? (await supabase.auth.getUser()).data?.user?.id;
      if (userId) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', userId)
          .single();

        if (!profileErr && profileData && profileData.is_active === false) {
          await supabase.auth.signOut();
          return { data: null, error: { message: 'This account has been disabled by an administrator.' } };
        }
      }
    } catch (err) {
      console.warn('Unable to verify profile is_active after sign-in', err);
    }

    return { data, error };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!supabase || !user) {
      return { data: null, error: { message: 'Authentication not configured' } };
    }

    if (!currentPassword || !newPassword) {
      return { data: null, error: { message: 'Please enter your current password and a new password.' } };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: currentPassword,
    });

    if (verifyError) {
      return { data: null, error: { message: 'Current password is incorrect.' } };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return { error: { message: 'Authentication not configured' } };
    
    // Clear local state first
    setProfile(null);
    setUser(null);
    setSession(null);
    setLoading(false);
    setProfileStatus('success');
    userIdRef.current = null;
    
    // Clear cached profile
    if (user?.id) {
      sessionStorage.removeItem(`admin-profile-${user.id}`);
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const updateProfile = async (updates: {
    first_name?: string | null;
    last_name?: string | null;
  }) => {
    if (!supabase || !user) {
      return { data: null, error: { message: 'Authentication not configured' } };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('first_name,last_name,is_admin')
      .single();

    if (!error && data) {
      const updatedProfile = { ...profile, ...data };
      setProfile(updatedProfile);
      if (user?.id) {
        sessionStorage.setItem(`admin-profile-${user.id}`, JSON.stringify(updatedProfile));
      }
    }

    return { data, error };
  };

  const value = {
    user,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    session,
    loading,
    profileStatus,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
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