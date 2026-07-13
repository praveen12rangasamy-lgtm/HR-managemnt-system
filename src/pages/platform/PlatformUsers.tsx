import React, { useState, useEffect } from 'react';
import { Shield, Plus, Mail, Trash2, UserCheck } from 'lucide-react';
import { masterSupabase } from '../../lib/supabase';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import type { PlatformUser } from '../../types/auth';

const PlatformUsers: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', fullName: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await masterSupabase
        .from('platform_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch platform users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    const email = newAdmin.email.trim().toLowerCase();
    const fullName = newAdmin.fullName.trim();

    if (!email || !fullName) {
      setError('Please fill in all fields.');
      setSubmitLoading(false);
      return;
    }

    try {
      const { error: insertErr } = await masterSupabase
        .from('platform_users')
        .insert({
          email,
          full_name: fullName,
          role: 'platform_admin'
        });

      if (insertErr) throw insertErr;

      await auditService.log(
        `Added platform admin: ${email}`,
        profile?.email || 'unknown',
        'platform_admin',
        'platform_user',
        email
      );

      setIsModalOpen(false);
      setNewAdmin({ email: '', fullName: '' });
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to add platform admin:', err);
      setError(err.message || 'Failed to add admin. Make sure email is unique.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, email: string) => {
    try {
      const { error } = await masterSupabase
        .from('platform_users')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await auditService.log(
        `${!currentStatus ? 'Activated' : 'Deactivated'} platform admin: ${email}`,
        profile?.email || 'unknown',
        'platform_admin',
        'platform_user',
        email
      );

      fetchUsers();
    } catch (err) {
      console.error('Failed to update platform admin status:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#FFFBDC]">Platform Operators</h2>
          <p className="text-xs text-[#BAA290]">Manage admin email logins that have master-level console access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5900] hover:bg-[#FF8237] text-[#FFFBDC] rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <Plus size={16} />
          <span>Add Administrator</span>
        </button>
      </div>

      <div className="bg-[#261300] border border-[#FF5900]/15 rounded-3xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF5900]"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[#BAA290] text-sm">
            No platform administrators found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#FF5900]/15 text-xs text-[#BAA290] font-bold bg-[#1A0D00]/40">
                  <th className="p-5">Name & Email</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Added On</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF5900]/10 text-sm">
                {users.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[#FF5900]/5 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#FF5900]/10 text-[#FF5900] rounded-xl">
                          <Shield size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-[#FFFBDC]">{admin.full_name}</p>
                          <p className="text-xs text-[#BAA290] flex items-center gap-1 mt-0.5">
                            <Mail size={12} className="text-[#FF5900]" />
                            <span>{admin.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-0.5 bg-[#FF5900]/10 border border-[#FF5900]/25 text-[#FF5900] rounded-full text-xs font-semibold uppercase">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        admin.is_active 
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                          : 'bg-red-500/10 border border-red-500/25 text-red-400'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-5 text-[#BAA290] text-xs">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-right">
                      {admin.email !== profile?.email && (
                        <button
                          onClick={() => handleToggleActive(admin.id, admin.is_active, admin.email)}
                          className={`p-2 rounded-lg border transition-all ${
                            admin.is_active 
                              ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10' 
                              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={admin.is_active ? 'Deactivate Operator' : 'Activate Operator'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-[#261300] border border-[#FF5900]/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#BAA290] hover:text-[#FFFBDC] text-lg"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-[#FFFBDC] mb-2 flex items-center gap-2">
              <Shield size={20} className="text-[#FF5900]" />
              <span>Register Operator</span>
            </h3>
            <p className="text-xs text-[#BAA290] mb-6">
              Create a system admin credentials to access VyaraHR master console.
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">{error}</div>}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#BAA290]">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#1A0D00] border border-[#FF5900]/25 rounded-xl px-4 py-2.5 text-sm text-[#FFFBDC] outline-none focus:border-[#FF5900] transition-colors"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#BAA290]">Operator Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#1A0D00] border border-[#FF5900]/25 rounded-xl px-4 py-2.5 text-sm text-[#FFFBDC] outline-none focus:border-[#FF5900] transition-colors"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-transparent hover:bg-white/5 border border-[#FF5900]/15 text-[#BAA290] hover:text-[#FFFBDC] rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-[#FF5900] hover:bg-[#FF8237] disabled:opacity-50 text-[#FFFBDC] rounded-xl text-sm font-bold transition-all"
                >
                  {submitLoading ? 'Registering...' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformUsers;
