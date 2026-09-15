import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTenantMeta, isPlatformMode } from '../lib/supabase';

interface TenantContextType {
  slug: string;
  name: string;
  mode: 'platform' | 'organization';
  supabaseUrl: string;
  isReady: boolean;
  updateTenantInfo: (slug: string, name: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'platform' | 'organization'>('organization');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [isReady, setIsReady] = useState(false);

  const syncWithSupabaseMeta = () => {
    const meta = getTenantMeta();
    setSlug(meta.slug);
    setName(meta.name);
    setSupabaseUrl(meta.url);
    setMode(isPlatformMode() ? 'platform' : 'organization');
  };

  useEffect(() => {
    syncWithSupabaseMeta();
    setIsReady(true);
  }, []);

  const updateTenantInfo = (newSlug: string, newName: string) => {
    // If slug is platform code, force platform mode
    if (newSlug === 'vyarahr-platform') {
      setSlug(newSlug);
      setName('VyaraHR Platform');
      setMode('platform');
    } else {
      setSlug(newSlug);
      setName(newName);
      setMode('organization');
    }
    const meta = getTenantMeta();
    setSupabaseUrl(meta.url);
  };

  return (
    <TenantContext.Provider value={{ slug, name, mode, supabaseUrl, isReady, updateTenantInfo }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
