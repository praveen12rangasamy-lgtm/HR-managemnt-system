import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users2, ShieldAlert, Cpu, Sparkles, Plus, TrendingUp } from 'lucide-react';
import { organizationService } from '../../services/organizationService';
import { auditService } from '../../services/auditService';
import type { Organization, AuditLog } from '../../types/tenant';

const PlatformDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [fetchedOrgs, fetchedLogs] = await Promise.all([
          organizationService.getAll(),
          auditService.getAll()
        ]);
        setOrgs(fetchedOrgs);
        setLogs(fetchedLogs.slice(0, 5));
      } catch (err) {
        console.error('Error loading platform dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const stats = [
    { name: 'Total Organizations', value: orgs.length.toString(), icon: Building2, color: 'text-brand-orange', bg: 'bg-[#FF5900]/10' },
    { name: 'Active Tenants', value: orgs.filter(o => o.status === 'active').length.toString(), icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'System Logs (All Time)', value: logs.length.toString(), icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF5900]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-8 bg-gradient-to-r from-[#261300] to-[#1A0D00] border border-[#FF5900]/20 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-[#FF5900]" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 bg-[#FF5900]/20 border border-[#FF5900]/30 rounded-full text-xs font-semibold text-[#FF5900] tracking-wider uppercase">
            Platform Operator
          </span>
          <h2 className="text-3xl font-extrabold text-[#FFFBDC]">
            VyaraHR Platform Control
          </h2>
          <p className="text-[#BAA290] text-sm max-w-xl">
            Provision new client organizations, manage tenant connections, and oversee system-wide audit records from a single administrative hub.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-2xl flex items-center justify-between shadow-lg hover:border-[#FF5900]/30 transition-all duration-200">
              <div className="space-y-1">
                <span className="text-xs text-[#BAA290] font-medium">{stat.name}</span>
                <p className="text-3xl font-black text-[#FFFBDC]">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Organizations */}
        <div className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#FFFBDC] flex items-center gap-2">
              <Building2 size={20} className="text-[#FF5900]" />
              <span>Registered Organizations</span>
            </h3>
            <button
              onClick={() => navigate('/platform/organizations')}
              className="flex items-center gap-1 text-xs font-semibold text-[#FF5900] hover:text-[#FF8237] transition-colors"
            >
              <Plus size={14} />
              <span>Add New</span>
            </button>
          </div>

          <div className="space-y-4">
            {orgs.length === 0 ? (
              <p className="text-xs text-[#BAA290] py-4 text-center">No organizations registered yet.</p>
            ) : (
              orgs.slice(0, 4).map((org) => (
                <div key={org.id} className="p-4 bg-[#1A0D00] border border-[#FF5900]/10 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#FFFBDC]">{org.name}</p>
                    <p className="text-[10px] text-[#FF5900] font-mono tracking-wider uppercase">{org.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {org.status}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FF5900]/10 border border-[#FF5900]/20 text-[#FF5900] rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {org.plan}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#FFFBDC] flex items-center gap-2">
              <ShieldAlert size={20} className="text-[#FF5900]" />
              <span>Recent Activity Logs</span>
            </h3>
            <button
              onClick={() => navigate('/platform/audit-logs')}
              className="text-xs font-semibold text-[#FF5900] hover:text-[#FF8237] transition-colors"
            >
              View All Logs
            </button>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-[#BAA290] py-4 text-center">No platform activity logged yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3.5 bg-[#1A0D00] border border-[#FF5900]/10 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-[#FF5900]/10 text-[#FF5900] rounded-lg mt-0.5">
                    <ShieldAlert size={14} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-[#FFFBDC] truncate">{log.action}</p>
                    <p className="text-[10px] text-[#BAA290] flex items-center gap-2">
                      <span className="text-[#FF5900] font-semibold">{log.actor_email}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
