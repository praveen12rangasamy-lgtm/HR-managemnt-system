import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Clock, CalendarDays, CheckCircle, BarChart2, RefreshCw, Search, Fingerprint } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const [searchDate, setSearchDate] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [manualData, setManualData] = useState({ date: new Date().toISOString().split('T')[0], inTime: '', outTime: '' });
  const isAdmin = profile?.role === 'admin';

  // State for Admin view: Real-time logs from DB
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminEntranceLogs();
    } else {
      fetchAttendance();
    }
  }, [profile, isAdmin]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchAdminEntranceLogs = async () => {
    setLoading(true);
    let allLogs: any[] = [];
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          date,
          clock_in,
          clock_out,
          entry_type,
          profiles (
            employee_id,
            full_name,
            designation
          )
        `)
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false });

      if (!error && data) {
        allLogs = data;
      }
    } catch (err) {
      console.error('Admin logs fetch error:', err);
    }

    // Merge with localStorage logs
    const localLogs = JSON.parse(localStorage.getItem('hr_attendance_logs') || '[]');
    
    const combined = [...localLogs];
    // Add supabase logs that aren't already represented in local (using date + id as proxy)
    allLogs.forEach(sl => {
      const exists = combined.some(cl => cl.date === sl.date && (cl.profiles?.employee_id === sl.profiles?.employee_id));
      if (!exists) combined.push(sl);
    });
    
    combined.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDiff !== 0 ? dateDiff : new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime();
    });

    setAdminLogs(combined);
    setFilteredEmployees(combined);
    setLoading(false);
  };

  const fetchAttendance = async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    let dbLogs: any[] = [];
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });
      if (data) dbLogs = data;
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }

    const localLogs = JSON.parse(localStorage.getItem('hr_attendance_logs') || '[]');
    const userLocal = localLogs.filter((l: any) => l.user_id === profile.id);
    
    const combined = [...userLocal];
    dbLogs.forEach(sl => {
      if (!combined.some(cl => cl.date === sl.date)) {
        combined.push(sl);
      }
    });

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLogs(combined);
    setFilteredLogs(combined.slice(0, 5));
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    if (isAdmin) {
      await fetchAdminEntranceLogs();
      setTimeout(() => setSyncing(false), 800);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (localStorage.getItem('mock_hr_session')) {
      const localLogs = JSON.parse(localStorage.getItem('hr_attendance_logs') || '[]');
      const exists = localLogs.some((l: any) => l.user_id === profile.id && l.date === today);
      
      if (!exists) {
        localLogs.unshift({
          id: `MOCK-ATT-${Date.now()}`,
          user_id: profile.id,
          date: today,
          clock_in: now,
          status: 'present',
          entry_type: 'biometric',
          profiles: {
            employee_id: profile.employeeId || profile.employee_id,
            full_name: profile.full_name,
            designation: profile.designation
          }
        });
        localStorage.setItem('hr_attendance_logs', JSON.stringify(localLogs));
      }
      await fetchAttendance();
      setSyncing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          user_id: profile.id,
          date: today,
          clock_in: now,
          status: 'present'
        }, { onConflict: 'user_id,date' });

      if (!error) await fetchAttendance();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !manualData.inTime) return;
    setSyncing(true);

    const clock_in = new Date(`${manualData.date}T${manualData.inTime}:00`).toISOString();
    const clock_out = manualData.outTime
      ? new Date(`${manualData.date}T${manualData.outTime}:00`).toISOString()
      : null;

    const isMockUser = !!localStorage.getItem('mock_hr_session') || !session?.access_token;

    if (isMockUser) {
      const localLogs = JSON.parse(localStorage.getItem('hr_attendance_logs') || '[]');
      const existingIdx = localLogs.findIndex((l: any) => l.user_id === profile.id && l.date === manualData.date);
      
      const record = {
        id: existingIdx >= 0 ? localLogs[existingIdx].id : `MOCK-ATT-${Date.now()}`,
        user_id: profile.id,
        date: manualData.date,
        clock_in,
        clock_out,
        status: 'present',
        entry_type: 'manual',
        profiles: {
          employee_id: profile.employeeId || profile.employee_id,
          full_name: profile.full_name,
          designation: profile.designation
        }
      };

      if (existingIdx >= 0) localLogs[existingIdx] = record;
      else localLogs.unshift(record);

      localStorage.setItem('hr_attendance_logs', JSON.stringify(localLogs));
      setManualData({ date: new Date().toISOString().split('T')[0], inTime: '', outTime: '' });
      await fetchAttendance();
      showToast('✓ Attendance recorded successfully!');
      setSyncing(false);
      return;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', profile.id)
        .eq('date', manualData.date)
        .maybeSingle();

      if (fetchError) {
        console.warn('Supabase fetch error, falling back to local storage:', fetchError);
        // Fallback to local storage if Supabase is unavailable/erroring
        const localLogs = JSON.parse(localStorage.getItem('hr_attendance_logs') || '[]');
        const record = {
          id: `LOCAL-ATT-${Date.now()}`,
          user_id: profile.id,
          date: manualData.date,
          clock_in,
          clock_out,
          status: 'present',
          entry_type: 'manual',
          profiles: {
            employee_id: profile.employeeId || profile.employee_id,
            full_name: profile.full_name,
            designation: profile.designation
          }
        };
        localLogs.unshift(record);
        localStorage.setItem('hr_attendance_logs', JSON.stringify(localLogs));
        setManualData({ date: new Date().toISOString().split('T')[0], inTime: '', outTime: '' });
        await fetchAttendance();
        showToast('✓ Attendance recorded (Local Backup)!');
        return;
      }

      let saveError;
      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({ clock_in, clock_out, status: 'present', entry_type: 'manual' })
          .eq('id', existing.id);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({ user_id: profile.id, date: manualData.date, clock_in, clock_out, status: 'present', entry_type: 'manual' });
        saveError = error;
      }

      if (saveError) {
        showToast(`❌ ${saveError.message || 'Failed to save.'}`);
      } else {
        setManualData({ date: new Date().toISOString().split('T')[0], inTime: '', outTime: '' });
        await fetchAttendance();
        showToast('✓ Attendance recorded successfully!');
      }
    } catch (err: any) {
      showToast('❌ Unexpected error.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchDate(term);
    
    if (isAdmin) {
      if (!term) {
        setFilteredEmployees(adminLogs);
      } else {
        const lowerTerm = term.toLowerCase();
        const filtered = adminLogs.filter(log => 
          log.profiles?.full_name?.toLowerCase().includes(lowerTerm) || 
          log.profiles?.employee_id?.toLowerCase().includes(lowerTerm) ||
          log.profiles?.designation?.toLowerCase().includes(lowerTerm)
        );
        setFilteredEmployees(filtered);
      }
    } else {
      if (!term) {
        setFilteredLogs(logs.slice(0, 5));
      } else {
        const filtered = logs.filter(log => log.date.includes(term));
        setFilteredLogs(filtered);
      }
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const todayRecord = !isAdmin ? logs.find(l => l.date === new Date().toISOString().split('T')[0]) : null;

  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <Fingerprint className="text-brand-teal" size={28} />
            Employee Entrance Log (Admin)
          </h2>
          <Button 
            variant="outline" 
            onClick={handleSync} 
            disabled={syncing}
            className="gap-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync with Biometric Device'}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Daily Entrance Records</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Live tracking of employees entering the company premises.</p>
            </div>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search employee name or ID..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-brand-teal focus:border-brand-teal"
                value={searchDate}
                onChange={handleSearch}
              />
            </div>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-center">Date</th>
                      <th className="px-6 py-4 font-bold">Employee ID</th>
                      <th className="px-6 py-4 font-bold">Employee Name</th>
                      <th className="px-6 py-4 font-bold">Role</th>
                      <th className="px-6 py-4 font-bold">In Time</th>
                      <th className="px-6 py-4 font-bold">Out Time</th>
                      <th className="px-6 py-4 font-bold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading attendance logs...</td></tr>
                    ) : filteredEmployees.length > 0 ? filteredEmployees.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                           <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{log.date}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-teal whitespace-nowrap">{log.profiles?.employee_id || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold text-brand-navy whitespace-nowrap">{log.profiles?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{log.profiles?.designation || 'Staff'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="blue" className="bg-brand-navy/5 text-brand-navy border-none">{formatTime(log.clock_in)}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.clock_out ? (
                            <Badge variant="green" className="bg-brand-teal/5 text-brand-teal border-none">{formatTime(log.clock_out)}</Badge>
                          ) : (
                            <span className="text-xs text-amber-500 font-medium animate-pulse">On Premises</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={log.entry_type === 'manual' ? 'amber' : 'neutral'} className="text-[10px] uppercase">
                            {log.entry_type === 'manual' ? 'Manual' : 'System'}
                          </Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                          No attendance records found matching "{searchDate}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="text-brand-teal" size={20} />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
          <Fingerprint className="text-brand-teal" size={28} />
          Biometric Attendance logs
        </h2>
        <Button 
          variant="outline" 
          onClick={handleSync} 
          disabled={syncing}
          className="gap-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync with Biometric'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-r from-brand-navy to-brand-navy-light text-white border-none overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8">
               <Fingerprint size={160} />
            </div>
            <CardContent className="p-8 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-2xl bg-white/10 backdrop-blur-md`}>
                  <Clock size={40} className="text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Today's Biometric Status</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-emerald-500 text-white border-none px-3 py-1">
                      {todayRecord ? 'Device Synced' : 'Awaiting Metadata'}
                    </Badge>
                    <span className="text-white/60 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-8 items-center border-l border-white/20 pl-8">
                <div className="text-center">
                  <p className="text-xs text-brand-teal uppercase font-bold tracking-wider mb-1">In Time</p>
                  <p className="text-2xl font-bold">{formatTime(todayRecord?.clock_in)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-brand-teal uppercase font-bold tracking-wider mb-1">Out Time</p>
                  <p className="text-2xl font-bold">{formatTime(todayRecord?.clock_out)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle>Recent Synchronizations (Last 5 Days)</CardTitle>
              <div className="relative w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search date..." 
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-full focus:ring-brand-teal focus:border-brand-teal"
                  value={searchDate}
                  onChange={handleSearch}
                />
              </div>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase border-b">
                      <tr>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold">Punch In</th>
                        <th className="px-6 py-4 font-bold">Punch Out</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading records...</td></tr>
                      ) : filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-brand-navy">
                            {new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{formatTime(log.clock_in)}</td>
                          <td className="px-6 py-4 text-gray-600">{formatTime(log.clock_out)}</td>
                          <td className="px-6 py-4">
                            <Badge variant={log.status === 'present' ? 'green' : 'red'}>
                              {log.status === 'present' ? (log.entry_type === 'manual' ? 'Manual Verified' : 'Verified') : (log.status || 'Pending')}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                            {searchDate ? `No records found for "${searchDate}"` : "No history found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-t-4 border-t-brand-teal">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
               <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="p-3 bg-white text-brand-teal shadow-sm rounded-lg"><CalendarDays size={20} /></div>
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Working Days</p>
                   <p className="text-lg font-bold">22</p>
                 </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                 <div className="p-3 bg-white text-status-green shadow-sm rounded-lg"><CheckCircle size={20} /></div>
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Present Days</p>
                   <p className="text-lg font-bold">{logs.filter(l => l.status === 'present').length}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                 <div className="p-3 bg-white text-brand-navy shadow-sm rounded-lg"><BarChart2 size={20} /></div>
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Avg Hours / Day</p>
                   <p className="text-lg font-bold">8h 15m</p>
                 </div>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-navy-light/5 border-dashed border-2">
            <CardContent className="p-6 text-center space-y-3">
              <Fingerprint size={48} className="mx-auto text-brand-navy/20" />
              <div>
                <h4 className="font-bold text-brand-navy">Biometric Sync</h4>
                <p className="text-xs text-gray-500 mt-1">Data is automatically synced from the office biometric device every 30 minutes.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-brand-navy">
            <CardHeader>
              <CardTitle className="text-lg">Manual Entry</CardTitle>
              <p className="text-xs text-gray-400">Add attendance record manually.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-brand-teal outline-none" 
                      value={manualData.date}
                      onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Entry Type</label>
                    <Badge variant="neutral" className="w-full justify-center py-1.5 h-8">Manual Entry</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Clock In</label>
                    <input 
                      type="time" 
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-brand-teal outline-none" 
                      value={manualData.inTime}
                      onChange={(e) => setManualData({ ...manualData, inTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Clock Out</label>
                    <input 
                      type="time" 
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-brand-teal outline-none" 
                      value={manualData.outTime}
                      onChange={(e) => setManualData({ ...manualData, outTime: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={syncing} className="w-full text-xs font-bold py-2 bg-brand-navy hover:bg-black">
                  {syncing ? 'Saving...' : 'Submit Manual Record'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
