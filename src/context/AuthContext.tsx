import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, masterSupabase, isPlatformMode } from '../lib/supabase';
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

    // 1. Platform Mode check: if connected to Master Router, verify in platform_users
    if (isPlatformMode()) {
      try {
        const { data: platformUser, error: platformErr } = await masterSupabase
          .from('platform_users')
          .select('*')
          .eq('email', currentUser.email?.trim().toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (platformErr) {
          console.error('Error fetching platform admin:', platformErr);
        }

        if (platformUser) {
          const platformProfile = {
            id: currentUser.id,
            full_name: platformUser.full_name,
            email: platformUser.email,
            role: 'platform_admin',
            designation: 'Platform Administrator',
            department: 'Platform Operations'
          };
          setProfile(platformProfile);
          setLoading(false);
          return;
        } else {
          // If in platform mode but user is not a platform admin, deny access
          console.warn('Unauthorized platform login attempt.');
          setProfile(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Exception during platform user fetch:', err);
      }
    }

    // 2. Organization Mode: Query profiles table from active tenant
    const { data: tenantProfile, error: tenantErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', currentUser.email?.trim().toLowerCase())
      .maybeSingle();

    if (!tenantErr && tenantProfile) {
      setProfile(tenantProfile);
      setLoading(false);
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
