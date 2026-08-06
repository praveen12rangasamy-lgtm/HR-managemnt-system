import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw, Edit3, ArrowUpRight, Shield, Building2 } from 'lucide-react';
import { organizationService } from '../../services/organizationService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import type { Organization } from '../../types/tenant';

const PLAN_PRICES: Record<string, { label: string; monthlyPrice: number; formatted: string }> = {
  trial: { label: 'Free Trial', monthlyPrice: 0, formatted: '₹0 / mo' },
  starter: { label: 'Starter Plan', monthlyPrice: 1999, formatted: '₹1,999 / mo' },
  pro: { label: 'Pro Plan', monthlyPrice: 4999, formatted: '₹4,999 / mo' },
  enterprise: { label: 'Enterprise Plan', monthlyPrice: 9999, formatted: '₹9,999 / mo' }
};

const Payments: React.FC = () => {
  const { profile } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Payment Modal State
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<'trial' | 'starter' | 'pro' | 'enterprise'>('trial');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'paid' | 'unpaid' | 'overdue' | 'trialing'>('trialing');
  const [paymentNote, setPaymentNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getAll();
      setOrgs(data);
    } catch (err) {
      console.error('Error fetching organizations for payment management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleOpenEdit = (org: Organization) => {
    setSelectedOrg(org);
    setEditPlan(org.plan || 'trial');
    setEditPaymentStatus(org.payment_status || 'trialing');
    setPaymentNote('');
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSavePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await organizationService.update(selectedOrg.id, {
        plan: editPlan,
        payment_status: editPaymentStatus
      });

      const noteText = paymentNote.trim() ? ` (Note: ${paymentNote.trim()})` : '';
      await auditService.log(
        `Updated payment details for ${selectedOrg.name} (${selectedOrg.slug}) - Plan: ${editPlan}, Payment Status: ${editPaymentStatus}${noteText}`,
        profile?.email || 'unknown',
        'platform_admin',
        'payment',
        selectedOrg.slug
      );

      setSuccessMsg(`Successfully updated payment status for ${selectedOrg.name}!`);
      setTimeout(() => {
        setIsModalOpen(false);
        fetchOrgs();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update payment status:', err);
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalOrgs = orgs.length;
  const paidCount = orgs.filter(o => o.payment_status === 'paid').length;
  const trialingCount = orgs.filter(o => o.payment_status === 'trialing' || !o.payment_status).length;
  const unpaidOverdueCount = orgs.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'overdue').length;

  const estimatedMonthlyRevenue = orgs.reduce((sum, o) => {
    if (o.payment_status === 'paid') {
      const planInfo = PLAN_PRICES[o.plan] || PLAN_PRICES.trial;
      return sum + planInfo.monthlyPrice;
    }
    return sum;
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
          icon: CheckCircle2,
          label: 'Paid'
        };
      case 'trialing':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
          icon: Clock,
          label: 'Trialing'
        };
      case 'unpaid':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-600',
          icon: XCircle,
          label: 'Unpaid'
        };
      case 'overdue':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
          icon: AlertCircle,
          label: 'Overdue'
        };
      default:
        return {
          bg: 'bg-gray-500/10 border-gray-500/20 text-gray-600',
          icon: Clock,
          label: status || 'Trialing'
        };
    }
  };

  const filteredOrgs = orgs.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase());
    const currentStatus = o.payment_status || 'trialing';
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'paid') return matchesSearch && currentStatus === 'paid';
    if (statusFilter === 'trialing') return matchesSearch && currentStatus === 'trialing';
    if (statusFilter === 'unpaid_overdue') return matchesSearch && (currentStatus === 'unpaid' || currentStatus === 'overdue');
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <CreditCard className="text-brand-orange" size={24} />
            <span>Organization Billing & Payments</span>
          </h2>
          <p className="text-xs text-gray-500">Track tenant subscription tiers, payment statuses, and manual payment records.</p>
        </div>
        <button
          onClick={fetchOrgs}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-navy rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Est. Monthly MRR</span>
            <p className="text-2xl font-black text-brand-navy">₹{estimatedMonthlyRevenue.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <ArrowUpRight size={12} /> Active paid accounts
            </p>
          </div>
          <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Paid Organizations</span>
            <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
            <p className="text-[10px] text-gray-400 font-medium">Out of {totalOrgs} total tenants</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Free Trialing</span>
            <p className="text-2xl font-black text-amber-500">{trialingCount}</p>
            <p className="text-[10px] text-gray-400 font-medium">Evaluating platform</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unpaid / Overdue</span>
            <p className="text-2xl font-black text-red-500">{unpaidOverdueCount}</p>
            <p className="text-[10px] text-gray-400 font-medium">Action required</p>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search organization by name or slug..."
            className="bg-transparent border-none outline-none text-sm text-brand-navy placeholder-gray-400 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-white text-brand-navy shadow-sm' : 'hover:text-brand-navy'}`}
          >
            All ({totalOrgs})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${statusFilter === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-brand-navy'}`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setStatusFilter('trialing')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${statusFilter === 'trialing' ? 'bg-white text-amber-600 shadow-sm' : 'hover:text-brand-navy'}`}
          >
            Trialing ({trialingCount})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid_overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${statusFilter === 'unpaid_overdue' ? 'bg-white text-red-600 shadow-sm' : 'hover:text-brand-navy'}`}
          >
            Unpaid / Overdue ({unpaidOverdueCount})
          </button>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-orange"></div>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No organization payment records match your search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold bg-gray-50/50">
                  <th className="p-5">Organization</th>
                  <th className="p-5">Subscription Plan</th>
                  <th className="p-5">Plan Amount</th>
                  <th className="p-5">Payment Status</th>
                  <th className="p-5">Country</th>
                  <th className="p-5">Last Updated</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrgs.map((org) => {
                  const statusInfo = getStatusBadge(org.payment_status);
                  const StatusIcon = statusInfo.icon;
                  const planInfo = PLAN_PRICES[org.plan] || PLAN_PRICES.trial;

                  return (
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
                        <span className="px-2.5 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider">
                          {planInfo.label}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-brand-navy">
                        {planInfo.formatted}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.bg}`}>
                          <StatusIcon size={14} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 text-xs font-medium">
                        {org.country || 'India'}
                      </td>
                      <td className="p-5 text-gray-500 text-xs">
                        {new Date(org.updated_at || org.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleOpenEdit(org)}
                          className="flex items-center gap-1.5 px-3 py-1.5 ml-auto bg-brand-orange/10 border border-brand-orange/20 hover:bg-brand-orange hover:text-white text-brand-orange rounded-xl text-xs font-bold transition-all"
                        >
                          <Edit3 size={14} />
                          <span>Manage Payment</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PAYMENT STATUS MODAL */}
      {isModalOpen && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-200 text-brand-navy">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-navy text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Manage Tenant Payment</h3>
                <p className="text-xs text-brand-orange font-mono font-bold uppercase">{selectedOrg.name} ({selectedOrg.slug})</p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentStatus} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">{error}</div>}
              {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold">{successMsg}</div>}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Selected Plan Tier</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as any)}
                >
                  <option value="trial">Free Trial (₹0 / mo)</option>
                  <option value="starter">Starter Plan (₹1,999 / mo)</option>
                  <option value="pro">Pro Plan (₹4,999 / mo)</option>
                  <option value="enterprise">Enterprise Plan (₹9,999 / mo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Payment Status</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-semibold"
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                >
                  <option value="trialing">⏱️ Trialing (Free / Demo)</option>
                  <option value="paid">✅ Paid (Subscription Active)</option>
                  <option value="unpaid">⚠️ Unpaid (Payment Pending)</option>
                  <option value="overdue">🚨 Overdue (Access Suspended Warning)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Manual Payment Reference / Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bank transfer ref #10492 or Razorpay offline receipt"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs text-brand-navy outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all resize-none"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-transparent hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {saving ? 'Updating...' : 'Save Payment Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
