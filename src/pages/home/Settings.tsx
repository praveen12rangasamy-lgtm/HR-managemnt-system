import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsIcon, Shield, Bell, Key, CheckCircle, AlertCircle, Lock, RefreshCw, Smartphone, Database, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getScopedKey } from '../../utils/tenantHelper';

const Settings = () => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [isResetting, setIsResetting] = useState(false);
  
  const handleSystemReset = async () => {
    if (!window.confirm("CRITICAL WARNING: This will delete ALL employees, payroll history, loans, and tax records permanently. This cannot be undone. Are you absolutely sure?")) {
      return;
    }

    setIsResetting(true);
    try {
      const adminEmail = profile?.email || '';
      const primaryAdmins = ['praveen12rangasamy@gmail.com', 'pranavanandan18@gmail.com', 'pranavananthan18@gmail.com', 'jin@gmail.com'];
      const isPrimary = primaryAdmins.includes(adminEmail.trim().toLowerCase());

      // 1. Delete profiles hired by this admin (or all if primary admin)
      let profileDeleteQuery = supabase.from('profiles').delete();
      if (adminEmail && !isPrimary) {
        profileDeleteQuery = profileDeleteQuery.eq('hired_by', adminEmail);
      } else {
        profileDeleteQuery = profileDeleteQuery.neq('id', profile?.id);
      }
      const { error: profErr } = await profileDeleteQuery;
      
      if (profErr) throw profErr;

      // 2. Clear finance-related tables and calendar events scoped to this admin's employees
      if (isPrimary) {
        await supabase.from('payroll_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('loans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('tax_declarations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Reset calendar events to default government holidays
        await supabase.from('calendar_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const defaultHolidays = [
          { id: 'gov-holiday-1', title: 'New Year\'s Day 🎆', description: 'Official holiday for the first day of the year.', date: '2026-01-01', category: 'Company Holidays', location: 'National Holiday', is_custom: false },
          { id: 'gov-holiday-2', title: 'Republic Day 🇮🇳', description: 'Honors the date on which the Constitution of India came into effect.', date: '2026-01-26', category: 'Company Holidays', location: 'National Holiday', is_custom: false },
          { id: 'gov-holiday-3', title: 'Good Friday ✝️', description: 'Christian holiday commemorating the crucifixion of Jesus Christ.', date: '2026-04-03', category: 'Company Holidays', location: 'Gazetted Holiday', is_custom: false },
          { id: 'gov-holiday-4', title: 'May Day / Labour Day 🛠️', description: 'Celebration of workers and laborers.', date: '2026-05-01', category: 'Company Holidays', location: 'Gazetted Holiday', is_custom: false },
          { id: 'gov-holiday-5', title: 'Independence Day 🇮🇳', description: 'Commemorates the nation\'s independence.', date: '2026-08-15', category: 'Company Holidays', location: 'National Holiday', is_custom: false },
          { id: 'gov-holiday-6', title: 'Gandhi Jayanti 👓', description: 'Birthday of Mahatma Gandhi.', date: '2026-10-02', category: 'Company Holidays', location: 'National Holiday', is_custom: false },
          { id: 'gov-holiday-7', title: 'Diwali / Deepavali 🪔', description: 'Festival of lights.', date: '2026-11-08', category: 'Company Holidays', location: 'Gazetted Holiday', is_custom: false },
          { id: 'gov-holiday-8', title: 'Christmas Day 🎄', description: 'Annual festival commemorating the birth of Jesus Christ.', date: '2026-12-25', category: 'Company Holidays', location: 'National Holiday', is_custom: false }
        ];
        await supabase.from('calendar_events').insert(defaultHolidays);
      } else {
        const { data: myEmployees } = await supabase
          .from('profiles')
          .select('id')
          .eq('hired_by', adminEmail);
        const myEmployeeIds = (myEmployees || []).map(p => p.id);
        
        await supabase.from('payroll_runs').delete().in('employee_id', myEmployeeIds);
        await supabase.from('loans').delete().in('employee_id', myEmployeeIds);
        await supabase.from('tax_declarations').delete().in('employee_id', myEmployeeIds);

        // Delete custom calendar events created by this admin
        await supabase.from('calendar_events').delete().like('id', `custom-event-${adminEmail}-%`);
      }

      // 3. Clear relevant tenant-scoped localStorage items
      const keysToWipe = [
        getScopedKey('hr_employee_credentials', profile, user), 
        getScopedKey('hr_employee_submissions', profile, user),
        getScopedKey('hr_loan_applications', profile, user),
        getScopedKey('hr_applicants', profile, user),
        getScopedKey('hr_leave_requests', profile, user),
        getScopedKey('hr_role_hierarchy', profile, user),
        getScopedKey('all_equipment', profile, user),
        getScopedKey('software_licenses', profile, user),
        getScopedKey('asset_queries', profile, user),
        getScopedKey('hr_notifications', profile, user),
        getScopedKey('hr_payroll_ledger', profile, user),
        getScopedKey('hr_courses_assigned', profile, user)
      ];
      keysToWipe.forEach(k => localStorage.removeItem(k));

      alert("System has been successfully reset. Your tenant's employee data has been wiped.");
      window.location.reload();
    } catch (err: any) {
      alert(`Error during reset: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordState, setPasswordState] = useState({ old: '', new: '', confirm: '' });
  const [toast, setToast] = useState('');
  const [step, setStep] = useState(1); 
  const [notificationSettings, setNotificationSettings] = useState({
    payroll: true,
    hr: true,
    security: true
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;

    if (step === 1) {
      showToast('Verifying current password...');
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordState.old
      });

      if (error) {
        showToast('Incorrect old password! ✗');
      } else {
        setStep(2);
        showToast('Old password verified! ✓');
      }
    } else {
      if (passwordState.new.length < 8) {
        showToast('Password must be at least 8 characters! ✗');
      } else if (passwordState.new !== passwordState.confirm) {
        showToast('Passwords do not match! ✗');
      } else {
        showToast('Updating password...');
        const { error } = await supabase.auth.updateUser({ password: passwordState.new });

        if (error) {
          showToast(`Failed to update password: ${error.message} ✗`);
        } else {
          // If employee, also update their password field in public.profiles table
          if (profile.role === 'employee') {
            await supabase
              .from('profiles')
              .update({ password: passwordState.new })
              .eq('id', profile.id);
          }
          
          showToast('Password updated successfully! ✓');
          setShowPasswordChange(false);
          setStep(1);
          setPasswordState({ old: '', new: '', confirm: '' });
        }
      }
    }
  };

  const securityProtocols = [
    { label: 'Passwords', desc: '12+ Characters, No forced periodic resets.', icon: Key },
    { label: 'MFA', desc: 'Authenticator App or Biometrics (Required for Admins).', icon: Smartphone },
    { label: 'Encryption', desc: 'SSL/TLS in transit, AES-256 at rest.', icon: Lock },
    { label: 'Logging', desc: '100% Audit trail of all salary/document access.', icon: Database },
    { label: 'Compliance', desc: 'DPDP (India) / GDPR (Global) ready.', icon: BookOpen }
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="text-brand-teal" size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-teal/10 rounded-lg">
          <SettingsIcon className="text-brand-teal" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy">Account Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-t-4 border-t-brand-navy flex flex-col shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <Shield size={22} className="text-brand-navy" />
                Security & Data Protection
              </CardTitle>
              {!showPasswordChange && (
                <Button size="sm" variant="outline" onClick={() => setShowPasswordChange(true)} className="gap-2">
                  <RefreshCw size={14} /> Change Password
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            {!showPasswordChange ? (
              <div className="grid gap-4">
                {securityProtocols.map((protocol, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-teal/20 transition-all">
                    <div className="p-2 bg-white rounded-lg border shadow-sm h-fit">
                      <protocol.icon size={18} className="text-brand-navy" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-brand-navy">{protocol.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{protocol.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-brand-navy/5 p-6 rounded-2xl border border-brand-navy/10 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2 mb-6 pb-2 border-b border-brand-navy/10">
                  <Key size={18} className="text-brand-navy" />
                  <h4 className="font-bold text-brand-navy">Change Account Password</h4>
                </div>
                <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                  {step === 1 ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Old Password</label>
                      <input type="password" className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={passwordState.old} onChange={(e) => setPasswordState({...passwordState, old: e.target.value})} placeholder="Enter current password" required />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">New Password</label>
                        <input type="password" className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={passwordState.new} onChange={(e) => setPasswordState({...passwordState, new: e.target.value})} placeholder="Min. 8 characters" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Confirm Password</label>
                        <input type="password" className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" value={passwordState.confirm} onChange={(e) => setPasswordState({...passwordState, confirm: e.target.value})} placeholder="Repeat new password" required />
                      </div>
                    </>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 bg-brand-navy hover:bg-black font-bold h-12">
                      {step === 1 ? 'Verify Old Password' : 'Update Password'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowPasswordChange(false); setStep(1); }} className="text-gray-400 h-12">Cancel</Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-brand-teal flex flex-col shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell size={22} className="text-brand-teal" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <p className="text-sm text-gray-500">Manage how you receive updates and system alerts.</p>
            <div className="space-y-4">
              {[
                { key: 'payroll', label: 'Payroll Alerts', color: 'text-red-500', bg: 'bg-red-50', desc: 'Monthly disbursement and tax document availability.' },
                { key: 'hr', label: 'HR Operations', color: 'text-brand-teal', bg: 'bg-brand-teal/10', desc: 'Policy updates and operational announcements.' },
                { key: 'security', label: 'Security Alerts', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Suspicious logins and account changes.' }
              ].map((notif) => (
                <div key={notif.key} className="p-4 border rounded-2xl hover:bg-gray-50/50 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-brand-navy text-sm">{notif.label}</span>
                    <label className="relative inline-flex items-center h-4 w-8 shrink-0 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        title={notif.label}
                        aria-label={notif.label}
                        checked={notificationSettings[notif.key as keyof typeof notificationSettings]} 
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          [notif.key]: e.target.checked
                        })}
                      />
                      <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-brand-teal after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{notif.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
               <AlertCircle className="text-blue-500 shrink-0" size={16} />
               <p className="text-[9px] text-blue-800 leading-relaxed font-medium">
                 Critical alerts (Security/Compliance) are enforced by system policy and cannot be disabled.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
