import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvValue = (val: any, fallback: string) => {
  if (!val || val === 'undefined' || val === 'null' || val === 'placeholder' || typeof val !== 'string') {
    return fallback;
  }
  return val;
};

export const MASTER_URL = ((import.meta as any).env?.VITE_MASTER_SUPABASE_URL || 'https://nxtjqpehfdutqnvbaodb.supabase.co').trim();
export const MASTER_KEY = ((import.meta as any).env?.VITE_MASTER_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dGpxcGVoZmR1dHFudmJhb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzI1MDYsImV4cCI6MjA5OTQwODUwNn0.J4jb1IorRLAGoKTF80fIbToDkmCvNDjXVNXwha-W-vs').trim();

// Retain backwards-compatibility
const masterUrl = MASTER_URL;
const masterKey = MASTER_KEY;

// Recognized slugs for platform / master router mode
export const PLATFORM_SLUGS = [
  'vyarahr-platform',
  'vyarahr',
  'master',
  'master-router',
  'masterrouter',
  'master router',
  'platform',
  'parent',
  'operator',
  'platform-admin',
  'admin',
  'owner'
];

export const isPlatformSlug = (slug: string): boolean => {
  if (!slug) return false;
  return PLATFORM_SLUGS.includes(slug.trim().toLowerCase());
};

// Master client to query tenant directory
export const masterSupabase = createClient(masterUrl, masterKey);
export const masterRouter = masterSupabase;

// Client used by Platform dashboard pages: the signed-in platform admin's session lives on the
// active client (which points at the master DB in platform mode), so prefer it over the anonymous
// masterRouter instance. Falls back to masterRouter outside platform mode.
export const platformDb: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const target: any = isPlatformMode() ? activeClient : masterSupabase;
    const v = target[prop];
    return typeof v === 'function' ? v.bind(target) : v;
  }
});

// Default fallback to VyaraHR client project
// Exported so LandingPage can use these as the source of truth instead of the database entry
export const DEFAULT_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://joqlxybxfivjpabvopxu.supabase.co').trim();
export const DEFAULT_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcWx4eWJ4Zml2anBhYnZvcHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzExNTEsImV4cCI6MjA4OTE0NzE1MX0.zxm1tXbZgeK_kf-A796ysDFREyS6thKW3DV8n-iBaNE').trim();

let activeUrl = (localStorage.getItem('selected_tenant_url') || DEFAULT_URL).trim();
let activeKey = (localStorage.getItem('selected_tenant_key') || DEFAULT_KEY).trim();

// Safety guards: force known-correct keys for default tenant & master platform
if (activeUrl === DEFAULT_URL) {
  activeKey = DEFAULT_KEY;
} else if (activeUrl.toLowerCase().replace(/\/$/, '') === masterUrl.toLowerCase().replace(/\/$/, '')) {
  activeKey = masterKey;
}

let activeClient: SupabaseClient = createClient(activeUrl, activeKey);

type TenantChangeListener = (url: string, key: string) => void;
const tenantChangeListeners: TenantChangeListener[] = [];

export const onTenantChange = (listener: TenantChangeListener) => {
  tenantChangeListeners.push(listener);
  return () => {
    const idx = tenantChangeListeners.indexOf(listener);
    if (idx !== -1) tenantChangeListeners.splice(idx, 1);
  };
};

export const switchTenant = (url: string, key: string) => {
  const cleanUrl = url.trim();
  const isMaster = cleanUrl.toLowerCase().replace(/\/$/, '') === masterUrl.toLowerCase().replace(/\/$/, '');
  const cleanKey = isMaster ? masterKey : (cleanUrl === DEFAULT_URL ? DEFAULT_KEY : key.trim());

  activeUrl = cleanUrl;
  activeKey = cleanKey;
  localStorage.setItem('selected_tenant_url', cleanUrl);
  localStorage.setItem('selected_tenant_key', cleanKey);
  activeClient = createClient(cleanUrl, cleanKey);
  
  // Notify listeners
  tenantChangeListeners.forEach(listener => listener(cleanUrl, cleanKey));
};

export const setTenantClient = (url: string, anonKey: string, slug?: string, name?: string) => {
  if (slug) {
    localStorage.setItem('selected_tenant_slug', slug);
  }
  if (name) {
    localStorage.setItem('selected_tenant_name', name);
  }
  switchTenant(url, anonKey);
};

export const resolveEffectiveSlug = (): string => {
  const cachedSlug = localStorage.getItem('selected_tenant_slug');
  if (cachedSlug && cachedSlug !== 'default' && !isPlatformSlug(cachedSlug)) {
    return cachedSlug;
  }
  return '';
};

// Clear active tenant and revert to default
export const resetTenant = () => {
  localStorage.removeItem('selected_tenant_url');
  localStorage.removeItem('selected_tenant_key');
  localStorage.removeItem('selected_tenant_slug');
  localStorage.removeItem('selected_tenant_name');
  activeUrl = DEFAULT_URL;
  activeKey = DEFAULT_KEY;
  activeClient = createClient(DEFAULT_URL, DEFAULT_KEY);
  
  // Notify listeners
  tenantChangeListeners.forEach(listener => listener(DEFAULT_URL, DEFAULT_KEY));
};

// Always returns the current active client — use for debugging
export const getSupabase = (): SupabaseClient => activeClient;

// Export active URL for debugging
export const getActiveUrl = (): string => activeUrl;

// Expose current tenant metadata for UI
export const getTenantMeta = () => ({
  url: activeUrl,
  key: activeKey,
  slug: localStorage.getItem('selected_tenant_slug') || '',
  name: localStorage.getItem('selected_tenant_name') || '',
});

// Check if currently operating in Platform Admin mode (connected directly to VyaraHR Platform)
export const isPlatformMode = (): boolean => {
  const cleanActive = (activeUrl || '').trim().toLowerCase().replace(/\/$/, '');
  const cleanMaster = masterUrl.trim().toLowerCase().replace(/\/$/, '');
  return cleanActive === cleanMaster;
};


// Dynamic client proxy to delegate all calls to the active client at runtime
// This ensures auth, from(), storage, etc. always use the latest activeClient
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = activeClient;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    // For nested objects like `auth`, `storage` — wrap them in another proxy
    if (value !== null && typeof value === 'object') {
      return new Proxy(value, {
        get(innerTarget, innerProp) {
          // Re-read from the current activeClient each time to stay fresh
          const freshClient = activeClient;
          const freshObj = (freshClient as any)[prop];
          const innerValue = freshObj[innerProp];
          if (typeof innerValue === 'function') {
            return innerValue.bind(freshObj);
          }
          return innerValue;
        }
      });
    }
    return value;
  },
  set(_target, prop, value) {
    (activeClient as any)[prop] = value;
    return true;
  }
});

