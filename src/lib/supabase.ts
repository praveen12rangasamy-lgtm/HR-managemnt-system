import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvValue = (val: any, fallback: string) => {
  if (!val || val === 'undefined' || val === 'null' || val === 'placeholder' || typeof val !== 'string') {
    return fallback;
  }
  return val;
};

const masterUrl = getEnvValue(import.meta.env.VITE_SUPABASE_URL, 'https://nxtjqpehfdutqnvbaodb.supabase.co');
const masterKey = getEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dGpxcGVoZmR1dHFudmJhb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzI1MDYsImV4cCI6MjA5OTQwODUwNn0.J4jb1IorRLAGoKTF80fIbToDkmCvNDjXVNXwha-W-vs');

// Master client to query tenant directory
export const masterSupabase = createClient(masterUrl, masterKey);

// Default fallback to VyaraHR client project
// Exported so LandingPage can use these as the source of truth instead of the database entry
export const DEFAULT_URL = 'https://joqlxybxfivjpabvopxu.supabase.co';
export const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcWx4eWJ4Zml2anBhYnZvcHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzExNTEsImV4cCI6MjA4OTE0NzE1MX0.zxm1tXbZgeK_kf-A796ysDFREyS6thKW3DV8n-iBaNE';

let activeUrl = localStorage.getItem('selected_tenant_url') || DEFAULT_URL;
let activeKey = localStorage.getItem('selected_tenant_key') || DEFAULT_KEY;

// Safety guard: if pointing to the default VyaraHR tenant, force the known-correct key
if (activeUrl === DEFAULT_URL) {
  activeKey = DEFAULT_KEY;
}

let activeClient: SupabaseClient = createClient(activeUrl, activeKey);

export const switchTenant = (url: string, key: string) => {
  activeUrl = url;
  activeKey = key;
  localStorage.setItem('selected_tenant_url', url);
  localStorage.setItem('selected_tenant_key', key);
  activeClient = createClient(url, key);

};

// Clear active tenant and revert to default
export const resetTenant = () => {
  localStorage.removeItem('selected_tenant_url');
  localStorage.removeItem('selected_tenant_key');
  localStorage.removeItem('selected_tenant_slug');
  localStorage.removeItem('selected_tenant_name');
  activeClient = createClient(DEFAULT_URL, DEFAULT_KEY);
};

// Always returns the current active client — use for debugging
export const getSupabase = (): SupabaseClient => activeClient;

// Export active URL for debugging
export const getActiveUrl = (): string => activeUrl;

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

