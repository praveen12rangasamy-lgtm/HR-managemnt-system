import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, HelpCircle, Cpu, FileText } from 'lucide-react';
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

      // Reset & Reload
      setIsModalOpen(false);
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
          onClick={() => setIsModalOpen(true)}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
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
                    <td className="p-5 text-gray-500 text-xs">
                      {new Date(org.created_at).toLocaleDateString()}
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
              <span>Provision New Tenant Project</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Connect a dedicated Supabase project to the VyaraHR platform instance.
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
                  {submitLoading ? 'Registering...' : 'Provision Tenant →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
