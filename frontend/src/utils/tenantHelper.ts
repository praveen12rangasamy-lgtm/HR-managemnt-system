import type { User } from '@supabase/supabase-js';

export const getAdminEmail = (profile: any, user: User | null): string => {
  if (!profile) return user?.email?.trim().toLowerCase() || 'default';
  const email = profile.role === 'admin' ? profile.email : profile.hired_by;
  return email?.trim().toLowerCase() || 'default';
};

export const getScopedKey = (key: string, profile: any, user: User | null): string => {
  return `${key}_${getAdminEmail(profile, user)}`;
};
