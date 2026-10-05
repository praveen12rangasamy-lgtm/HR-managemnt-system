import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, FileText, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">My Profile</h2>
        {isAdmin ? (
          <Badge variant="blue" className="px-3 sm:px-4 py-1.5 font-bold shadow-sm text-xs">Administrator Access Control</Badge>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Info size={14} className="text-brand-teal flex-shrink-0" />
            <span className="hidden sm:inline">For profile corrections, please raise a ticket in Help Desk</span>
            <span className="sm:hidden">Raise a Help Desk ticket for corrections</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-brand-bg overflow-hidden shadow-sm mb-4">
                <img src={isAdmin ? "https://i.pravatar.cc/150?img=68" : "https://i.pravatar.cc/150?img=12"} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">{profile?.full_name || (isAdmin ? 'Admin User' : 'Employee')}</h3>
              <p className="text-brand-teal font-medium">{isAdmin ? 'Administrator' : 'Senior UX Designer'}</p>
              <Badge variant="neutral" className="mt-2 text-xs">ID: {profile?.employee_id || (isAdmin ? 'ADM-001' : 'VYR-2023-0105')}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal & Work Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-3 items-start">
                  <Mail className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{profile?.email || 'admin@vyarahr.com'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Phone className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="text-sm font-medium">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Briefcase className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium font-bold">{isAdmin ? 'Management / HR Office' : 'Product Design'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Calendar className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Joined Date</p>
                    <p className="text-sm font-medium">15 Jan 2023</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <CreditCard className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Bank Account No.</p>
                    <p className="text-sm font-medium">**** **** 9876</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <FileText className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">PAN Card Number</p>
                    <p className="text-sm font-medium">ABCDE1234F</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
