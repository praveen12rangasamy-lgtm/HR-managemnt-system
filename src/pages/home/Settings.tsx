import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsIcon, Shield, Bell, Key, CheckCircle, AlertCircle, Lock, RefreshCw, Smartphone, Database, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordState, setPasswordState] = useState({ old: '', new: '', confirm: '' });
  const [toast, setToast] = useState('');
  const [step, setStep] = useState(1); // 1: Old Password, 2: New Password

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get stored credentials to verify and update
    const storedCredentials = JSON.parse(localStorage.getItem('hr_employee_credentials') || '[]');
    const userCredIndex = storedCredentials.findIndex((c: any) => c.email === profile?.email || c.employeeId === profile?.employeeId);

    if (step === 1) {
      if (userCredIndex === -1) {
        showToast('Account not found in secure storage! ✗');
        return;
      }

      const currentCreds = storedCredentials[userCredIndex];
      
      if (passwordState.old === currentCreds.password) {
        setStep(2);
      } else {
        showToast('Incorrect old password! ✗');
      }
    } else {
      if (passwordState.new.length < 8) {
        showToast('Password must be at least 8 characters! ✗');
      } else if (passwordState.new !== passwordState.confirm) {
        showToast('Passwords do not match! ✗');
      } else {
        // Update the password in localStorage
        if (userCredIndex !== -1) {
          storedCredentials[userCredIndex].password = passwordState.new;
          localStorage.setItem('hr_employee_credentials', JSON.stringify(storedCredentials));
          
          showToast('Password updated successfully! ✓');
          setShowPasswordChange(false);
          setStep(1);
          setPasswordState({ old: '', new: '', confirm: '' });
        } else {
          showToast('Failed to identify session. Please re-login. ✗');
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
    <div className="space-y-6 max-w-6xl">
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
        {/* Security & Password Card */}
        <Card className="border-t-4 border-t-brand-navy flex flex-col">
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
                      <label className="text-xs font-bold text-gray-400 uppercase">Old Password</label>
                      <input 
                        type="password" 
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                        value={passwordState.old}
                        onChange={(e) => setPasswordState({...passwordState, old: e.target.value})}
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">New Password</label>
                        <input 
                          type="password" 
                          className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                          value={passwordState.new}
                          onChange={(e) => setPasswordState({...passwordState, new: e.target.value})}
                          placeholder="Min. 12 characters"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                          value={passwordState.confirm}
                          onChange={(e) => setPasswordState({...passwordState, confirm: e.target.value})}
                          placeholder="Repeat new password"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 bg-brand-navy hover:bg-black">
                      {step === 1 ? 'Verify Old Password' : 'Update Password'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowPasswordChange(false); setStep(1); }} className="text-gray-400">Cancel</Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-t-4 border-t-brand-teal flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell size={22} className="text-brand-teal" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <p className="text-sm text-gray-500">Configure which system alerts and updates you wish to receive.</p>
            
            <div className="space-y-4">
              {[
                { label: 'Payroll & Tax Notifications', tag: 'High Urgency', color: 'text-red-500', bg: 'bg-red-50', desc: 'Updates regarding your monthly disbursement, salary credit, and tax document availability.' },
                { label: 'Admin & HR Operations', tag: 'Action-Oriented', color: 'text-brand-teal', bg: 'bg-brand-teal/10', desc: 'Policy updates, performance review requests, and operational announcements.' },
                { label: 'Security & Account Alerts', tag: 'Critical', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Important alerts for suspicious logins, password changes, and MFA activation.' }
              ].map((notif, i) => (
                <div key={i} className="p-5 border rounded-2xl hover:bg-gray-50/50 transition-all space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-navy">{notif.label}</span>
                    <Badge className={`${notif.bg} ${notif.color} border-none`}>{notif.tag}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{notif.desc}</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative inline-flex items-center h-5 w-9 shrink-0">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-brand-teal transition-colors">Enabled for Email & Web</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
               <AlertCircle className="text-blue-500 shrink-0" size={18} />
               <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                 Administrator posts categorized as "Critical" or "High Urgency" will automatically trigger notifications regardless of toggle settings to ensure organizational compliance.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
