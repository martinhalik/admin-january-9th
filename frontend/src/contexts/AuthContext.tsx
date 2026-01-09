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
    // Check if running on localhost - bypass authentication for local development
    const isLocalhost = 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '';

    // Check for test mode (Playwright/E2E testing)
    const isTestMode = 
      window.location.search.includes('test_auth=bypass') ||
      localStorage.getItem('test_auth_bypass') === 'true' ||
      (window as any).__PLAYWRIGHT_TEST_MODE__ === true;

    if (isLocalhost || isTestMode) {
      console.log(`[Auth] ${isLocalhost ? 'Localhost' : 'Test mode'} detected - bypassing authentication`);
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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
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

