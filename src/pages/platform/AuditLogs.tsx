import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Clock } from 'lucide-react';
import { auditService } from '../../services/auditService';
import type { AuditLog } from '../../types/tenant';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAll();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_email.toLowerCase().includes(search.toLowerCase()) ||
    l.target_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#FFFBDC]">Audit Records</h2>
          <p className="text-xs text-[#BAA290]">Review platform level configuration changes and management activities.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#FF5900]/25 text-[#BAA290] hover:text-[#FFFBDC] bg-[#261300] hover:bg-[#FF5900]/5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#FF5900]' : 'text-[#FF5900]'} />
          <span>Reload Logs</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#261300] border border-[#FF5900]/15 rounded-xl max-w-md">
        <Search size={18} className="text-[#BAA290]" />
        <input
          type="text"
          placeholder="Filter logs by action, operator email or target ID..."
          className="bg-transparent border-none outline-none text-sm text-[#FFFBDC] placeholder-[#BAA290] w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-[#261300] border border-[#FF5900]/15 rounded-3xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF5900]"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#BAA290] text-sm">
            No audit records registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#FF5900]/15 text-xs text-[#BAA290] font-bold bg-[#1A0D00]/40">
                  <th className="p-5">Timestamp</th>
                  <th className="p-5">Operator</th>
                  <th className="p-5">Action Perform</th>
                  <th className="p-5">Target</th>
                  <th className="p-5">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF5900]/10 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FF5900]/5 transition-colors">
                    <td className="p-5 text-xs text-[#BAA290] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#FF5900]" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div>
                        <p className="font-bold text-[#FFFBDC]">{log.actor_email}</p>
                        <p className="text-[10px] text-[#FF5900] font-semibold uppercase tracking-wider mt-0.5">{log.actor_role}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#FF5900]/10 text-[#FF5900] rounded-lg">
                          <ShieldAlert size={12} />
                        </div>
                        <span className="font-semibold text-[#FFFBDC]">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-5 text-xs">
                      {log.target_type ? (
                        <div>
                          <span className="text-[#BAA290]">{log.target_type}: </span>
                          <span className="text-[#FFFBDC] font-semibold font-mono">{log.target_id}</span>
                        </div>
                      ) : (
                        <span className="text-[#BAA290] italic">None</span>
                      )}
                    </td>
                    <td className="p-5 text-xs text-[#BAA290] font-mono max-w-[250px] truncate" title={log.metadata ? JSON.stringify(log.metadata) : ''}>
                      {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
