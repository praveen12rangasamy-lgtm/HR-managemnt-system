import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Download, FileText, Calendar, DollarSign, Wallet, TrendingDown, TrendingUp, Search, History, ArrowLeft, Printer, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PayDocs = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [loanImpact, setLoanImpact] = useState({ disbursement: 0, recovery: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // State for Admin Ledger
  const [employees, setEmployees] = useState([
    { id: 'VYR-2026-001', name: 'John Doe', gross: 8500, pf: 425, tax: 850, other: 125, status: 'Paid', lastPaid: '2026-03-01', totalPaid: 102000, paidDate: '2026-03-01' },
    { id: 'VYR-2026-004', name: 'Sarah Miller', gross: 7200, pf: 360, tax: 720, other: 0, status: 'Paid', lastPaid: '2026-03-01', totalPaid: 86400, paidDate: '2026-03-01' },
    { id: 'VYR-2026-012', name: 'Michael Chen', gross: 9500, pf: 475, tax: 950, other: 200, status: 'Pending', lastPaid: '2026-02-01', totalPaid: 95000, paidDate: '-' },
    { id: 'VYR-2026-008', name: 'Emily Brown', gross: 6800, pf: 340, tax: 680, other: 0, status: 'Paid', lastPaid: '2026-03-01', totalPaid: 81600, paidDate: '2026-03-01' },
    { id: 'VYR-2026-015', name: 'David Wilson', gross: 11000, pf: 550, tax: 1100, other: 450, status: 'Paid', lastPaid: '2026-03-01', totalPaid: 132000, paidDate: '2026-03-01' },
  ]);

  useEffect(() => {
    const savedLoans = localStorage.getItem('hr_loan_applications');
    if (savedLoans && profile?.email) {
      const apps = JSON.parse(savedLoans);
      const userApprovedLoans = apps.filter((a: any) => a.email === profile.email && a.status === 'Approved');
      
      let disbursement = 0;
      let recovery = 0;
      
      userApprovedLoans.forEach((loan: any) => {
        const approvedDate = new Date(loan.approved_at);
        const approvedMonth = approvedDate.toLocaleString('default', { month: 'long' });
        const approvedYear = approvedDate.getFullYear().toString();

        if (approvedMonth === selectedMonth && approvedYear === selectedYear) {
          disbursement += loan.amount;
        }

        const loanStartDate = new Date(selectedYear + '-' + selectedMonth + '-01');
        if (approvedDate < loanStartDate) {
          const durationMonths = parseInt(loan.duration);
          const monthlyAmount = loan.amount / durationMonths;
          recovery += monthlyAmount;
        }
      });

      setLoanImpact({ disbursement, recovery });
    }
  }, [profile, selectedMonth, selectedYear]);

  const stats = [
    { label: 'Basic Salary', value: '₹ 85,000.00', icon: Wallet, color: 'text-blue-600' },
    { label: 'Total Additions', value: `₹ ${(12500 + loanImpact.disbursement).toLocaleString()}.00`, icon: TrendingUp, color: 'text-brand-teal' },
    { label: 'Total Deductions', value: `₹ ${(21000 + loanImpact.recovery).toLocaleString()}.00`, icon: TrendingDown, color: 'text-red-500' },
    { label: 'Net Payable', value: `₹ ${(85000 + 12500 + loanImpact.disbursement - 21000 - loanImpact.recovery).toLocaleString()}.00`, icon: DollarSign, color: 'text-brand-navy' },
  ];

  const handleDownload = (empName?: string, month?: string) => {
    const doc = new jsPDF();
    const targetName = empName || profile?.full_name || "Valued Employee";
    const targetMonth = month || selectedMonth;
    const targetYear = selectedYear;
    const netSalary = (85000 + 12500 + loanImpact.disbursement - 21000 - loanImpact.recovery).toLocaleString();

    // PDF Styling
    doc.setFillColor(15, 45, 82); // brand-navy
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('VYARAHM OFFICIAL PAYSLIP', 105, 25, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Employee Name: ${targetName}`, 20, 60);
    doc.text(`Employee ID:   ${profile?.employee_id || 'VYR-1001'}`, 20, 68);
    doc.text(`Period:        ${targetMonth} ${targetYear}`, 20, 76);
    
    doc.setLineWidth(0.5);
    doc.line(20, 85, 190, 85);

    doc.setFont("helvetica", "bold");
    doc.text('EARNINGS', 20, 100);
    doc.text('AMOUNT', 160, 100);
    doc.setFont("helvetica", "normal");
    
    doc.text('Basic Salary', 20, 110);
    doc.text('₹ 85,000.00', 160, 110);
    doc.text('HRA', 20, 118);
    doc.text('₹ 8,000.00', 160, 118);
    doc.text('Performance Bonus', 20, 126);
    doc.text('₹ 4,500.00', 160, 126);
    if (loanImpact.disbursement > 0) {
      doc.text('Loan Disbursement', 20, 134);
      doc.text(`₹ ${loanImpact.disbursement.toLocaleString()}.00`, 160, 134);
    }

    doc.setLineWidth(0.1);
    doc.line(20, 145, 190, 145);
    doc.setFont("helvetica", "bold");
    doc.text('TOTAL ADDITIONS', 20, 155);
    doc.text(`₹ ${(12500 + loanImpact.disbursement).toLocaleString()}.00`, 160, 155);
    
    doc.text('DEDUCTIONS', 20, 175);
    doc.text('AMOUNT', 160, 175);
    doc.setFont("helvetica", "normal");
    
    doc.text('Tax (TDS)', 20, 185);
    doc.text('₹ 12,000.00', 160, 185);
    doc.text('Provident Fund', 20, 193);
    doc.text('₹ 9,000.00', 160, 193);
    if (loanImpact.recovery > 0) {
      doc.text('Loan Recovery', 20, 201);
      doc.text(`₹ ${loanImpact.recovery.toLocaleString()}.00`, 160, 201);
    }

    doc.line(20, 210, 190, 210);
    doc.setFont("helvetica", "bold");
    doc.text('NET PAYABLE', 20, 225);
    doc.setFontSize(16);
    doc.text(`₹ ${netSalary}.00`, 160, 225);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Authorized Signatory: VyaraHR Finance', 105, 260, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 266, { align: 'center' });
    doc.text('Status: DIGITALLY SIGNED', 105, 272, { align: 'center' });

    doc.save(`Payslip_${targetName.replace(/\s+/g, '_')}_${targetMonth}.pdf`);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [manualPay, setManualPay] = useState({ 
    empId: '', 
    gross: '', 
    pf: '', 
    tax: '',
    payDate: new Date().toISOString().split('T')[0],
    status: 'Ready'
  });
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  useEffect(() => {
    // Fetch consolidated employee list (Supabase + Mock)
    const fetchEmps = async () => {
      const mockCreds = JSON.parse(localStorage.getItem('hr_employee_credentials') || '[]');
      const submissions = JSON.parse(localStorage.getItem('hr_employee_submissions') || '{}');
      
      const combined = mockCreds.map((m: any) => ({
        ...m,
        id: m.employeeId,
        name: m.full_name,
        empId: m.employeeId,
        bank: submissions[m.employeeId]?.bankAcc || 'Not Provided',
        ifsc: submissions[m.employeeId]?.ifsc || 'N/A'
      }));
      setAllEmployees(combined);
    };
    fetchEmps();
  }, []);

  const selectedManualEmp = allEmployees.find(e => e.empId === manualPay.empId);
  const calculatedNet = (parseFloat(manualPay.gross || '0') - (parseFloat(manualPay.pf || '0') + parseFloat(manualPay.tax || '0')));

  const handleManualPayment = () => {
    if (!manualPay.empId || !manualPay.gross) {
      alert("Please select an employee and enter gross salary.");
      return;
    }
    
    // Simulate payment logic
    setManualPay({...manualPay, status: 'Processing'});
    setTimeout(() => {
      const net = calculatedNet;
      const newPayment = {
        id: manualPay.empId,
        name: selectedManualEmp?.name || 'Unknown',
        gross: parseFloat(manualPay.gross),
        pf: parseFloat(manualPay.pf || '0'),
        tax: parseFloat(manualPay.tax || '0'),
        other: 0,
        status: 'Paid',
        lastPaid: manualPay.payDate,
        totalPaid: net,
        paidDate: manualPay.payDate
      };

      // Add to ledger
      setEmployees(prev => [newPayment, ...prev]);
      
      // Remove from selectable list for current session
      setAllEmployees(prev => prev.filter(e => e.empId !== manualPay.empId));

      setManualPay({...manualPay, status: 'Completed'});
      alert(`Successfully paid ₹ ${net.toLocaleString()} to ${selectedManualEmp?.name}'s bank account. (${selectedManualEmp?.bank})`);
      setManualPay({ empId: '', gross: '', pf: '', tax: '', payDate: new Date().toISOString().split('T')[0], status: 'Ready' });
    }, 1500);
  };

  if (isAdmin) {
    if (selectedEmployee) {
      return (
        <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
          <div className="flex items-center gap-4 border-b pb-6">
            <Button variant="ghost" className="rounded-xl h-10 w-10 p-0" onClick={() => setSelectedEmployee(null)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-brand-navy">Payroll Profile: {selectedEmployee.name}</h2>
              <p className="text-sm text-gray-500">Historical disbursements and tax records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col items-center p-6 bg-brand-navy rounded-2xl text-white">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold mb-4">
                    {selectedEmployee.name[0]}
                  </div>
                  <h3 className="font-bold text-lg">{selectedEmployee.name}</h3>
                  <Badge variant="blue" className="mt-2 bg-brand-teal/20 text-brand-teal border-none">{selectedEmployee.id}</Badge>
                </div>
                
                <div className="space-y-4 px-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Gross Monthly</span>
                    <span className="font-bold text-brand-navy text-lg">₹ {selectedEmployee.gross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">YTD Total Paid</span>
                    <span className="font-bold text-brand-teal">₹ {selectedEmployee.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-dashed">
                    <span className="text-gray-500 font-medium">Status</span>
                    <Badge variant={selectedEmployee.status === 'Paid' ? 'green' : 'amber'}>{selectedEmployee.status}</Badge>
                  </div>
                </div>
                
                <Button className="w-full gap-2 mt-4" variant="outline" onClick={() => handleDownload(selectedEmployee.name)}>
                  <Printer size={16} /> Print Financial Summary
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <History size={20} className="text-brand-teal" />
                  Disbursement History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {['March 2024', 'February 2024', 'January 2024', 'December 2023'].map((month, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-teal/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center text-brand-navy">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-brand-navy">{month}</p>
                          <p className="text-xs text-brand-teal">E-Payslip Generated</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-10 w-10 p-0 rounded-full hover:bg-brand-teal hover:text-white"
                        onClick={() => handleDownload(selectedEmployee.name, month.split(' ')[0])}
                      >
                        <Download size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-white rounded-2xl shadow-sm border">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">Global Payroll Ledger</h2>
            <p className="text-sm text-gray-500">Review and manage salary disbursements organization-wide.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-teal outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Manual Disbursement Form */}
        <Card className="border-brand-teal/20 bg-brand-teal/5 shadow-inner">
           <CardHeader>
              <CardTitle className="text-lg font-bold text-brand-navy flex items-center gap-2">
                 <DollarSign className="text-brand-teal" size={20} />
                 Manual Salary Disbursement
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Select Employee</label>
                    <select 
                       className="w-full border p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-teal outline-none font-medium"
                       value={manualPay.empId}
                       onChange={(e) => setManualPay({...manualPay, empId: e.target.value})}
                    >
                       <option value="">Choose Employee...</option>
                       {allEmployees.map(emp => (
                          <option key={emp.empId} value={emp.empId}>{emp.name} ({emp.empId})</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Gross Salary (₹)</label>
                    <input 
                       type="number" 
                       className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                       placeholder="e.g. 80000"
                       value={manualPay.gross}
                       onChange={(e) => setManualPay({...manualPay, gross: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">PF Deduction (₹)</label>
                    <input 
                       type="number" 
                       className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                       placeholder="e.g. 4000"
                       value={manualPay.pf}
                       onChange={(e) => setManualPay({...manualPay, pf: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Income Tax (₹)</label>
                    <input 
                       type="number" 
                       className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                       placeholder="e.g. 6000"
                       value={manualPay.tax}
                       onChange={(e) => setManualPay({...manualPay, tax: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Date</label>
                    <input 
                       type="date" 
                       className="w-full border p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-teal outline-none font-medium"
                       value={manualPay.payDate}
                       onChange={(e) => setManualPay({...manualPay, payDate: e.target.value})}
                    />
                 </div>
              </div>

              {selectedManualEmp && (
                 <div className="mt-6 flex flex-col md:flex-row justify-between items-center p-6 bg-white rounded-2xl border border-brand-teal/20 gap-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-4 items-center">
                       <div className="p-3 bg-brand-teal/10 rounded-xl">
                          <Wallet className="text-brand-teal" size={24} />
                       </div>
                       <div>
                          <p className="text-xs text-gray-400 font-bold uppercase">Bank Account Details</p>
                          <p className="font-bold text-brand-navy">{selectedManualEmp.bank}</p>
                          <p className="text-[10px] text-brand-teal font-mono">IFSC: {selectedManualEmp.ifsc}</p>
                       </div>
                    </div>
                    
                    <div className="text-center md:text-right">
                       <p className="text-xs text-gray-400 font-bold uppercase">Net Payable Amount</p>
                       <h3 className="text-3xl font-black text-brand-teal">₹ {calculatedNet.toLocaleString()}.00</h3>
                    </div>

                    <Button 
                       className="w-full md:w-auto px-12 py-6 text-lg font-bold bg-brand-navy hover:bg-black gap-2 shadow-xl"
                       onClick={handleManualPayment}
                       disabled={manualPay.status === 'Processing'}
                    >
                       {manualPay.status === 'Processing' ? (
                          <RefreshCw className="animate-spin" size={20} />
                       ) : <CheckCircle size={20} />}
                       {manualPay.status === 'Processing' ? 'Authorizing...' : 'Disburse Payment Now'}
                    </Button>
                 </div>
              )}
           </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-navy text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-bold">Employee</th>
                    <th className="px-6 py-4 font-bold">Gross Salary</th>
                    <th className="px-6 py-4 font-bold">PF</th>
                    <th className="px-6 py-4 font-bold">Tax</th>
                    <th className="px-6 py-4 font-bold text-center">Net Impact</th>
                    <th className="px-6 py-4 font-bold text-center">Paid Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-brand-teal/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold">
                            {emp.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-brand-navy group-hover:text-brand-teal transition-colors">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">₹ {emp.gross.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-500 font-medium">-₹ {emp.pf}</td>
                      <td className="px-6 py-4 text-red-500 font-medium">-₹ {emp.tax}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-700">
                          ₹ {(emp.gross - emp.pf - emp.tax - (emp.other || 0)).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-500">
                        {emp.paidDate || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={emp.status === 'Paid' ? 'green' : 'amber'} className="font-bold">
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full hover:bg-brand-teal hover:text-white"
                          onClick={(e) => { e.stopPropagation(); handleDownload(emp.name); }}
                        >
                          <Download size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">Finance Hub</h2>
          <p className="text-sm text-gray-500">Manage your payroll, tax documents, and loan repayments.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-xl shadow-sm border">
          <select 
            className="bg-transparent px-4 py-2 outline-none text-sm font-bold text-brand-navy cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="w-px h-6 bg-gray-200 my-auto mx-2" />
          <select 
            className="bg-transparent px-4 py-2 outline-none text-sm font-bold text-brand-navy cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {['2024', '2023'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className={`text-xl font-bold ${stat.color}`}>{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-brand-navy text-white py-6 px-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold uppercase tracking-tight text-white">Payroll Ledger</CardTitle>
                <p className="text-brand-teal text-xs font-medium uppercase mt-1">Salary breakdown for {selectedMonth} {selectedYear}</p>
              </div>
              <Badge variant="blue" className="bg-white/10 text-white border-white/20">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-brand-teal" />
                  <h4 className="font-bold text-brand-navy uppercase text-xs">Earnings & Additions</h4>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Basic Salary', amount: '$8,500.00' },
                    { label: 'House Rent Allowance (HRA)', amount: '$800.00' },
                    { label: 'Performance Bonus', amount: '$450.00' },
                    ...(loanImpact.disbursement > 0 ? [{ label: 'Approved Loan Disbursement', amount: `$${loanImpact.disbursement.toLocaleString()}.00`, highlight: true }] : []),
                  ].map((item, idx) => (
                    <div key={idx} className={`flex justify-between p-4 rounded-xl ${item.highlight ? 'bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-bold' : 'bg-gray-50 text-gray-600 font-medium'} text-sm`}>
                      <span>{item.label}</span>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <h4 className="font-bold text-brand-navy uppercase text-xs">Deductions & Recoveries</h4>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Statutory Tax (TDS)', amount: '$1,200.00' },
                    { label: 'Professional Tax', amount: '$200.00' },
                    { label: 'Provident Fund (PF)', amount: '$700.00' },
                    ...(loanImpact.recovery > 0 ? [{ label: 'Loan Recovery', amount: `$${loanImpact.recovery.toLocaleString()}.00`, color: 'text-red-500 font-bold' }] : []),
                  ].map((item, idx) => (
                    <div key={idx} className={`flex justify-between p-4 rounded-xl bg-gray-50 border border-transparent text-sm ${item.color || 'text-gray-600 font-medium'}`}>
                      <span>{item.label}</span>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-6 border-t border-dashed">
                <Button 
                  onClick={() => handleDownload()}
                  className="w-full py-6 text-base font-bold bg-brand-navy hover:bg-black gap-2 shadow-lg"
                >
                  <Download size={20} /> Download Payslip (PDF)
                </Button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold">Generated securely for {profile?.full_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-brand-navy text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Tax Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Form 16A', 'Tax Declaration', 'Investment Proofs'].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-brand-teal" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                    <Download size={16} className="text-gray-400 group-hover:text-brand-teal transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl">
             <CardHeader className="border-b pb-4">
               <CardTitle className="text-lg font-bold text-brand-navy">Financial Insight</CardTitle>
             </CardHeader>
             <CardContent className="pt-6">
                <div className="bg-brand-teal/5 p-5 rounded-xl border border-brand-teal/10">
                   <p className="text-xs text-brand-teal font-bold uppercase mb-2">Notice:</p>
                   <p className="text-sm text-gray-600 leading-relaxed">
                     Your current tax savings are optimal. Review your Section 80C investments by the end of the quarter.
                   </p>
                   <Button variant="outline" className="mt-4 w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white font-bold rounded-xl text-xs uppercase">Optimize Wealth</Button>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PayDocs;
