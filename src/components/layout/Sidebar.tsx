import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, DollarSign, Monitor, TrendingUp, Calendar, Settings, LogOut, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isTablet?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isTablet }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';
  const isSuperAdmin = profile?.role === 'superadmin';

  const navItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'My Space', icon: User, path: '/dashboard/myspace' },
    { name: 'Finance', icon: DollarSign, path: '/dashboard/finance' },
    { name: 'Assets', icon: Monitor, path: '/dashboard/assets' },
    ...((isAdmin || isSuperAdmin) ? [{ name: 'Performance', icon: TrendingUp, path: '/dashboard/performance' }] : []),
    { name: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={`h-screen bg-brand-sidebar text-white flex flex-col border-r border-white/5 overflow-y-auto ${isTablet ? 'w-16' : 'w-full'}`}>
      <div className={`p-6 flex items-center border-b border-white/5 ${isTablet ? 'justify-center' : 'justify-start'}`}>
        <h1 className="text-xl font-bold flex items-center">
          <span className="text-white">V</span>
          {!isTablet && <><span className="text-white">yara</span><span className="text-brand-orange">HR</span></>}
        </h1>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                end={item.name === 'Home'}
                title={isTablet ? item.name : ''}
                className={({isActive}) => 
                  `flex items-center rounded-xl transition-all duration-200 group ${
                    isTablet ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                      : 'text-gray-200 hover:bg-brand-orange/20 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isTablet && <span className="font-semibold text-sm">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className={`flex items-center ${isTablet ? 'justify-center' : 'gap-3 px-2 py-2'}`}>
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center font-bold text-white shadow-lg shadow-brand-orange/20 flex-shrink-0">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          {!isTablet && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate uppercase tracking-widest">{profile?.role || 'Member'}</p>
            </div>
          )}
          {!isTablet && (
            <button 
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
