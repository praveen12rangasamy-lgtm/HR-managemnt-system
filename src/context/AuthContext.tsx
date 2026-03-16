import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setMockUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock session first
    const savedMock = localStorage.getItem('mock_hr_session');
    if (savedMock) {
      const mockData = JSON.parse(savedMock);
      setProfile(mockData);
      setLoading(false);
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Prioritize mock session if it exists
      if (localStorage.getItem('mock_hr_session')) {
        const mockData = JSON.parse(localStorage.getItem('mock_hr_session')!);
        setProfile(mockData);
        setSession({ user: { email: mockData.email }, expires_at: 0, expires_in: 0, token_type: '', access_token: '', refresh_token: '' } as any);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If mock session is active, ignore Supabase session changes unless it's a specific "sign out" or "sign in" event that we want to handle
      if (localStorage.getItem('mock_hr_session')) {
        if (_event === 'SIGNED_OUT') {
           // If we manually signed out, keep the mock session
        }
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error) setProfile(data);
    setLoading(false);
  };

  const setMockUser = async (userData: any) => {
    if (userData) {
      // Clear real session to avoid confusion
      await supabase.auth.signOut();
      localStorage.setItem('mock_hr_session', JSON.stringify(userData));
      setProfile(userData);
      setSession({ user: { email: userData.email }, expires_at: 0, expires_in: 0, token_type: '', access_token: '', refresh_token: '' } as any);
    } else {
      localStorage.removeItem('mock_hr_session');
      if (!user) {
        setProfile(null);
        setSession(null);
      }
    }
  };

  const signOut = async () => {
    localStorage.removeItem('mock_hr_session');
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, setMockUser }}>
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
