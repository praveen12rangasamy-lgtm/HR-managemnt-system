import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, AlertCircle, Send, FileText, Upload, ShieldCheck, User, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Resignation = () => {
  const { profile } = useAuth();
  const [resigned, setResigned] = useState(false);
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState({ lwd: '', reason: '' });
  const [checklist, setChecklist] = useState<any>({
    resignation_letter: false,
    lwd_confirmed: false,
    assets_collected: false,
    kt_completed: false,
    no_dues_verified: false,
    no_loans_pending: false
  });

  const handleResign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const requestId = `OFF-${Date.now()}`;
    const request = {
      id: requestId,
      user_id: profile.id,
      name: profile.full_name,
      empId: profile.employeeId || profile.employee_id,
      role: profile.role,
      designation: profile.designation || 'Employee',
      lwd: formData.lwd,
      reason: formData.reason,
      status: 'Pending',
      submitted_at: new Date().toISOString(),
      admin_context: 'praveen12rangasamy@gmail.com' // Tag with the specific admin identifier
    };

    const existingRequests = JSON.parse(localStorage.getItem('hr_offboarding_requests') || '[]');
    localStorage.setItem('hr_offboarding_requests', JSON.stringify([request, ...existingRequests]));

    const allChecklists = JSON.parse(localStorage.getItem('hr_offboarding_checklists') || '{}');
    const newChecklist = {
      resignation_letter: true,
      lwd_confirmed: false,
      assets_collected: false,
      kt_completed: false,
      no_dues_verified: false,
      no_loans_pending: false
    };
    allChecklists[requestId] = newChecklist;
    localStorage.setItem('hr_offboarding_checklists', JSON.stringify(allChecklists));

    // Notify Admin
    const notifications = JSON.parse(localStorage.getItem('hr_notifications') || '[]');
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      type: 'offboarding',
      title: 'Resignation Request',
      message: `${profile.full_name} (${profile.employeeId || profile.employee_id}) has submitted a resignation request.`,
      time: 'Just now',
      link: '/dashboard/offboarding'
    });
    localStorage.setItem('hr_notifications', JSON.stringify(notifications.slice(0, 10)));

    setResigned(true);
    setChecklist(newChecklist);
    setToast('Resignation request and documents sent for Admin approval! ✓');
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    if (profile) {
      const requests = JSON.parse(localStorage.getItem('hr_offboarding_requests') || '[]');
      const myReq = requests.find((r: any) => r.user_id === profile.id);
      if (myReq) {
        setResigned(true);
        setFormData({ lwd: myReq.lwd, reason: myReq.reason });
        const allChecklists = JSON.parse(localStorage.getItem('hr_offboarding_checklists') || '{}');
        if (allChecklists[myReq.id]) {
          setChecklist(allChecklists[myReq.id]);
        }
      }
    }
  }, [profile]);

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-500 pb-12">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
          <ShieldCheck className="text-brand-teal" size={28} />
          Employee Resignation Portal
        </h2>
        <p className="text-gray-500">Submit your formal notice, required documents, and track your clearance status.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resignation Form */}
        <Card className={`h-fit overflow-hidden border-none shadow-xl shadow-brand-navy/5 ${resigned ? 'opacity-70 grayscale' : ''}`}>
          <div className="h-2 bg-brand-teal w-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send size={20} className="text-brand-teal" /> Submit Resignation Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleResign}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><User size={12}/> Employee Full Name</label>
                  <input type="text" readOnly value={profile?.full_name || 'N/A'} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-brand-navy outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Employee ID</label>
                  <input type="text" readOnly value={profile?.employeeId || profile?.employee_id || 'N/A'} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-brand-navy outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Proposed Last Working Day</label>
                <input 
                  type="date" 
                  disabled={resigned} 
                  value={formData.lwd}
                  onChange={(e) => setFormData({...formData, lwd: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-teal outline-none text-sm" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reason for Resignation</label>
                <textarea 
                  rows={3} 
                  disabled={resigned} 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-teal outline-none text-sm resize-none" 
                  placeholder="Briefly explain your reason for leaving..." 
                  required
                ></textarea>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FileText size={12}/> Resignation Letter</label>
                    <input type="file" disabled={resigned} accept=".pdf" className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12}/> ID Card Scan</label>
                    <input type="file" disabled={resigned} accept="image/*,.pdf" className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-brand-navy/5 file:text-brand-navy hover:file:bg-brand-navy/10" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Award size={12}/> Relieving/Experience Certificates</label>
                  <input type="file" disabled={resigned} accept=".pdf" className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="text-status-amber shrink-0" size={18} />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  By submitting, you confirm authorization of the notice period. The Admin/HR team will review your request and attached documents for clearance.
                </p>
              </div>

              <Button type="submit" className="w-full py-6 text-base font-bold bg-brand-navy hover:bg-black shadow-lg shadow-brand-navy/20" disabled={resigned}>
                {resigned ? 'Resignation Submitted ✓' : 'Submit & Notify Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status Tracker */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle size={20} className="text-status-green" /> Exit Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Resignation Letter', key: 'resignation_letter', type: 'file' },
                { label: 'Last Working Day Confirmation', key: 'lwd_confirmed', type: 'file' },
                { label: 'Asset Return (Laptop, ID Card, etc.)', key: 'assets_collected', type: 'checkbox' },
                { label: 'Knowledge Transfer Document', key: 'kt_completed', type: 'file' },
                { label: 'No Dues Certificate (Finance)', key: 'no_dues_verified', type: 'file' },
                { label: 'No Loans Pending Statement', key: 'no_loans_pending', type: 'file' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all ${checklist[item.key] ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {checklist[item.key] ? <CheckCircle className="text-status-green" size={20} /> : <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />}
                      <span className={`text-sm font-semibold ${checklist[item.key] ? 'text-emerald-700' : 'text-gray-600'}`}>{item.label}</span>
                    </div>
                    <Badge variant={checklist[item.key] ? 'green' : 'neutral'} className="text-[10px] uppercase font-bold tracking-widest">{checklist[item.key] ? 'Submitted' : 'Pending'}</Badge>
                  </div>
                  
                  {item.type === 'file' ? (
                    <div className="relative group">
                      <input 
                        type="file" 
                        disabled={resigned && checklist[item.key]}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const updated = { ...checklist, [item.key]: true };
                            setChecklist(updated);
                            const allChecklists = JSON.parse(localStorage.getItem('hr_offboarding_checklists') || '{}');
                            const myReqId = JSON.parse(localStorage.getItem('hr_offboarding_requests') || '[]').find((r: any) => r.user_id === profile?.id)?.id;
                            if (myReqId) {
                              allChecklists[myReqId] = updated;
                              localStorage.setItem('hr_offboarding_checklists', JSON.stringify(allChecklists));
                            }
                          }
                        }}
                        className="w-full text-[10px] text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20 cursor-pointer" 
                      />
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={checklist[item.key]}
                        disabled={resigned && checklist[item.key]}
                        onChange={(e) => {
                          const updated = { ...checklist, [item.key]: e.target.checked };
                          setChecklist(updated);
                          const allChecklists = JSON.parse(localStorage.getItem('hr_offboarding_checklists') || '{}');
                          const myReqId = JSON.parse(localStorage.getItem('hr_offboarding_requests') || '[]').find((r: any) => r.user_id === profile?.id)?.id;
                          if (myReqId) {
                            allChecklists[myReqId] = updated;
                            localStorage.setItem('hr_offboarding_checklists', JSON.stringify(allChecklists));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                      />
                      <span className="text-xs text-gray-500 group-hover:text-brand-navy transition-colors">I confirm all company assets have been returned</span>
                    </label>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-brand-navy border-none text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-brand-teal">Support & Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                Need help with the offboarding process or have questions about your settlement? Connect with the HR support team directly.
              </p>
              <Button variant="outline" className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white border-2">Contact HR Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Resignation;
