import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: User) => {
    setLoading(true);

    // Super Admin bypass
    const superAdmins = ['superadmin@vyarahr.com', 'superadmin@gmail.com', 'praveen12rangasamy@gmail.com', 'pranavanandan18@gmail.com', 'pranavananthan18@gmail.com', 'jin@gmail.com'];
    if (currentUser.email && superAdmins.includes(currentUser.email.trim().toLowerCase())) {
      const superProfile = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Super Admin',
        email: currentUser.email || '',
        role: 'superadmin',
        designation: 'Super Administrator',
        department: 'Management'
      };
      setProfile(superProfile);
      setLoading(false);
      
      // Use onConflict:'email' so if a row with this email already exists (possibly with a
      // different id from a previous session), it updates that row's id to match the current
      // auth.uid(). This keeps auth.uid() == profiles.id in sync for RLS to work correctly.
      supabase
        .from('profiles')
        .upsert(superProfile, { onConflict: 'email' })
        .then(({ error }) => {
          if (error) console.warn('Background superadmin profile sync note:', error.message);
        });
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Profile not found! Auto-create one for manually created user (Admin)
      const metadataRole = currentUser.user_metadata?.role;
      const role = metadataRole === 'superadmin' ? 'superadmin' : (metadataRole === 'employee' ? 'employee' : 'admin');
      
      const newProfile = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Admin',
        email: currentUser.email || '',
        role: role,
        designation: role === 'superadmin' ? 'Super Administrator' : (role === 'admin' ? 'HR Administrator' : 'Employee'),
        department: role === 'superadmin' ? 'Management' : 'HR'
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (!insertError) {
        setProfile(insertedData);
      } else {
        console.error('Failed to auto-create profile:', insertError);
      }
    } else if (!error) {
      setProfile(data);
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
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
