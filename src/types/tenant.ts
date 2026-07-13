export interface TenantConnection {
  id: string;
  company_name: string;
  company_slug: string;
  supabase_url: string;
  supabase_anon_key: string;
  created_at: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo_url?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  supabase_project_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: any;
  created_at: string;
}
