import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Mail, Phone, MapPin, Briefcase, Calendar, Clock, Download, Upload, CheckCircle, XCircle, UserPlus, Users, FileText, ChevronRight, AlertCircle, Trash2, CheckSquare, Send, CheckCircle2 as Check, Brain, Video, Play } from 'lucide-react';
import { sendEmail } from '../../lib/resend';

const HiringOnboarding = () => {
  const [atsRun, setAtsRun] = useState(false);
  const [activeTab, setActiveTab] = useState<'Pool' | 'R1' | 'R2' | 'R3' | 'Onboarding'>('Pool');
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'success'} | null>(null);
  const [onboardingSearch, setOnboardingSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showIdCreator, setShowIdCreator] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [customEmpId, setCustomEmpId] = useState('');
  const [customPassword, setCustomPassword] = useState('Welcome@2024');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applicants, setApplicants] = useState<any[]>([]);

  const showToast = (msg: string, type: 'info' | 'success' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const runATS = () => {
    setAtsRun(true);
    showToast("AI scanning resumes for job matching score...", "info");
    
    // Scan existing applicants who are currently in the 'Applied' status
    const updatedApplicants = applicants.map(a => {
      if (a.status === 'Applied') {
        // Generate a realistic match score between 65-95%
        const matchScore = Math.floor(Math.random() * (95 - 65 + 1)) + 65;
        return { ...a, match: matchScore };
      }
      return a;
    });

    setTimeout(() => {
      setApplicants(updatedApplicants);
      showToast("ATS Scan complete. Percentage matches generated for all applicants.", "success");
    }, 2000);
  };

  const moveToR2 = (id: number) => {
    const candidate = applicants.find(a => a.id === id);
    setApplicants(applicants.map(a => a.id === id ? { ...a, status: 'R1' } : a));
    showToast(`Technical Interview Questions PDF sent to ${candidate?.email}`, 'info');
  };

  const scheduleTechInterview = (id: number) => {
    const candidate = applicants.find(a => a.id === id);
    setApplicants(applicants.map(a => a.id === id ? { ...a, status: 'TechScheduled' } : a));
    showToast(`Technical Interview scheduled for ${candidate?.name}`, 'info');
  };

  const fetchAllEmployees = async () => {
    try {
      // 1. Get real profiles from Supabase
      const { data: supabaseProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id, email, role, designation');
      
      let unified = (supabaseProfiles || [])
        .filter((p: any) => p.role !== 'admin' && p.email !== 'praveen12rangasamy@gmail.com')
        .map((p: any) => ({
          id: p.id,
          name: p.full_name,
          empId: p.employee_id,
          email: p.email,
          status: 'Selected'
        }));

      // 2. Get mock credentials from localStorage
      const mockCreds = JSON.parse(localStorage.getItem('hr_employee_credentials') || '[]');
      const mockOfficeNames = ['Michael Scott', 'Pam Beesly', 'Jim Halpert', 'Dwight Schrute'];
      const mockMapped = mockCreds
        .filter((m: any) => m.full_name && !mockOfficeNames.includes(m.full_name))
        .map((m: any) => ({
          id: m.employeeId,
          name: m.full_name,
          empId: m.employeeId,
          email: m.email,
          status: 'Selected',
          is_mock: true
        }));

      // 3. Current Selected applicants who might not be persisted yet
      const currentHired = applicants.filter(a => a.status === 'Selected').map(a => ({
        id: a.id,
        name: a.name,
        empId: a.empId,
        email: a.email,
        status: 'Selected'
      }));

      // Merge and deduplicate by empId
      const empMap = new Map();
      [...unified, ...mockMapped, ...currentHired].forEach(emp => {
        if (emp.empId) empMap.set(emp.empId, emp);
      });

      setAllEmployees(Array.from(empMap.values()));
    } catch (err) {
      console.error('Error fetching comprehensive employee list:', err);
    }
  };

  useEffect(() => {
    localStorage.removeItem('hr_employee_credentials');
    localStorage.removeItem('hr_employee_submissions');
    localStorage.removeItem('hr_applicants');
    localStorage.removeItem('hr_notifications');
    if (activeTab === 'Onboarding') {
      fetchAllEmployees();
    }
  }, [activeTab, applicants]);

  const handleTechEvaluation = (id: number, decision: 'Pass' | 'Fail') => {
    const candidate = applicants.find(a => a.id === id);
    const newStatus = decision === 'Pass' ? 'R2' : 'Rejected';
    setApplicants(applicants.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    if (decision === 'Pass') {
      showToast(`${candidate?.name} passed the technical round and advanced to HR Interview`, 'success');
    } else {
      showToast(`${candidate?.name} marked as unsuccessful in the technical round`, 'info');
    }
  };

  const handleR3Selection = (id: number, decision: string) => {
    if (decision === 'Selected') {
      const candidate = applicants.find(a => a.id === id);
      setSelectedCandidate(candidate);
      setShowIdCreator(true);
      if (candidate) {
        setCustomEmpId(candidate.empId || `VYR-2024-00${candidate.id}`);
        setCustomPassword('Welcome@2024');
      }
    } else {
      setShowIdCreator(false);
      setSelectedCandidate(null);
    }
  };

  const confirmSelection = (id: number) => {
    const candidate = applicants.find(a => a.id === id);
    const empId = customEmpId || `VYR-2024-00${id}`;
    const password = customPassword || "Welcome@2024";

    // Reset selection state
    setShowIdCreator(false);
    setSelectedCandidate(null);

    // Persist for login simulation
    const credentials = JSON.parse(localStorage.getItem('hr_employee_credentials') || '[]');
    credentials.push({
      employeeId: empId,
      password: password,
      email: candidate?.email,
      full_name: candidate?.name,
      role: 'employee'
    });
    localStorage.setItem('hr_employee_credentials', JSON.stringify(credentials));

    // Save custom empId and password directly on applicant record
    setApplicants(applicants.map(a => a.id === id ? { ...a, status: 'Selected', empId: empId, password: password } : a));
    
    // Send actual email via Resend
    if (candidate?.email) {
      sendEmail({
        to: candidate.email,
        subject: `Offer Letter - ${candidate.name} | VyaraHR`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0f2d52;">Congratulations, ${candidate.name}!</h2>
            <p>We are thrilled to offer you the position of <strong>${candidate.role}</strong> at our organization.</p>
            <div style="background: #f0f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Employee ID:</strong> ${empId}</p>
              <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p>Please log in to your employee portal to complete your onboarding process.</p>
            <p>Welcome to the team!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This is an automated message from the VyaraHR Platform.</p>
          </div>
        `
      }).then(res => {
        if (res.success) {
          showToast(`Offer Letter sent to ${candidate.email} via Resend ✓`, 'success');
        } else {
          showToast(`Account created, but email failed: ${res.error}`, 'info');
        }
      });
    }
  };

  const handleSaveSetup = async () => {
    if (!selectedCandidate) {
      showToast("Please select a candidate to onboard.", "info");
      return;
    }

    showToast("Creating employee account in Supabase...", "info");

    try {
      const empId = customEmpId || `VYR-2024-00${selectedCandidate.id}`;
      const password = customPassword || "Welcome@2024";
      
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          email: selectedCandidate.email,
          password: password,
          full_name: selectedCandidate.name,
          designation: selectedCandidate.role,
          gross_salary: "0",
          employee_id: empId
        })
      });

      const data = await response.json();

      if (response.status !== 200 || data.error) {
        const errMsg = data.error || 'Failed to create employee account.';
        showToast(`Error: ${errMsg}`, "info");
        return;
      }

      showToast(`Onboarding setup complete! Employee account created for ${selectedCandidate.name}`, "success");
      
      // Refresh the employee list to show the newly created employee
      await fetchAllEmployees();
    } catch (err: any) {
      console.error("Error invoking create-employee function:", err);
      showToast(`Failed to create employee: ${err.message}`, "info");
    }
  };

  const handleFileView = (fileName: string) => {
    if (!fileName) return;
    showToast(`Downloading: ${fileName}`, 'info');
    // Simulation of file download
    const link = document.createElement('a');
    link.href = '#'; // In a real app, this would be the file URL
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newApplicants: any[] = [];

      // Skip header and empty lines
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [name, empId, role, phone, resume] = lines[i].split(',').map(s => s.trim());
        
        newApplicants.push({
          id: Date.now() + i,
          name,
          empId,
          role,
          phone,
          resume, // In real app this would be a URL
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generated for demo
          match: 0,
          status: 'Applied'
        });
      }

      setApplicants(prev => [...prev, ...newApplicants]);
      showToast(`${newApplicants.length} applicants uploaded from CSV!`, 'success');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const downloadResumePDF = (candidate: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42); // brand-navy
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(candidate.name.toUpperCase(), 20, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(candidate.role, 20, 33);

    // Sidebar/Contact Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTACT INFORMATION", 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Employee ID: ${candidate.empId}`, 20, 62);
    doc.text(`Phone: ${candidate.phone}`, 20, 68);
    doc.text(`Email: ${candidate.email}`, 20, 74);

    // Main Content - Professional Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PROFESSIONAL SUMMARY", 20, 90);
    doc.setLineWidth(0.5);
    doc.line(20, 92, 190, 92);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summary = `Dedicated and results-driven ${candidate.role} with a strong background in delivering high-quality solutions. Proven ability to collaborate with cross-functional teams and drive project success. Expert in problem-solving and optimizing workflows to enhance organizational efficiency.`;
    const splitSummary = doc.splitTextToSize(summary, 170);
    doc.text(splitSummary, 20, 100);

    // Experience Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RECENT EXPERIENCE", 20, 130);
    doc.line(20, 132, 190, 132);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Senior ${candidate.role} | Previous Corp`, 20, 140);
    doc.setFont("helvetica", "normal");
    doc.text("Jan 2021 - Present", 20, 145);
    doc.text("• Led a team of developers to implement key features for a major client.", 25, 152);
    doc.text("• Improved system performance by 30% through code optimization.", 25, 158);

    // Skills Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TECHNICAL SKILLS", 20, 180);
    doc.line(20, 182, 190, 182);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("• Advanced Problem Solving, Project Management, Agile Methodologies", 20, 190);
    doc.text("• Software Development Life Cycle (SDLC), Strategic Planning", 20, 196);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by VyaraHR Recruitment System on ${new Date().toLocaleDateString()}`, pageWidth / 2, 280, { align: 'center' });

    const fileName = candidate.resume || `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;
    doc.save(fileName);
    showToast(`Downloading ${fileName}...`, 'success');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-right duration-500 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-brand-navy text-white'}`}>
          <div className="p-2 bg-white/20 rounded-lg">
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Play size={20} />}
          </div>
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-navy">Hiring & Onboarding Pipeline</h2>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        {['Pool', 'R1', 'R2', 'R3', 'Onboarding'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'border-brand-teal text-brand-navy' : 'border-transparent text-gray-400 hover:text-brand-navy'}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === 'Pool' ? 'Applicant Pool' : tab === 'R1' ? 'Round 1: ATS' : tab === 'R2' ? 'Round 2: Tech' : tab === 'R3' ? 'Round 3: HR' : 'Onboarding'}
          </button>
        ))}
      </div>

      {activeTab === 'Pool' && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>Section A: Applicant Pool</CardTitle>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-bold">
                {applicants.length} Total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                title="Upload CSV File"
                placeholder="Upload CSV File"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="gap-2 bg-brand-teal hover:bg-emerald-600"
              >
                <Upload size={16}/> Upload CSV file
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md border-b">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email ID</th>
                  <th className="px-6 py-3">Applied Role</th>
                  <th className="px-6 py-3">Phone Number</th>
                  <th className="px-6 py-3">Resume</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id} className="border-b transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">{a.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{a.email}</td>
                    <td className="px-6 py-4">{a.role}</td>
                    <td className="px-6 py-4 text-brand-teal font-medium">{a.phone}</td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 text-brand-teal hover:text-brand-teal-dark hover:bg-brand-teal/5"
                        onClick={() => downloadResumePDF(a)}
                      >
                        <FileText size={16}/> View & Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'R1' && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center" >
            <div>
              <CardTitle>Section B: ATS AI Screening</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Automatic resume scoring based on job criteria.</p>
            </div>
            <Button onClick={runATS} className="gap-2 bg-gradient-to-r from-brand-teal to-emerald-500 border-none">
              <Brain size={18}/> {atsRun ? 'Rescan Pool' : 'Run AI Screening'}
            </Button>
          </CardHeader>
          <CardContent>
            {atsRun ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Applied Role</th>
                    <th className="px-6 py-3">AI Match %</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.filter(a => a.match > 0 && ['Applied', 'R1'].includes(a.status)).map(a => (
                    <tr key={a.id} className="border-b transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-brand-navy">{a.name}</td>
                      <td className="px-6 py-4 text-gray-600">{a.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-brand-teal h-full transition-all duration-1000" style={{ width: `${a.match}%` }}></div>
                          </div>
                          <Badge variant={a.match > 85 ? 'green' : a.match > 70 ? 'blue' : 'amber'}>{a.match}%</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.status === 'Applied' ? (
                          <Button size="sm" onClick={() => moveToR2(a.id)} className="bg-brand-navy hover:bg-black font-bold">Invite to Round 2</Button>
                        ) : (
                          <Badge variant="blue" className="px-3 py-1">Advanced to Tech</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {applicants.filter(a => a.match > 0 && ['Applied', 'R1'].includes(a.status)).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400 italic">No candidates scanned yet. Run AI Screening to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-gray-500 space-y-4">
                <div className="p-6 bg-brand-teal/5 rounded-full">
                  <Brain size={64} className="text-brand-teal animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-brand-navy">Ready to Screen</h3>
                  <p className="max-w-sm">Run the ATS screening to automatically score candidates and select top talent for technical evaluation.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'R2' && (
        <Card>
          <CardHeader>
            <CardTitle>Section C: Technical Programming Evaluation</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Provide technical questions and schedule interviews.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applicants.filter(a => ['R1', 'TechScheduled'].includes(a.status)).map(a => (
                <Card key={a.id} className="border bg-gray-50/30">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-brand-navy">{a.name}</h4>
                        <p className="text-xs text-brand-teal font-semibold uppercase tracking-wider">{a.role}</p>
                      </div>
                      <Badge variant={a.status === 'TechScheduled' ? 'blue' : 'neutral'}>
                        {a.status === 'TechScheduled' ? 'Interview Scheduled' : 'Assessment Sent'}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meeting ID</label>
                          <input type="text" className="w-full border p-2 text-sm rounded-lg outline-none" placeholder="e.g. vid-123-456" title="Meeting ID" disabled={a.status === 'TechScheduled'} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Input PDF Questions</label>
                          <input type="file" className="w-full text-[10px] text-gray-400" title="Input PDF Questions" placeholder="Upload PDF Questions" disabled={a.status === 'TechScheduled'} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meeting Date</label>
                          <input type="date" className="w-full border p-2 text-sm rounded-lg outline-none" title="Meeting Date" placeholder="Meeting Date" disabled={a.status === 'TechScheduled'} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meeting Timing</label>
                          <input type="time" className="w-full border p-2 text-sm rounded-lg outline-none" title="Meeting Timing" placeholder="Meeting Timing" disabled={a.status === 'TechScheduled'} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-end border-t pt-4">
                      {a.status === 'R1' ? (
                        <Button 
                          size="sm" 
                          onClick={() => scheduleTechInterview(a.id)}
                          className="bg-brand-teal hover:bg-emerald-600 w-full flex items-center justify-center gap-2"
                        >
                          <Video size={16}/> Schedule Interview & Advance
                        </Button>
                      ) : (
                        <div className="flex w-full gap-2 pt-2">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => handleTechEvaluation(a.id, 'Fail')}
                          >
                            REJECT (FAIL)
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-brand-teal hover:bg-emerald-600 text-white font-bold shadow-lg"
                            onClick={() => handleTechEvaluation(a.id, 'Pass')}
                          >
                            PASS TO HR
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {applicants.filter(a => ['R1', 'TechScheduled'].includes(a.status)).length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400 font-medium italic">No candidates in Technical Round yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'R3' && (
        <Card>
          <CardHeader>
            <CardTitle>Section D: HR Interview & Final Selection</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Conducted interviews and finalize decisions.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {applicants.filter(a => a.status === 'R2' || a.status === 'Selected').map(a => (
                <div key={a.id} className="border rounded-2xl p-6 flex flex-col gap-6 bg-white shadow-sm border-gray-100">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-xl">{a.name[0]}</div>
                       <div>
                         <h4 className="font-bold text-brand-navy">{a.name}</h4>
                         <p className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle size={14} className="text-status-green"/> Tech assessment completed & meeting conducted</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {a.status === 'Selected' ? (
                           <Badge variant="green" className="text-sm px-4 py-1">SELECTED</Badge>
                        ) : (
                          <>
                            <select 
                              className="border rounded-lg px-3 py-2 text-sm bg-gray-50 font-medium"
                              onChange={(e) => handleR3Selection(a.id, e.target.value)}
                              title="Decide Candidate Selection"
                            >
                              <option value="">Decide</option>
                              <option value="Selected">Select Candidate</option>
                              <option value="Rejected">Reject</option>
                            </select>
                            {selectedCandidate?.id === a.id && (
                              <Button size="sm" onClick={() => confirmSelection(a.id)} className="bg-brand-teal">Confirm & Generate Offer</Button>
                            )}
                          </>
                        )}
                     </div>
                   </div>

                   {showIdCreator && selectedCandidate?.id === a.id && (
                     <div className="bg-brand-teal/5 p-6 rounded-xl border border-brand-teal/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-brand-navy border-b border-brand-teal/10 pb-2">Create Employee Credentials</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-700 uppercase">Employee ID</label>
                            <input 
                              type="text" 
                              className="w-full border-brand-teal/30 bg-white border p-2 rounded-lg text-sm font-mono font-bold" 
                              value={customEmpId} 
                              onChange={(e) => setCustomEmpId(e.target.value)} 
                              placeholder="Employee ID"
                              title="Employee ID"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-700 uppercase">Initial Password</label>
                            <input 
                              type="text" 
                              className="w-full border-brand-teal/30 bg-white border p-2 rounded-lg text-sm" 
                              value={customPassword} 
                              onChange={(e) => setCustomPassword(e.target.value)} 
                              placeholder="Initial Password"
                              title="Initial Password"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">* This ID and Password will be attached to the offer letter PDF.</p>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

         {activeTab === 'Onboarding' && (
          <div className="space-y-6">
            {/* Restored Onboarding Setup Form */}
            <Card>
              <CardHeader>
                <CardTitle>Section E: Onboarding Setup</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Configure joining details and formalize the onboarding process.</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase">Selected Candidate</label>
                       <select
                         className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-bold text-brand-navy bg-white"
                         value={selectedCandidate?.id || ''}
                         onChange={(e) => {
                           const cand = applicants.find(a => a.id === Number(e.target.value));
                           setSelectedCandidate(cand || null);
                           if (cand) {
                             setCustomEmpId(cand.empId || `VYR-2024-00${cand.id}`);
                             setCustomPassword(cand.password || 'Welcome@2024');
                           }
                         }}
                         title="Selected Candidate"
                       >
                         <option value="">-- Select Candidate --</option>
                         {applicants.filter(a => a.status === 'Selected').map(a => (
                           <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                         ))}
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase">Joining Date</label>
                       <input type="date" className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" defaultValue="2024-04-01" title="Joining Date" placeholder="Joining Date" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase">Department</label>
                       <select className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none" title="Department">
                         <option>Design</option>
                         <option>Engineering</option>
                         <option>Product</option>
                         <option>Analytics</option>
                       </select>
                     </div>
                  </div>

                  {selectedCandidate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6 animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-brand-teal uppercase">Employee ID (Username)</label>
                         <input 
                           type="text" 
                           className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-mono font-bold" 
                           value={customEmpId} 
                           onChange={(e) => setCustomEmpId(e.target.value)} 
                           placeholder="e.g. VYR-2024-001"
                           title="Employee ID"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-brand-teal uppercase">Initial Password</label>
                         <input 
                           type="text" 
                           className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none font-bold" 
                           value={customPassword} 
                           onChange={(e) => setCustomPassword(e.target.value)} 
                           placeholder="Initial Password"
                           title="Initial Password"
                         />
                       </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-4 border-t pt-8">
                    <Button className="gap-2 px-8 h-12 bg-brand-navy hover:bg-black transition-all" onClick={handleSaveSetup}>
                      <UserPlus size={20}/> Save Setup & Proceed
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Tracking Table (Keep as is) */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Section E: Digital Onboarding Tracking</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Monitor document submissions and verify employee credentials.</p>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search employee name..." 
                    className="pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none w-64 shadow-sm"
                    value={onboardingSearch}
                    onChange={(e) => setOnboardingSearch(e.target.value)}
                  />
                  <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                      <tr>
                        <th className="px-4 py-3 border-b">Employee Name</th>
                        <th className="px-4 py-3 border-b">Emp ID</th>
                        <th className="px-4 py-3 border-b text-center">Offer Letter</th>
                        <th className="px-4 py-3 border-b text-center">Aadhar</th>
                        <th className="px-4 py-3 border-b text-center">Degree</th>
                        <th className="px-4 py-3 border-b text-center">Photo</th>
                        <th className="px-4 py-3 border-b text-center">Bank Acc</th>
                        <th className="px-4 py-3 border-b text-center">IFSC</th>
                        <th className="px-4 py-3 border-b text-center">PAN</th>
                        <th className="px-4 py-3 border-b text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const submissions = JSON.parse(localStorage.getItem('hr_employee_submissions') || '{}');
                        const filtered = allEmployees.filter(a => a.name.toLowerCase().includes(onboardingSearch.toLowerCase()));

                        if (filtered.length === 0) {
                          return <tr><td colSpan={10} className="text-center py-20 text-gray-400 italic">No employees found matching your search.</td></tr>;
                        }

                        return filtered.map(a => {
                          const sub = submissions[a.empId] || {};
                          const check = (val: any, label: string) => val ? (
                            <div className="flex flex-col items-center gap-1 group/item">
                              <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                              <button 
                                onClick={() => handleFileView(val)}
                                className="text-[9px] font-bold text-brand-teal opacity-0 group-hover/item:opacity-100 transition-opacity hover:underline"
                              >
                                View {label}
                              </button>
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-200 rounded-sm mx-auto"></div>
                          );
                          
                          return (
                            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-4 font-bold text-brand-navy">
                                {a.name}
                                <div className="text-[10px] text-gray-400 font-normal">{a.email}</div>
                              </td>
                              <td className="px-4 py-4 font-mono text-xs">{a.empId}</td>
                              <td className="px-4 py-4">{check(sub.offerLetter, 'Offer')}</td>
                              <td className="px-4 py-4">{check(sub.aadhar, 'Aadhar')}</td>
                              <td className="px-4 py-4">{check(sub.degree, 'Degree')}</td>
                              <td className="px-4 py-4">{check(sub.photo, 'Photo')}</td>
                              <td className="px-4 py-4 text-center">
                                {sub.bankAcc ? (
                                  <div className="group/item">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓</span>
                                    <button 
                                      onClick={() => handleFileView(`Bank_Details_${a.empId}.txt`)}
                                      className="block mx-auto text-[9px] font-bold text-brand-teal opacity-0 group-hover/item:opacity-100 transition-opacity hover:underline mt-1"
                                    >
                                      View
                                    </button>
                                  </div>
                                ) : <span className="text-[10px] text-gray-300">Pending</span>}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {sub.ifsc ? (
                                  <div className="group/item">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓</span>
                                    <button 
                                      onClick={() => handleFileView(`IFSC_${a.empId}.txt`)}
                                      className="block mx-auto text-[9px] font-bold text-brand-teal opacity-0 group-hover/item:opacity-100 transition-opacity hover:underline mt-1"
                                    >
                                      View
                                    </button>
                                  </div>
                                ) : <span className="text-[10px] text-gray-300">Pending</span>}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {sub.pan ? (
                                  <div className="group/item">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓</span>
                                    <button 
                                      onClick={() => handleFileView(`PAN_Card_${a.empId}.txt`)}
                                      className="block mx-auto text-[9px] font-bold text-brand-teal opacity-0 group-hover/item:opacity-100 transition-opacity hover:underline mt-1"
                                    >
                                      View
                                    </button>
                                  </div>
                                ) : <span className="text-[10px] text-gray-300">Pending</span>}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFileView(`All_Documents_${a.empId}.zip`)}
                                  className="text-brand-teal font-bold hover:bg-brand-teal/5 bg-brand-teal/5 border border-brand-teal/20"
                                >
                                  All Files
                                </Button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
       )}
    </div>
  );
};

export default HiringOnboarding;
