import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Send, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Loans = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [toast, setToast] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [formData, setFormData] = useState({ amount: '', duration: '12', reason: '' });

  useEffect(() => {
    const saved = localStorage.getItem('hr_loan_applications');
    if (saved) {
      setApplications(JSON.parse(saved));
    } else {
      const initial = [
        { id: 'L-101', name: 'John Doe', email: 'john@example.com', amount: 5000, duration: '12 Months', reason: 'Medical emergency', status: 'Pending', submitted_at: new Date().toISOString() },
        { id: 'L-102', name: 'Sarah Miller', email: 'sarah@example.com', amount: 2500, duration: '6 Months', reason: 'Home renovation', status: 'Approved', submitted_at: new Date().toISOString() },
      ];
      setApplications(initial);
      localStorage.setItem('hr_loan_applications', JSON.stringify(initial));
    }
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoan = {
      id: `L-${Date.now()}`,
      name: profile?.full_name || 'Unknown Employee',
      email: profile?.email,
      employee_id: profile?.employeeId || profile?.employee_id,
      amount: Number(formData.amount),
      duration: `${formData.duration} Months`,
      reason: formData.reason,
      status: 'Pending',
      submitted_at: new Date().toISOString()
    };

    const updated = [...applications, newLoan];
    setApplications(updated);
    localStorage.setItem('hr_loan_applications', JSON.stringify(updated));
    
    setFormData({ amount: '', duration: '12', reason: '' });
    setToast('Loan Request Submitted!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleApprove = (id: string, name: string, amount: number) => {
    const updated = applications.map(app => {
      if (app.id === id) {
        return { 
          ...app, 
          status: 'Approved', 
          approved_at: new Date().toISOString(),
          disbursement_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        };
      }
      return app;
    });

    setApplications(updated);
    localStorage.setItem('hr_loan_applications', JSON.stringify(updated));
    
    setToast(`Loan of ₹ ${amount} approved for ${name}. Added to current payroll.`);
    setTimeout(() => setToast(''), 4000);
  };

  const employeeLoans = applications.filter(app => app.email === profile?.email);

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right transition-all">
          <CheckCircle className="text-brand-teal" size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-navy font-outfit uppercase tracking-tight">
          {isAdmin ? 'Loan Administration' : 'Loan Management'}
        </h2>
        {!isAdmin && employeeLoans.length > 0 && (
          <Badge variant="blue" className="px-4 py-1.5 shadow-sm">Active Loan Profile</Badge>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-3'} gap-6`}>
        
        {!isAdmin && (
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-l-4 border-l-brand-teal h-fit shadow-lg shadow-brand-navy/5">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-brand-navy">Request a New Loan</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleApply}>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase tracking-widest mb-2.5">Loan Amount (₹)</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-sm transition-all bg-gray-50/30" 
                      placeholder="e.g. 50000" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase tracking-widest mb-2.5">Repayment Period</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-sm transition-all bg-white" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                    >
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (Standard)</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase tracking-widest mb-2.5">Reason for Loan</label>
                    <textarea 
                      rows={4} 
                      className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none text-sm transition-all bg-gray-50/30" 
                      placeholder="Please specify why you need this advance..."
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      required
                    ></textarea>
                  </div>

                  <div className="pt-2">
                     <div className="text-[11px] text-gray-500 mb-5 bg-teal-50/50 p-4 rounded-xl border border-teal-100 border-dashed leading-relaxed">
                       <p className="font-bold text-brand-teal uppercase mb-1">Company Policy:</p>
                       By applying, you agree that the monthly recovery amount will be deducted directly from your payroll until the loan is fully recovered.
                     </div>
                     <Button type="submit" className="w-full py-7 text-base font-bold bg-brand-navy hover:bg-black gap-2 transition-all hover:translate-y-[-2px] hover:shadow-xl shadow-brand-navy/20">
                       <Send size={18} /> Submit Application
                     </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {!isAdmin && (
          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl shadow-brand-navy/5 h-full">
              <CardHeader className="border-b pb-6">
                <CardTitle className="text-xl font-bold text-brand-navy">My Loan Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {employeeLoans.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 italic bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <Clock size={32} />
                      </div>
                      <p>You haven't applied for any loans yet.</p>
                      <p className="text-xs mt-1 not-italic text-gray-400">Apply using the form on the left to get started.</p>
                    </div>
                  ) : (
                    employeeLoans.map((loan) => (
                      <div key={loan.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-brand-teal/30 hover:shadow-lg transition-all group relative overflow-hidden">
                        {loan.status === 'Approved' && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-full -mr-12 -mt-12 group-hover:bg-brand-teal/10 transition-colors" />
                        )}
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-navy/10">
                              ₹
                            </div>
                            <div>
                               <h4 className="font-bold text-brand-navy text-2xl tracking-tight">₹ {loan.amount.toLocaleString()}</h4>
                              <p className="text-sm text-brand-teal font-medium">{loan.duration} Repayment Plan</p>
                            </div>
                          </div>
                          <Badge variant={loan.status === 'Approved' ? 'green' : loan.status === 'Rejected' ? 'red' : 'amber'} className="py-1.5 px-4 font-bold text-xs uppercase tracking-wider">
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="bg-gray-50/80 p-4 rounded-2xl mb-4 border border-gray-100">
                          <p className="text-[10px] text-brand-navy font-bold uppercase tracking-widest mb-2 opacity-50">Statement of Purpose</p>
                          <p className="text-sm text-gray-700 leading-relaxed italic">"{loan.reason}"</p>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> Ref ID: {loan.id}</span>
                          <span className="bg-gray-100 px-3 py-1 rounded-full">{new Date(loan.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <div className="lg:col-span-3">
             <Card className="border-none shadow-2xl shadow-brand-navy/5 overflow-hidden rounded-3xl">
                <CardHeader className="bg-brand-navy text-white pb-8 pt-10 px-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-bold font-outfit tracking-tight text-white">Loan Inbound Ledger</h3>
                      <p className="text-brand-teal font-medium mt-1 text-sm tracking-wide">Strategic Payroll and Disbursement Management</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="blue" className="bg-brand-teal/20 text-brand-teal border-brand-teal/30 px-4 py-1.5 font-bold uppercase tracking-tighter">Centralized Finance</Badge>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-brand-navy font-black text-[11px] uppercase border-b border-gray-100 tracking-[0.2em]">
                        <tr>
                          <th className="px-8 py-6">Employee Profile</th>
                          <th className="px-8 py-6 text-center">Capital Advance</th>
                          <th className="px-8 py-6 text-center">Tenure</th>
                          <th className="px-8 py-6 text-center">Status</th>
                          <th className="px-8 py-6 text-right">Execution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {applications.length === 0 ? (
                          <tr><td colSpan={5} className="py-24 text-center text-gray-300 italic text-lg px-8">No active loan applications in the pipeline.</td></tr>
                        ) : (
                          applications.map((app) => (
                            <tr key={app.id} className="hover:bg-brand-teal/[0.03] transition-all group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-brand-navy text-white flex items-center justify-center text-xl font-bold shadow-xl shadow-brand-navy/10 group-hover:rotate-6 transition-all duration-300">
                                    {app.name[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-brand-navy text-base tracking-tight">{app.name}</p>
                                    <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">{app.employee_id || 'VYR-LEGACY'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className="font-bold text-xl text-brand-navy tracking-tighter">₹ {app.amount.toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-6 text-center font-medium text-gray-500">{app.duration}</td>
                              <td className="px-8 py-6 text-center">
                                <Badge variant={app.status === 'Approved' ? 'green' : 'amber'} className="py-2 px-5 text-[10px] font-black uppercase tracking-[0.1em] rounded-full">
                                  {app.status}
                                </Badge>
                              </td>
                              <td className="px-8 py-6 text-right">
                                {app.status === 'Pending' ? (
                                  <div className="flex gap-2 justify-end">
                                    <Button 
                                      size="sm" 
                                      className="bg-brand-teal hover:bg-black gap-2 shadow-lg shadow-brand-teal/20 px-6 py-5 rounded-xl font-bold transition-all hover:scale-105"
                                      onClick={() => handleApprove(app.id, app.name, app.amount)}
                                    >
                                      <CheckCircle size={18} /> Process Grant
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-extrabold text-brand-teal uppercase mb-1 tracking-widest">Disbursed On</span>
                                    <span className="text-sm font-bold text-brand-navy">{new Date(app.approved_at || app.submitted_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
             </Card>

          </div>
        )}
      </div>
    </div>
  );
};


export default Loans;
