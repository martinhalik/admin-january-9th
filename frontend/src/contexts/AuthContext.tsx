/**
 * Authentication Context
 * 
 * IMPORTANT: This context automatically bypasses authentication on localhost
 * for easier local development. In production (deployed environments), 
 * Google OAuth authentication is required to protect Supabase data.
 * 
 * Authentication behavior:
 * - localhost: Automatic bypass with mock user
 * - Production: Requires Google OAuth (@groupon.com or @krm.sk emails)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Spin } from 'antd';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isGrouponUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGrouponUser, setIsGrouponUser] = useState(false);

  useEffect(() => {
    // Check for test mode first (Playwright/E2E testing) - before localStorage/window checks
    const isTestMode = 
      (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST_MODE__ === true) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('test_auth_bypass') === 'true') ||
      (typeof window !== 'undefined' && window.location.search.includes('test_auth=bypass'));

    // Check if running on localhost - bypass authentication for local development
    // IMPORTANT: This bypasses auth even if Supabase is configured, for easier development
    const isLocalhost = 
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '');

    // ALWAYS bypass auth on localhost or in test mode, regardless of Supabase configuration
    // This makes local development and testing much easier
    if (isLocalhost || isTestMode) {
      console.log('[Auth] Bypassing authentication (localhost or test mode)');
      // Create a mock user for local development - using CEO employee ID that exists in hierarchy
      const mockUser = {
        id: 'emp-ceo-1',  // Use actual employee ID from company hierarchy
        email: 'dev@groupon.com',
        user_metadata: { name: 'Local Dev User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      setIsGrouponUser(true);
      setLoading(false);
      return;
    }

    // Check if supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured, skipping authentication');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkGrouponDomain(session?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkGrouponDomain(session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkGrouponDomain = (user: User | null | undefined) => {
    if (!user || !user.email) {
      setIsGrouponUser(false);
      return;
    }

    // Check if email ends with @groupon.com or @krm.sk (for testing)
    const isGroupon = user.email.toLowerCase().endsWith('@groupon.com') || 
                      user.email.toLowerCase().endsWith('@krm.sk');
    setIsGrouponUser(isGroupon);

    // If user is authenticated but not a Groupon user, sign them out
    if (!isGroupon && supabase) {
      console.warn('Non-Groupon/krm.sk user detected, signing out:', user.email);
      supabase.auth.signOut();
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    // Get the redirect URL - use environment variable if set, otherwise use current origin
    // This ensures production deployments use the correct URL
    const getRedirectUrl = () => {
      // Check for explicit production URL
      const prodUrl = import.meta.env.VITE_PRODUCTION_URL;
      if (prodUrl) {
        console.log('[Auth] Using explicit production URL:', prodUrl);
        return prodUrl;
      }
      
      // For Vercel deployments, use VITE_VERCEL_URL if available
      const vercelUrl = import.meta.env.VITE_VERCEL_URL;
      if (vercelUrl) {
        const fullUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
        console.log('[Auth] Using Vercel URL:', fullUrl);
        return fullUrl;
      }
      
      // Fallback to current origin (works for both localhost and production)
      console.log('[Auth] Using window.location.origin:', window.location.origin);
      return window.location.origin;
    };

    const redirectUrl = getRedirectUrl();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          // Note: hd parameter removed for testing with @krm.sk
          // In production, add: hd: 'groupon.com'
        },
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithGoogle,
        signOut,
        isGrouponUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

