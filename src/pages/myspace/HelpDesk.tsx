import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { MessageSquare, Info, AlertTriangle, Headset, TrendingUp, CheckCircle, UserPlus, LogOut, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendEmail } from '../../lib/resend';

const HelpDesk = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [ticketType, setTicketType] = useState('IT Support');
  const [priority, setPriority] = useState('Medium');
  const [toast, setToast] = useState('');

  // Mock Admin Data for Tickets
  const [adminTickets, setAdminTickets] = useState([
    { id: 'TK1', name: 'Robert Fox', empId: 'VYR-2026-003', dept: 'Engineering', issue: 'VPN access not working since morning', priority: 'High' },
    { id: 'TK2', name: 'Jane Cooper', empId: 'VYR-2026-007', dept: 'Sales', issue: 'New laptop requested for client visit', priority: 'Medium' },
  ]);


  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };


  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Request submitted successfully! ✓');
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const description = formData.get('description') as string || 'No description provided';

    showToast('Processing ticket...');
    
    sendEmail({
      to: 'praveen12rangasamy@gmail.com', // Admin or Support email
      subject: `New Support Ticket: ${ticketType} [${priority}]`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0f2d52;">New Support Ticket Raised</h2>
          <p><strong>Employee:</strong> ${profile?.full_name} (${profile?.employee_id || 'N/A'})</p>
          <p><strong>Category:</strong> ${ticketType}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <hr />
          <p><strong>Issue Description:</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">${description}</p>
        </div>
      `
    }).then(res => {
      if (res.success) {
        showToast('Support ticket raised and HR notified via email! ✓');
      } else {
        showToast('Ticket recorded, but email notification failed.');
      }
    });

    (e.target as HTMLFormElement).reset();
  };

  const employeeQuickActions = [
    "Leave balance is wrong",
    "Last payslip was incorrect",
    "I want to update my bank details"
  ];

  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-7xl relative">
        {toast && (
          <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
            <CheckCircle className="text-brand-teal" size={20} />
            <span className="font-medium">{toast}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-navy">Administrator Help Desk Console</h2>
          <Badge variant="blue">System Admin Mode</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Box 1: Quick Actions (Responder) */}
          <Card className="border-t-4 border-t-brand-teal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info size={20} className="text-brand-teal"/> Console Shortcuts</CardTitle>
              <p className="text-xs text-gray-500">Functional links to manage lifecycle modules.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/dashboard/hiring">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 hover:border-brand-teal hover:text-brand-teal transition-all mb-3 text-sm font-medium">
                  <UserPlus size={18} className="text-brand-teal" />
                  Manage Hiring Pipeline
                </Button>
              </Link>
              <Link to="/dashboard/offboarding">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 hover:border-brand-navy hover:text-brand-navy transition-all mb-3 text-sm font-medium">
                  <LogOut size={18} className="text-brand-navy" />
                  Employee Offboarding
                </Button>
              </Link>
              <Link to="/dashboard/updates">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 hover:border-blue-500 hover:text-blue-500 transition-all text-sm font-medium">
                  <Briefcase size={18} className="text-blue-500" />
                  Post Company Updates
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Box 2: Support Tickets (Responder) */}
          <Card className="border-t-4 border-t-brand-navy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Headset size={20} className="text-brand-navy"/> Support Tickets</CardTitle>
              <p className="text-xs text-gray-500">Requires immediate technical or HR action.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-brand-navy text-sm">{ticket.name}</p>
                      <p className="text-[10px] text-gray-400">{ticket.empId} • {ticket.dept}</p>
                    </div>
                    <Badge variant={ticket.priority === 'High' ? 'red' : 'neutral'} className="text-[9px] px-1.5 py-0">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 bg-white/80 p-2 rounded border border-brand-navy/5 leading-relaxed">{ticket.issue}</p>
                  <p className="text-[9px] text-brand-navy font-bold uppercase tracking-widest text-center">Action Required Immediately</p>
                </div>
              ))}
              {adminTickets.length === 0 && <p className="text-center py-4 text-gray-400 italic text-sm">No active support tickets.</p>}
            </CardContent>
          </Card>

          {/* Box 3: Recently Applied Candidates (Restored) */}
          <Card className="border-t-4 border-t-status-amber bg-gradient-to-br from-amber-50/50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy"><UserPlus size={20} className="text-status-amber" /> Recently Applied</CardTitle>
              <p className="text-xs text-gray-500">Quick details of employees currently applying.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Michael Scott', role: 'Sales Manager', date: 'Oct 12', match: 92 },
                { name: 'Pam Beesly', role: 'UX Designer', date: 'Oct 14', match: 88 },
                { name: 'Dwight Schrute', role: 'Sales Lead', date: 'Oct 15', match: 95 }
              ].map((applicant, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-status-amber text-[10px] font-bold">
                      {applicant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-navy">{applicant.name}</p>
                      <p className="text-[10px] text-gray-400">{applicant.role} • {applicant.date}</p>
                    </div>
                  </div>
                  <Badge variant="amber" className="text-[9px]">{applicant.match}% Match</Badge>
                </div>
              ))}
              <Link to="/dashboard/hiring">
                <Button variant="ghost" className="w-full text-xs text-brand-teal hover:bg-brand-teal/5 gap-2 mt-2">
                  View Full Pipeline <TrendingUp size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl relative">
      {/* Pop-up Toast Message */}
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="text-brand-teal" size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-brand-navy">Employee Help Desk</h2>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Left: Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info size={20} className="text-brand-teal"/> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Frequently Asked Checks</label>
              <div className="flex flex-col gap-2">
                {employeeQuickActions.map((action, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="justify-start text-left font-normal border-gray-200 hover:border-brand-teal hover:text-brand-teal transition-all"
                    onClick={() => showToast(`Information for "${action}" sent to your email. ✓`)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            <form className="border-t pt-4" onSubmit={handleSubmitRequest}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Request / Custom Action</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-md p-3 focus:ring-brand-teal text-sm resize-none" placeholder="Describe what you need help with..." required></textarea>
              <p className="text-[10px] text-gray-400 mt-2">Note: For profile corrections, please describe the specific field change required.</p>
              <Button type="submit" className="mt-3 w-full">Submit Request</Button>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* Bottom: Support Tickets (Employee View) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Headset size={20} className="text-brand-navy" /> Raise a Support Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-3xl space-y-5" onSubmit={handleSubmitTicket}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal text-sm"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  <option>Payroll Issue</option>
                  <option>IT Support</option>
                  <option value="Harassment">Harassment / Grievance</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal text-sm h-10"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Description</label>
              <textarea name="description" rows={4} className="w-full border border-gray-300 rounded-md p-3 focus:ring-brand-teal text-sm resize-none" placeholder="Please describe your issue in detail..." required></textarea>
            </div>

            <div className="flex justify-between items-center">
               <Button type="submit" className="gap-2 px-8"><MessageSquare size={16}/> Submit Ticket</Button>
               {ticketType === 'Harassment' && (
                 <Badge variant="red" className="flex items-center gap-1 animate-pulse"><AlertTriangle size={12}/> High Confidentiality Protocol Active</Badge>
               )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpDesk;
