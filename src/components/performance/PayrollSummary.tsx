import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { IndianRupee, Eye, EyeOff, FileDown, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PayrollSummary = () => {
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(false);
  const [metrics, setMetrics] = useState({
    totalExpense: 0,
    deductions: 0,
    bonus: 0
  });
  const [deptPayroll, setDeptPayroll] = useState<any[]>([]);
  const [detailedPayroll, setDetailedPayroll] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      // Fetch profiles with salaries
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, department, salary');

      if (error) throw error;

      if (profiles) {
        // Calculate Totals
        const total = profiles.reduce((sum, p) => sum + (Number(p.salary) || 0), 0);
        const estDeductions = total * 0.12; // E.g., 12% PF/Tax estimate
        const estBonus = total * 0.05; // E.g., 5% avg bonus

        setMetrics({
          totalExpense: total,
          deductions: estDeductions,
          bonus: estBonus
        });

        // Dept Breakdown
        const depts: Record<string, number> = {};
        profiles.forEach(p => {
          const d = p.department || 'Unassigned';
          depts[d] = (depts[d] || 0) + (Number(p.salary) || 0);
        });
        setDeptPayroll(Object.entries(depts).map(([name, cost]) => ({ name, cost })));

        // Detailed Breakdown
        setDetailedPayroll(
          profiles
            .filter(p => Number(p.salary) > 0)
            .map(p => ({
              name: p.full_name,
              dept: p.department,
              gross: Number(p.salary),
              deductions: Number(p.salary) * 0.1,
              bonus: Number(p.salary) * 0.05,
              net: Number(p.salary) * 0.95
            }))
            .slice(0, 10)
        );

        // Trend Mock (Static historical for context)
        setMonthlyTrend([
          { month: 'Apr', gross: total * 0.92, net: (total * 0.92) * 0.9 },
          { month: 'May', gross: total * 0.95, net: (total * 0.95) * 0.9 },
          { month: 'Current', gross: total, net: total - estDeductions }
        ]);
      }
    } catch (err) {
      console.error('Error fetching payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (!showAmounts) return '₹ •••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const logAction = (action: string) => {
    // Current Audit Logic (LocalStorage fallback, real system would use a DB table)
    const logs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
    logs.push({
      action,
      timestamp: new Date().toISOString(),
      adminId: 'ADMIN-PROVEEN',
    });
    localStorage.setItem('admin_audit_logs', JSON.stringify(logs.slice(-100)));
  };

  const toggleShowAmounts = () => {
    const newState = !showAmounts;
    setShowAmounts(newState);
    if (newState) logAction('VIEWED_SENSITIVE_PAYROLL_DATA');
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-teal" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-brand-navy/30 p-5 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${showAmounts ? 'bg-brand-teal text-navy' : 'bg-white/5 text-gray-500'} transition-all shadow-lg`}>
             <IndicatorIcon size={20} active={showAmounts}/>
          </div>
          <div>
            <h4 className="text-white font-bold tracking-tight">Financial Confidentiality Mode</h4>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{showAmounts ? 'Unmasked Access Active' : 'Level 1 Data Masking Active'}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={toggleShowAmounts}
            className={`rounded-xl border-none font-bold text-xs uppercase tracking-widest px-6 h-11 transition-all ${showAmounts ? 'bg-brand-teal text-navy hover:bg-brand-teal/80' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            {showAmounts ? <EyeOff size={14} className="mr-2"/> : <Eye size={14} className="mr-2" />}
            {showAmounts ? 'Mask Salaries' : 'Reveal Data'}
          </Button>
          <Button className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl font-bold text-xs uppercase tracking-widest px-6 h-11" onClick={() => logAction('EXPORTED_PAYROLL_REPORT')}>
            <FileDown size={14} className="mr-2" /> Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-brand-teal bg-brand-card shadow-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gross Monthly Liability</p>
              <h3 className="text-2xl font-black mt-2 text-white">{formatAmount(metrics.totalExpense)}</h3>
            </div>
            <div className="p-4 bg-brand-teal/10 rounded-2xl text-brand-teal">
              <IndianRupee size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-amber bg-brand-card shadow-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Statutory Deductions (Est.)</p>
              <h3 className="text-2xl font-black mt-2 text-white">{formatAmount(metrics.deductions)}</h3>
            </div>
            <div className="p-4 bg-status-amber/10 rounded-2xl text-status-amber">
              <AlertTriangle size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-status-green bg-brand-card shadow-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Net Payable Disbursement</p>
              <h3 className="text-2xl font-black mt-2 text-white">{formatAmount(metrics.totalExpense - metrics.deductions + metrics.bonus)}</h3>
            </div>
            <div className="p-4 bg-status-green/10 rounded-2xl text-status-green">
              <IndianRupee size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-brand-card border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Historical Compensation Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#BAA290" fontSize={11} />
                <YAxis stroke="#BAA290" fontSize={11} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#131F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                   formatter={(val: any) => showAmounts ? `₹${Number(val).toLocaleString()}` : '₹ •••••••'}
                />
                <Legend iconType="circle" />
                <Bar dataKey="gross" fill="#00C2B2" name="Gross Allocation" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" fill="#00C48C/40" name="Post-Deduction Net" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-brand-card border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Department Cost Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPayroll} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#BAA290" fontSize={10} hide />
                <YAxis type="category" dataKey="name" stroke="#BAA290" fontSize={11} width={100} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#131F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                   formatter={(val: any) => showAmounts ? `₹${Number(val).toLocaleString()}` : '₹ •••••••'}
                />
                <Bar dataKey="cost" fill="#00C2B2" radius={[0, 4, 4, 0]} name="Total Salary Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-brand-card border-white/5 overflow-hidden">
        <CardHeader className="bg-white/5 p-6">
          <CardTitle className="text-white text-lg font-bold">Salary Ledger (Individual Breakdown)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-gray-500 uppercase bg-black/20 font-black tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5">Talent Name</th>
                    <th className="px-8 py-5">Sub-Org / Dept</th>
                    <th className="px-8 py-5">Base Salary (CTC)</th>
                    <th className="px-8 py-5">Standard Deductions</th>
                    <th className="px-8 py-5 text-right">Settlement Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {detailedPayroll.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-bold text-white group-hover:text-brand-teal transition-colors uppercase">{row.name}</td>
                      <td className="px-8 py-5 text-gray-500 font-medium">{row.dept}</td>
                      <td className="px-8 py-5 font-mono">{formatAmount(row.gross)}</td>
                      <td className="px-8 py-5 text-status-amber font-mono">{formatAmount(row.deductions)}</td>
                      <td className="px-8 py-5 text-right text-brand-teal font-black text-sm">{formatAmount(row.net)}</td>
                    </tr>
                  ))}
                  {detailedPayroll.length === 0 && (
                     <tr><td colSpan={5} className="py-12 text-center text-gray-500 italic">No salary records found for active employees.</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IndicatorIcon = ({ size, active }: { size: number; active: boolean }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: active ? '#00dfc0' : '#4b5563',
      borderRadius: '50%',
      boxShadow: active ? '0 0 10px #00dfc0' : 'none',
    }}
  />
);

export default PayrollSummary;
