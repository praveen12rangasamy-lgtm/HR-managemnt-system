import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, HelpCircle, Cpu, FileText, Trash2, Edit2, Shield, Users, CheckCircle2, XCircle } from 'lucide-react';
import { organizationService } from '../../services/organizationService';
import { tenantService } from '../../services/tenantService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import type { Organization } from '../../types/tenant';

const Organizations: React.FC = () => {
  const { profile } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedOrgStats, setSelectedOrgStats] = useState<{
    org: Organization;
    admins: number | null;
    employees: number | null;
    loading: boolean;
    error: string | null;
  } | null>(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    country: 'India',
    plan: 'trial' as 'trial' | 'starter' | 'pro' | 'enterprise',
    supabase_url: '',
    supabase_anon_key: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getAll();
      setOrgs(data);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleRowClick = async (org: Organization) => {
    setSelectedOrgStats({
      org,
      admins: null,
      employees: null,
      loading: true,
      error: null
    });

    try {
      const conn = await tenantService.getBySlug(org.slug);
      if (!conn) {
        throw new Error('No connection credentials found for this tenant.');
      }

      const { createClient } = await import('@supabase/supabase-js');
      const tempClient = createClient(conn.supabase_url, conn.supabase_anon_key);
      
      const { data, error } = await tempClient
        .from('profiles')
        .select('role');

      if (error) throw error;

      const admins = data.filter(p => p.role === 'admin' || p.role === 'owner').length;
      const employees = data.filter(p => p.role === 'employee').length;

      setSelectedOrgStats({
        org,
        admins,
        employees,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Failed to load tenant stats:', err);
      setSelectedOrgStats({
        org,
        admins: null,
        employees: null,
        loading: false,
        error: err.message || 'Could not connect to tenant database.'
      });
    }
  };

  const handleEditClick = async (org: Organization) => {
    setEditingOrg(org);
    setSubmitLoading(true);
    setError(null);
    try {
      const conn = await tenantService.getBySlug(org.slug);
      setNewOrg({
        name: org.name,
        slug: org.slug,
        country: org.country || 'India',
        plan: org.plan,
        supabase_url: conn?.supabase_url || '',
        supabase_anon_key: conn?.supabase_anon_key || ''
      });
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load organization details:', err);
      setError('Failed to fetch tenant credentials.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    const slug = newOrg.slug.trim().toLowerCase();
    if (!slug || !newOrg.name || !newOrg.supabase_url || !newOrg.supabase_anon_key) {
      setError('Please fill in all required fields.');
      setSubmitLoading(false);
      return;
    }

    try {
      if (editingOrg) {
        // 1. Update Connection Entry
        const conn = await tenantService.getBySlug(editingOrg.slug);
        if (conn) {
          await tenantService.update(conn.id, {
            company_name: newOrg.name,
            company_slug: slug,
            supabase_url: newOrg.supabase_url.trim(),
            supabase_anon_key: newOrg.supabase_anon_key.trim()
          });
        }

        // 2. Update Organization Profile Entry
        await organizationService.update(editingOrg.id, {
          name: newOrg.name,
          slug: slug,
          country: newOrg.country,
          plan: newOrg.plan,
          supabase_project_ref: newOrg.supabase_url.match(/https:\/\/(.*)\.supabase\.co/)?.[1] || ''
        });

        // 3. Audit Log
        await auditService.log(
          `Updated organization: ${editingOrg.name} (${editingOrg.slug}) to ${newOrg.name} (${slug})`,
          profile?.email || 'unknown',
          'platform_admin',
          'organization',
          slug
        );
      } else {
        // 1. Create Connection Entry
        const connection = await tenantService.create({
          company_name: newOrg.name,
          company_slug: slug,
          supabase_url: newOrg.supabase_url.trim(),
          supabase_anon_key: newOrg.supabase_anon_key.trim()
        });

        // 2. Create Organization Profile Entry
        await organizationService.create({
          name: newOrg.name,
          slug: slug,
          country: newOrg.country,
          plan: newOrg.plan,
          status: 'active',
          supabase_project_ref: newOrg.supabase_url.match(/https:\/\/(.*)\.supabase\.co/)?.[1] || ''
        });

        // 3. Audit Log
        await auditService.log(
          `Created organization: ${newOrg.name} (${slug})`,
          profile?.email || 'unknown',
          'platform_admin',
          'organization',
          slug
        );
      }

      // Reset & Reload
      setIsModalOpen(false);
      setEditingOrg(null);
      setNewOrg({
        name: '',
        slug: '',
        country: 'India',
        plan: 'trial',
        supabase_url: '',
        supabase_anon_key: ''
      });
      fetchOrgs();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setError(err.message || 'Failed to create organization. Check input values.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteOrg = async (id: string, slug: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete organization "${name}" (${slug})? This will remove its connection entry from the Platform directory.`)) {
      return;
    }

    try {
      // Find the tenant connection id
      const conn = await tenantService.getBySlug(slug);
      if (conn) {
        await tenantService.delete(conn.id);
      }
      await organizationService.delete(id);

      await auditService.log(
        `Deleted organization: ${name} (${slug})`,
        profile?.email || 'unknown',
        'platform_admin',
        'organization',
        slug
      );

      fetchOrgs();
    } catch (err: any) {
      console.error('Failed to delete organization:', err);
      alert(err.message || 'Failed to delete organization.');
    }
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Registered Tenants</h2>
          <p className="text-xs text-gray-500">Oversee, configure, and register client instances below.</p>
        </div>
        <button
          onClick={() => {
            setEditingOrg(null);
            setNewOrg({
              name: '',
              slug: '',
              country: 'India',
              plan: 'trial',
              supabase_url: '',
              supabase_anon_key: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <Plus size={16} />
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* Searchbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl max-w-md shadow-sm">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Filter organizations by name or slug..."
          className="bg-transparent border-none outline-none text-sm text-brand-navy placeholder-gray-400 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-orange"></div>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No registered organizations found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold bg-gray-50/50">
                  <th className="p-5">Name & Code</th>
                  <th className="p-5">Project Ref / Endpoint</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Country</th>
                  <th className="p-5">Created At</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrgs.map((org) => (
                  <tr 
                    key={org.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(org)}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-orange/10 text-brand-orange rounded-xl">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-brand-navy">{org.name}</p>
                          <p className="text-[10px] text-brand-orange font-mono tracking-wider uppercase font-bold mt-0.5">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-xs text-gray-500 font-mono max-w-[200px] truncate" title={org.supabase_project_ref}>
                        {org.supabase_project_ref || 'Local / Custom'}
                      </p>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-0.5 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider">
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {org.status}
                      </span>
                    </td>
                    <td className="p-5 text-gray-500 text-xs">
                      {org.country || 'N/A'}
                    </td>
                    <td className="p-5 text-gray-500 text-xs font-semibold">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditClick(org)}
                          className="p-2 rounded-lg border border-brand-orange/20 bg-brand-orange/5 text-brand-orange hover:bg-brand-orange/10 transition-all"
                          title="Edit Tenant"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org.id, org.slug, org.name)}
                          className="p-2 rounded-lg border border-red-200 bg-red-50/50 text-red-500 hover:bg-red-100/50 transition-all"
                          title="Delete Tenant"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROVISIONING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in duration-200 text-brand-navy">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-navy text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-brand-navy mb-2 flex items-center gap-2">
              <Cpu size={20} className="text-brand-orange" />
              <span>{editingOrg ? 'Edit Tenant Connection' : 'Provision New Tenant Project'}</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {editingOrg ? 'Modify connections details and metadata for this organization.' : 'Connect a dedicated Supabase project to the VyaraHR platform instance.'}
            </p>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marabanu Group"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    value={newOrg.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                      setNewOrg({ ...newOrg, name, slug });
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Company Code (Slug)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. marabanu"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-mono"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Billing Plan</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    value={newOrg.plan}
                    onChange={(e) => setNewOrg({ ...newOrg, plan: e.target.value as any })}
                  >
                    <option value="trial">Free Trial</option>
                    <option value="starter">Starter Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    value={newOrg.country}
                    onChange={(e) => setNewOrg({ ...newOrg, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-brand-orange flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>Connection Details (Supabase Project API)</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Supabase Project URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-mono"
                    value={newOrg.supabase_url}
                    onChange={(e) => setNewOrg({ ...newOrg, supabase_url: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Supabase Anon Key</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-mono resize-none"
                    value={newOrg.supabase_anon_key}
                    onChange={(e) => setNewOrg({ ...newOrg, supabase_anon_key: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-transparent hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                  {submitLoading ? 'Saving...' : editingOrg ? 'Save Connection' : 'Provision Tenant →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TENANT STATS / DETAILS MODAL */}
      {selectedOrgStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-200 text-brand-navy">
            <button
              onClick={() => setSelectedOrgStats(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-navy text-lg font-bold"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-navy">{selectedOrgStats.org.name}</h3>
                <p className="text-xs text-brand-orange font-mono font-bold tracking-wider uppercase">{selectedOrgStats.org.slug}</p>
              </div>
            </div>

            {selectedOrgStats.loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-orange"></div>
                <span className="text-xs text-gray-500 font-semibold">Connecting to organization database...</span>
              </div>
            ) : selectedOrgStats.error ? (
              <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle size={16} />
                  <span className="text-xs font-bold">Database Connection Offline</span>
                </div>
                <p className="text-[11px] text-red-500 font-medium leading-relaxed">{selectedOrgStats.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Admins Card */}
                  <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Administrators</span>
                      <p className="text-3xl font-black text-brand-navy">{selectedOrgStats.admins}</p>
                    </div>
                    <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
                      <Shield size={20} />
                    </div>
                  </div>

                  {/* Employees Card */}
                  <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Employees</span>
                      <p className="text-3xl font-black text-brand-navy">{selectedOrgStats.employees}</p>
                    </div>
                    <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
                      <Users size={20} />
                    </div>
                  </div>
                </div>

                {/* Connection Status & Details */}
                <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">Connection Online</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase bg-emerald-100/50 px-2.5 py-0.5 rounded-full">Active</span>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Billing Plan:</span>
                    <span className="font-bold text-brand-orange uppercase">{selectedOrgStats.org.plan}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Country / Region:</span>
                    <span className="font-semibold text-brand-navy">{selectedOrgStats.org.country || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Supabase Project Ref:</span>
                    <span className="font-mono text-[11px] text-brand-navy font-semibold">{selectedOrgStats.org.supabase_project_ref || 'Local / Custom'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Created On:</span>
                    <span className="font-semibold text-brand-navy">{new Date(selectedOrgStats.org.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrgStats(null)}
                className="px-5 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
