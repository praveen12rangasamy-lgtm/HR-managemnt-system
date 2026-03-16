import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserMinus, Send, RefreshCw, Mail, Briefcase, Calendar, Clock, LogOut as OffboardIcon, Layout, Fingerprint, Search, Plus, X, Bell } from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0
  });
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [absences, setAbsences] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', message: '' });
  const [submission, setSubmission] = useState({
    bankAcc: '',
    ifsc: '',
    pan: '',
    offerLetter: false,
    aadhar: false,
    degree: false,
    photo: false
  });
  const [draftDocs, setDraftDocs] = useState({
    offerLetter: false,
    aadhar: false,
    degree: false,
    photo: false
  });

  useEffect(() => {
    if (profile?.role === 'employee') {
      const allSubmissions = JSON.parse(localStorage.getItem('hr_employee_submissions') || '{}');
      const empSub = allSubmissions[profile.employeeId || profile.employee_id] || {};
      setSubmission(prev => ({ ...prev, ...empSub }));
    }
  }, [profile]);

  const handleDocSubmit = () => {
    const allSubmissions = JSON.parse(localStorage.getItem('hr_employee_submissions') || '{}');
    const empId = profile?.employeeId || profile?.employee_id;
    if (!empId) return;

    allSubmissions[empId] = {
      ...submission,
      bankAcc: submission.bankAcc || 'Uploaded',
      ifsc: submission.ifsc || 'Uploaded',
      pan: submission.pan || 'Uploaded',
      offerLetter: true,
      aadhar: true,
      degree: true,
      photo: true
    };
    
    localStorage.setItem('hr_employee_submissions', JSON.stringify(allSubmissions));
    setSubmission(allSubmissions[empId]);
    alert('Onboarding documents submitted successfully for review!');
  };

  const handleFileChange = (docType: keyof typeof draftDocs) => {
    setDraftDocs(prev => ({ ...prev, [docType]: true }));
  };

  const postBroadcast = () => {
    if (!newUpdate.title || !newUpdate.message) return;
    
    const notifications = JSON.parse(localStorage.getItem('hr_notifications') || '[]');
    const notification = {
      id: `NOTIF-${Date.now()}`,
      type: 'broadcast',
      title: newUpdate.title,
      message: newUpdate.message,
      time: 'Just now',
      admin_context: 'praveen12rangasamy@gmail.com'
    };
    
    notifications.unshift(notification);
    localStorage.setItem('hr_notifications', JSON.stringify(notifications.slice(0, 15)));
    
    setNewUpdate({ title: '', message: '' });
    setShowBroadcastModal(false);
    alert('Update broadcasted to all employees! ✓');
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAllData();
    } else {
      fetchEmployeeData();
    }
  }, [profile]);

  const fetchEmployeeData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setRecentActivity(data[0]);
      }
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchAbsences(),
      fetchProfiles()
    ]);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      let allProfiles = data || [];

      const mockCreds = localStorage.getItem('hr_employee_credentials');
      if (mockCreds) {
        const parsed = JSON.parse(mockCreds);
        const mockProfiles = parsed.map((creds: any) => ({
          id: creds.employeeId,
          employee_id: creds.employeeId,
          full_name: creds.full_name,
          email: creds.email,
          role: 'employee',
          designation: creds.role || 'New Hire',
          organization_id: profile?.organization_id,
          is_mock: true
        }));
        
        const supabaseEmails = new Set(allProfiles.map(p => p.email));
        allProfiles = [...allProfiles, ...mockProfiles.filter((mp: any) => !supabaseEmails.has(mp.email))];
      }
      if (!error) setProfiles(allProfiles);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  const handleSync = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchAbsences = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          type,
          start_date,
          end_date,
          profiles (
            full_name,
            department
          )
        `)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      let allAbsences = data || [];

      const mockLeaves = localStorage.getItem('hr_leave_requests');
      if (mockLeaves) {
        const parsed = JSON.parse(mockLeaves);
        const approvedMocks = parsed.filter((l: any) => 
          l.status === 'approved' && l.start_date <= today && l.end_date >= today
        ).map((l: any) => ({
          type: l.type,
          start_date: l.start_date,
          end_date: l.end_date,
          profiles: {
            full_name: l.name,
            department: 'New Hire'
          }
        }));
        allAbsences = [...allAbsences, ...approvedMocks];
      }
      if (!error) setAbsences(allAbsences);
    } catch (err) {
      console.error('Error fetching absences:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: realCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const today = new Date().toISOString().split('T')[0];
      const { count: realPresent } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).not('clock_in', 'is', null);
      const { count: realLeave } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved').lte('start_date', today).gte('end_date', today);

      let totalEmployees = realCount || 0;
      let presentToday = realPresent || 0;
      let onLeave = realLeave || 0;

      const mockCreds = localStorage.getItem('hr_employee_credentials');
      if (mockCreds) {
        totalEmployees += JSON.parse(mockCreds).length;
      }

      const mockLeaves = localStorage.getItem('hr_leave_requests');
      if (mockLeaves) {
        const activeMocks = JSON.parse(mockLeaves).filter((l: any) => 
          l.status === 'approved' && l.start_date <= today && l.end_date >= today
        ).length;
        onLeave += activeMocks;
      }

      setStats({
        totalEmployees,
        presentToday,
        onLeave
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="space-y-2">
          <h2 className="text-3xl font-bold text-brand-navy">Welcome back, {profile?.full_name?.split(' ')[0] || 'Employee'}! 👋</h2>
          <p className="text-gray-500">Here's what's happening in your workspace today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/dashboard/updates" className="group">
            <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-brand-teal/5 to-white border-l-4 border-l-brand-teal overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-navy">Updates</h3>
                  <p className="text-sm text-gray-500 mt-1">Check company announcements and new job openings.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/myspace/attendance" className="group">
            <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-emerald-50/30 to-white border-l-4 border-l-status-green overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-status-green group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-navy">Attendance</h3>
                  <p className="text-sm text-gray-500 mt-1">Mark your daily presence and track work hours.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/myspace/leaves" className="group">
            <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-50/30 to-white border-l-4 border-l-blue-500 overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-navy">Leave</h3>
                  <p className="text-sm text-gray-500 mt-1">Request time off and view your remaining balance.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Onboarding Document Center</CardTitle>
              <Badge variant="blue">Compliance Required</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50 hover:border-brand-teal/50 transition-colors">
                    <label className="text-xs font-bold text-brand-navy uppercase flex items-center justify-between">
                      Offer Letter
                      {submission.offerLetter ? (
                        <Badge variant="green">Uploaded</Badge>
                      ) : draftDocs.offerLetter ? (
                        <Badge variant="blue">Ready</Badge>
                      ) : (
                        <Badge variant="amber">Required</Badge>
                      )}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400" onChange={() => handleFileChange('offerLetter')} />
                  </div>
                  <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50 hover:border-brand-teal/50 transition-colors">
                    <label className="text-xs font-bold text-brand-navy uppercase flex items-center justify-between">
                      Aadhar Card
                      {submission.aadhar ? (
                        <Badge variant="green">Uploaded</Badge>
                      ) : draftDocs.aadhar ? (
                        <Badge variant="blue">Ready</Badge>
                      ) : (
                        <Badge variant="amber">Required</Badge>
                      )}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400" onChange={() => handleFileChange('aadhar')} />
                  </div>
                  <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50 hover:border-brand-teal/50 transition-colors">
                    <label className="text-xs font-bold text-brand-navy uppercase flex items-center justify-between">
                      Degree Certificate
                      {submission.degree ? (
                        <Badge variant="green">Uploaded</Badge>
                      ) : draftDocs.degree ? (
                        <Badge variant="blue">Ready</Badge>
                      ) : (
                        <Badge variant="amber">Required</Badge>
                      )}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400" onChange={() => handleFileChange('degree')} />
                  </div>
                  <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50 hover:border-brand-teal/50 transition-colors">
                    <label className="text-xs font-bold text-brand-navy uppercase flex items-center justify-between">
                      Photograph
                      {submission.photo ? (
                        <Badge variant="green">Uploaded</Badge>
                      ) : draftDocs.photo ? (
                        <Badge variant="blue">Ready</Badge>
                      ) : (
                        <Badge variant="amber">Required</Badge>
                      )}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400" onChange={() => handleFileChange('photo')} />
                  </div>
                </div>

                <div className="p-6 border rounded-2xl bg-brand-navy/5 space-y-4">
                  <h5 className="text-sm font-bold text-brand-navy">Financial & ID Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Bank Account No</label>
                      <input 
                        type="text" 
                        placeholder="Enter 12-16 digit No" 
                        className="w-full border p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                        value={submission.bankAcc}
                        onChange={(e) => setSubmission({...submission, bankAcc: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Bank IFSC Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. SBIN0001234" 
                        className="w-full border p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                        value={submission.ifsc}
                        onChange={(e) => setSubmission({...submission, ifsc: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">PAN Card Number</label>
                      <input 
                        type="text" 
                        placeholder="P-A-N Number" 
                        className="w-full border p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-brand-teal"
                        value={submission.pan}
                        onChange={(e) => setSubmission({...submission, pan: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  className={`w-full py-6 h-auto text-sm font-bold shadow-lg transition-all ${
                    (draftDocs.offerLetter && draftDocs.aadhar && draftDocs.degree && draftDocs.photo && submission.bankAcc && submission.ifsc && submission.pan) 
                    ? 'bg-brand-teal hover:bg-emerald-600 shadow-brand-teal/20' 
                    : 'bg-gray-300 cursor-not-allowed grayscale'
                  }`} 
                  onClick={handleDocSubmit}
                  disabled={!(draftDocs.offerLetter && draftDocs.aadhar && draftDocs.degree && draftDocs.photo && submission.bankAcc && submission.ifsc && submission.pan)}
                >
                  {(draftDocs.offerLetter && draftDocs.aadhar && draftDocs.degree && draftDocs.photo && submission.bankAcc && submission.ifsc && submission.pan) 
                    ? 'Submit All Documents for Verification' 
                    : 'Upload All Documents to Enable Submission'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>My Company Profile</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-teal flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-teal/20">
                  {profile?.full_name?.[0] || 'E'}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-brand-navy">{profile?.full_name}</h4>
                  <p className="text-sm text-brand-teal font-medium uppercase tracking-wider">{profile?.designation || 'Hired Professional'}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <Fingerprint size={18} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</p>
                    <p className="font-mono font-bold text-brand-navy">{profile?.employeeId || profile?.employee_id || 'VYR-2024-TMP'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase size={18} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Organization</p>
                    <p className="font-medium text-brand-navy">Vyara HR Solution Pvt Ltd</p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full text-xs h-10 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white">Download ID Card PDF</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Updates for Employees */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
            <div className="flex items-center gap-2">
              <Bell className="text-brand-teal" size={20} />
              <CardTitle>Company Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {(() => {
                const notifications = JSON.parse(localStorage.getItem('hr_notifications') || '[]')
                  .filter((n: any) => n.admin_context === 'praveen12rangasamy@gmail.com');

                if (notifications.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <Bell className="mx-auto mb-2 opacity-20" size={32} />
                      <p className="italic text-sm">No recent updates from management.</p>
                    </div>
                  );
                }
                return notifications.map((n: any) => (
                  <div key={n.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-teal/30 hover:bg-brand-teal/5 transition-all group">
                    <div className={`p-3 rounded-lg flex-shrink-0 ${n.type === 'broadcast' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-navy/10 text-brand-navy'}`}>
                      {n.type === 'broadcast' ? <Bell size={20} /> : <Briefcase size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-brand-navy group-hover:text-black transition-colors">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{n.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-navy">Dashboard Snapshot</h2>
        <Button 
          variant="outline" 
          onClick={handleSync} 
          disabled={refreshing}
          className="gap-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Fetch & Sync Accounts'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-brand-teal">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <h3 className="text-3xl font-bold mt-2">
                {loading ? '...' : stats.totalEmployees}
              </h3>
            </div>
            <div className="p-4 bg-brand-bg rounded-full text-brand-teal">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-green">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Present Today</p>
              <h3 className="text-3xl font-bold mt-2">
                {loading ? '...' : stats.presentToday}
              </h3>
            </div>
            <div className="p-4 bg-emerald-50 rounded-full text-status-green">
              <UserCheck size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-amber">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">On Leave</p>
              <h3 className="text-3xl font-bold mt-2">
                {loading ? '...' : stats.onLeave}
              </h3>
            </div>
            <div className="p-4 bg-amber-50 rounded-full text-status-amber">
              <UserMinus size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dashboard/updates" className="group">
          <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-brand-teal/5 to-white border-l-4 border-l-brand-teal overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Company Updates</h3>
                <p className="text-xs text-gray-500 mt-1">Post announcements and manage job openings.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/hiring" className="group">
          <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-50/30 to-white border-l-4 border-l-blue-500 overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Layout size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Hiring Pipeline</h3>
                <p className="text-xs text-gray-500 mt-1">Manage applicants, screening, and onboarding.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/offboarding" className="group">
          <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-amber-50/30 to-white border-l-4 border-l-status-amber overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-status-amber group-hover:scale-110 transition-transform">
                <OffboardIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Offboarding</h3>
                <p className="text-xs text-gray-500 mt-1">Manage exit processes and asset returns.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Current Employees</CardTitle>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-teal transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search name or email..." 
                className="pl-9 pr-4 py-2 border rounded-xl bg-gray-50/50 text-xs outline-none focus:ring-2 focus:ring-brand-teal w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = profiles.filter(p => 
                      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    if (filtered.length === 0) {
                      return <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No employees found matching "{searchTerm}"</td></tr>;
                    }

                    return filtered.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-brand-navy">
                        {p.full_name || 'N/A'}
                        <div className="text-[10px] text-gray-400 font-normal">{p.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> {p.email}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <Badge variant={p.role === 'admin' ? 'blue' : 'neutral'}>{p.role}</Badge> 
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {p.designation || 'Staff'}
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <Bell className="text-brand-teal" size={20} />
                <CardTitle>New Update</CardTitle>
              </div>
              {profile?.role === 'admin' && (
                <Button 
                  size="sm" 
                  className="bg-brand-teal hover:bg-emerald-600 rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  onClick={() => setShowBroadcastModal(true)}
                >
                  <Plus size={20} />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {(() => {
                  const notifications = JSON.parse(localStorage.getItem('hr_notifications') || '[]')
                    .filter((n: any) => n.admin_context === 'praveen12rangasamy@gmail.com');

                  if (notifications.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <Bell className="mx-auto mb-2 opacity-20" size={48} />
                        <p className="italic">No recent updates for your organization.</p>
                      </div>
                    );
                  }
                  return notifications.map((n: any) => (
                    <div key={n.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-teal/30 hover:bg-brand-teal/5 transition-all group">
                      <div className={`p-3 rounded-lg flex-shrink-0 ${n.type === 'broadcast' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-navy/10 text-brand-navy'}`}>
                        {n.type === 'broadcast' ? <Bell size={20} /> : <Briefcase size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-brand-navy group-hover:text-black transition-colors">{n.title}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{n.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
      </div>

      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-none shadow-2xl animate-in zoom-in duration-300">
            <CardHeader className="flex flex-row justify-between items-center border-b">
              <CardTitle className="flex items-center gap-2">
                <Send size={18} className="text-brand-teal" />
                Broadcast New Update
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBroadcastModal(false)}>
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mandatory Policy Change" 
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Content / Message</label>
                <textarea 
                  rows={4} 
                  placeholder="Type the content of your update here..." 
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                  value={newUpdate.message}
                  onChange={(e) => setNewUpdate({ ...newUpdate, message: e.target.value })}
                />
              </div>
              <Button 
                className="w-full py-6 text-base font-bold bg-brand-navy hover:bg-black shadow-lg"
                onClick={postBroadcast}
              >
                Post Update to All Employees
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
