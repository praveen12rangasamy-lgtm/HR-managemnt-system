import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Send, Calendar as CalIcon, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Leaves = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Admin view state: all employee leave requests from DB
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminRequests();
    } else {
      fetchRequests();
    }
  }, [isAdmin, profile]);

  const fetchAdminRequests = async () => {
    setLoading(true);

    // Fetch Supabase requests
    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });

    let finalRequests: any[] = [];

    if (!leaveError && leaveData) {
      const userIds = [...new Set(leaveData.map((r: any) => r.user_id))];
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id, designation')
        .in('id', userIds);

      const profileMap = (profileData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      finalRequests = leaveData.map((r: any) => ({
        ...r,
        profiles: profileMap[r.user_id] || null,
      }));
    }

    // Fetch localStorage mock requests
    const mockLeaves = localStorage.getItem('hr_leave_requests');
    if (mockLeaves) {
      const parsed = JSON.parse(mockLeaves);
      const formattedMocks = parsed.map((m: any) => ({
        ...m,
        is_mock: true,
        profiles: {
          full_name: m.name,
          employee_id: m.empId,
          designation: m.designation || 'New Hire'
        }
      }));
      finalRequests = [...formattedMocks, ...finalRequests];
    }

    setAdminRequests(finalRequests);
    setLoading(false);
  };

  const fetchRequests = async () => {
    if (!profile) return;
    setLoading(true);

    if (profile.is_mock || profile.id?.toString().startsWith('VYR-')) {
      const mockLeaves = JSON.parse(localStorage.getItem('hr_leave_requests') || '[]');
      const filtered = mockLeaves.filter((l: any) => l.user_id === profile.id);
      setRequests(filtered);
    } else {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setRequests(data);
      }
    }
    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    
    // Check if user is mock
    if (profile.is_mock || profile.id?.toString().startsWith('VYR-')) {
      const mockReq = {
        id: `LR-${Date.now()}`,
        user_id: profile.id,
        name: profile.full_name,
        empId: profile.employee_id,
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('hr_leave_requests') || '[]');
      localStorage.setItem('hr_leave_requests', JSON.stringify([mockReq, ...existing]));
      
      setToast('✓ Leave request submitted (Mock System)!');
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      await fetchRequests(); // Refresh for employee view
    } else {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: profile.id,
          type: formData.type,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          status: 'pending'
        });

      if (error) {
        setToast('❌ Error submitting request. Please try again.');
        console.error('Leave apply error:', error);
      } else {
        setToast('✓ Leave request submitted successfully!');
        setFormData({ type: '', startDate: '', endDate: '', reason: '' });
        await fetchRequests();
      }
    }
    
    setLoading(false);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(true);
    
    const request = adminRequests.find(r => r.id === id);
    
    if (request?.is_mock) {
      const mockLeaves = JSON.parse(localStorage.getItem('hr_leave_requests') || '[]');
      const updated = mockLeaves.map((l: any) => l.id === id ? { ...l, status: newStatus } : l);
      localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
      
      setToast(`✓ Mock request ${newStatus} successfully`);
      await fetchAdminRequests();
      setSelectedRequest(null);
    } else {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Action error:', error.message, error.details, error.hint);
        setToast(`❌ Failed: ${error.message}`);
      } else {
        setToast(`✓ Request ${newStatus} successfully`);
        await fetchAdminRequests();
        setSelectedRequest(null);
      }
    }
    setActionLoading(false);
    setTimeout(() => setToast(''), 3500);
  };

  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-7xl">
        {toast && (
          <div className="fixed top-20 right-8 bg-brand-navy text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4 border-l-4 border-brand-teal">
            <CheckCircle className="text-brand-teal" size={20} />
            {toast}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-navy">Leave Management Portal</h2>
          <Badge variant="blue" className="px-3 py-1">Admin Control Panel</Badge>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Review and action employee leave submissions.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Employee Name</th>
                    <th className="px-6 py-4 font-bold">Employee ID</th>
                    <th className="px-6 py-4 font-bold">Leave Type</th>
                    <th className="px-6 py-4 font-bold text-center">Duration (Days)</th>
                    <th className="px-6 py-4 font-bold text-center">Available Balance</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading leave requests...</td></tr>
                ) : adminRequests.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No leave requests found.</td></tr>
                ) : adminRequests.map((req) => {
                  const start = new Date(req.start_date);
                  const end = new Date(req.end_date);
                  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 cursor-pointer transition-colors group" onClick={() => setSelectedRequest(req)}>
                      <td className="px-6 py-4 font-semibold text-brand-navy">{req.profiles?.full_name || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{req.profiles?.employee_id || '—'}</td>
                      <td className="px-6 py-4 capitalize">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${req.type === 'sick' ? 'bg-status-amber' : req.type === 'casual' ? 'bg-brand-teal' : 'bg-brand-navy'}`}></span>
                        {req.type}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-brand-navy">{days}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{req.start_date} → {req.end_date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'neutral'}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 transition-all">
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-10 w-10 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100" 
                             onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'approved'); }}
                             disabled={actionLoading || req.status !== 'pending'}
                             title="Approve"
                           >
                             <CheckCircle size={22} className="text-emerald-500" />
                           </Button>
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-10 w-10 p-0 rounded-full hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100" 
                             onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'rejected'); }}
                             disabled={actionLoading || req.status !== 'pending'}
                             title="Reject"
                           >
                             <span className="text-xl font-bold text-red-500">✕</span>
                           </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedRequest && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>Leave Reason</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>✕</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-lg">
                    {selectedRequest?.profiles?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">{selectedRequest?.profiles?.full_name || '—'}</h4>
                    <p className="text-xs text-gray-500">{selectedRequest?.profiles?.employee_id || '—'} · {selectedRequest?.profiles?.designation || 'Employee'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Type</p>
                    <p className="font-bold text-brand-navy capitalize mt-1">{selectedRequest?.type}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">From</p>
                    <p className="font-bold text-brand-navy mt-1">{selectedRequest?.start_date}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">To</p>
                    <p className="font-bold text-brand-navy mt-1">{selectedRequest?.end_date}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border italic text-gray-700 text-sm">
                  "{selectedRequest?.reason || 'No reason provided.'}"
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <Button 
                     className="bg-emerald-500 hover:bg-emerald-600 w-full gap-2 border-none h-11 shadow-md shadow-emerald-100" 
                     onClick={() => handleAction(selectedRequest.id, 'approved')}
                     disabled={actionLoading || selectedRequest?.status !== 'pending'}
                   >
                     <CheckCircle size={18} /> Approve Request
                   </Button>
                   <Button 
                     variant="outline" 
                     className="border-red-500 text-red-500 hover:bg-red-50 w-full gap-2 h-11" 
                     onClick={() => handleAction(selectedRequest.id, 'rejected')}
                     disabled={actionLoading || selectedRequest?.status !== 'pending'}
                   >
                     <span className="font-bold">✕</span> Reject Request
                   </Button>
                </div>
                {selectedRequest?.status !== 'pending' && (
                  <p className="text-center text-xs text-gray-400">This request has already been {selectedRequest?.status}.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {toast && (
        <div className="fixed top-20 right-8 bg-brand-teal text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} />
          {toast}
        </div>
      )}

      <h2 className="text-2xl font-bold text-brand-navy">Leaves Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances (2026)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-semibold text-gray-700">Casual Leave</span>
                  <span className="text-brand-teal font-bold">8 / 12 Days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-brand-teal h-2.5 rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-semibold text-gray-700">Sick Leave</span>
                  <span className="text-status-amber font-bold">4 / 7 Days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-status-amber h-2.5 rounded-full" style={{ width: '57%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-semibold text-gray-700">Earned Leave</span>
                  <span className="text-brand-navy font-bold">15 / 18 Days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-brand-navy h-2.5 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center py-4 text-gray-400 italic text-sm">Loading...</p>
                ) : requests.length > 0 ? requests.map((req, i) => {
                  const start = new Date(req.start_date);
                  const end = new Date(req.end_date);
                  const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                  return (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-teal/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-brand-navy capitalize">{req.type} Leave</p>
                          <p className="text-xs text-gray-500 mt-0.5">{req.start_date} → {req.end_date}</p>
                          <p className="text-xs font-medium text-brand-teal mt-1">{duration} day{duration !== 1 ? 's' : ''}</p>
                        </div>
                        <Badge variant={req.status === 'approved' ? 'green' : (req.status === 'rejected' ? 'red' : 'neutral')}>
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                  );
                }) : <p className="text-center py-4 text-gray-500 italic text-sm">No requests found.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleApply}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal focus:border-brand-teal text-sm" 
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="">Select leave type</option>
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="earned">Earned Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-teal" 
                      required 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-teal" 
                      required 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea 
                    rows={2} 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal focus:border-brand-teal text-sm resize-none" 
                    placeholder="Brief reason for leave..."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  ></textarea>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <Send size={16}/> Apply Leave
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex gap-3 items-center">
                    <CalIcon size={18} className="text-gray-400" />
                    <span className="font-medium">Diwali</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Oct 24, 2026</p>
                    <p className="text-xs text-gray-500">Thursday</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
