import { createClient } from '@supabase/supabase-js';
import { tenantService } from './tenantService';

export const ownerService = {
  // Lists owners or profiles of role 'superadmin' / 'owner' for a specific tenant slug
  async getTenantOwners(slug: string): Promise<any[]> {
    const conn = await tenantService.getBySlug(slug);
    if (!conn) throw new Error(`No tenant connection found for slug: ${slug}`);

    // Create a temporary client pointing to this tenant database
    const tenantClient = createClient(conn.supabase_url, conn.supabase_anon_key);
    
    const { data, error } = await tenantClient
      .from('profiles')
      .select('*')
      .in('role', ['superadmin', 'owner']);

    if (error) throw error;
    return data || [];
  },

  // Inserts an owner profile pre-provisionally into the tenant's profiles table
  async createTenantOwner(slug: string, ownerData: { id: string; email: string; full_name: string }): Promise<any> {
    const conn = await tenantService.getBySlug(slug);
    if (!conn) throw new Error(`No tenant connection found for slug: ${slug}`);

    const tenantClient = createClient(conn.supabase_url, conn.supabase_anon_key);

    const newOwnerProfile = {
      id: ownerData.id,
      email: ownerData.email,
      full_name: ownerData.full_name,
      role: 'superadmin', // Keep superadmin as DB level value to prevent constraint violations
      designation: 'Owner / Super Administrator',
      department: 'Management',
      status: 'active'
    };

    const { data, error } = await tenantClient
      .from('profiles')
      .upsert(newOwnerProfile, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
