import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const path = location.pathname;
  const isAdmin = profile?.role === 'admin';
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const checkNotifications = () => {
      const notifications = JSON.parse(localStorage.getItem('hr_notifications') || '[]');
      const lastChecked = localStorage.getItem('hr_notifications_last_checked') || '0';
      
      const unreadCount = notifications.filter((n: any) => {
        if (!n) return false;
        const timestampStr = n.time_iso || (n.id && typeof n.id === 'string' ? n.id.replace('NOTIF-', '') : '');
        if (!timestampStr) return false;
        
        const timestamp = isNaN(Number(timestampStr)) ? new Date(timestampStr).getTime() : parseInt(timestampStr);
        return !isNaN(timestamp) && timestamp > parseInt(lastChecked || '0');
      }).length;
      
      setNotifCount(unreadCount);
    };

    checkNotifications();
    
    // Check every 30 seconds for new updates
    const interval = setInterval(checkNotifications, 30000);
    
    // Reset count if we are on the updates page
    if (path === '/dashboard/updates') {
      localStorage.setItem('hr_notifications_last_checked', Date.now().toString());
      setNotifCount(0);
    }

    return () => clearInterval(interval);
  }, [path]);

  let subMenuItems: {name: string, path: string}[] = [];

  // Home Section
  if (path === '/dashboard' || path.startsWith('/dashboard/home') || path.startsWith('/dashboard/updates') || path.startsWith('/dashboard/hiring') || path.startsWith('/dashboard/offboarding')) {
    subMenuItems = [
      { name: 'Dashboard', path: '/dashboard' },
      ...(isAdmin ? [
        { name: 'Post Job', path: '/dashboard/updates' },
        { name: 'Hiring & Onboarding', path: '/dashboard/hiring' },
        { name: 'Offboarding', path: '/dashboard/offboarding' },
        { name: 'Role Hierarchy', path: '/dashboard/hierarchy' }
      ] : [])
    ];
  } 
  // My Space Section
  else if (path.includes('/myspace') || path.includes('/profile') || path.includes('/attendance') || path.includes('/leaves') || path.includes('/helpdesk')) {
    subMenuItems = [
      { name: 'My Profile', path: '/dashboard/myspace/profile' },
      { name: 'Attendance', path: '/dashboard/myspace/attendance' },
      { name: 'Leaves', path: '/dashboard/myspace/leaves' },
      ...(!isAdmin ? [{ name: 'Offboarding', path: '/dashboard/myspace/resignation' }] : []),
      { name: 'Help Desk', path: '/dashboard/myspace/helpdesk' }
    ];
  } 
  // Finance Section
  else if (path.includes('/finance')) {
    subMenuItems = [
      { name: 'Pay & Docs', path: '/dashboard/finance' },
      { name: 'Loans', path: '/dashboard/finance/loans' },
      ...(!isAdmin ? [{ name: 'Tax Info', path: '/dashboard/finance/tax' }] : [])
    ];
  } 
  // Assets Section
  else if (path.includes('/assets')) {
    subMenuItems = [
      { name: 'Equipment', path: '/dashboard/assets/equipment' },
      ...(!isAdmin ? [{ name: 'Report Issue', path: '/dashboard/assets/equipment' }] : []),
      ...(isAdmin ? [{ name: 'Query', path: '/dashboard/assets/query' }] : [])
    ];
  } 
  // Performance Section
  else if (path.includes('/performance')) {
    subMenuItems = [];
  }
  // Settings Section
  else if (path.includes('/settings')) {
    subMenuItems = [
      { name: 'Account settings', path: '/dashboard/settings' }
    ];
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 w-full shrink-0">
      <div className="flex h-16 items-center justify-between px-8">
        <nav className="flex space-x-8 h-full items-center">
          {subMenuItems.map(item => {
            const isActive = path === item.path || (item.path !== '/dashboard' && path.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`text-sm font-medium transition-colors border-b-2 h-full flex items-center px-1 ${isActive ? 'border-brand-orange text-brand-navy' : 'border-transparent text-gray-500 hover:text-brand-navy hover:border-gray-300'}`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/dashboard/updates" className="relative p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-full transition-all group">
            <Bell size={22} className="group-hover:rotate-12 transition-transform" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-300">
                {notifCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <User size={14} />
            </div>
            <span className="text-sm font-medium text-brand-navy truncate max-w-[120px]">
              {profile?.full_name || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
