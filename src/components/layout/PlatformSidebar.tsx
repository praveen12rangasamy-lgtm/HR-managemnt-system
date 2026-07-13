import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users2, ShieldAlert, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resetTenant } from '../../lib/supabase';
import { useTenant } from '../../hooks/useTenant';

interface PlatformSidebarProps {
  isTablet?: boolean;
}

const PlatformSidebar: React.FC<PlatformSidebarProps> = ({ isTablet }) => {
  const { profile, signOut } = useAuth();
  const { updateTenantInfo } = useTenant();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    resetTenant();
    updateTenantInfo('', '');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/platform', end: true },
    { name: 'Organizations', icon: Building2, path: '/platform/organizations' },
    { name: 'Platform Admins', icon: Users2, path: '/platform/users' },
    { name: 'Audit Logs', icon: ShieldAlert, path: '/platform/audit-logs' },
    { name: 'Global Settings', icon: Settings, path: '/platform/settings' },
  ];

  return (
    <aside className={`h-screen bg-brand-sidebar text-white flex flex-col border-r border-white/5 overflow-y-auto ${isTablet ? 'w-16' : 'w-full'}`}>
      <div className={`p-6 flex items-center border-b border-white/5 ${isTablet ? 'justify-center' : 'justify-start'}`}>
        <h1 className="text-xl font-bold flex items-center">
          <span className="text-white">V</span>
          {!isTablet && <><span className="text-white">yara</span><span className="text-brand-orange">Platform</span></>}
        </h1>
      </div>

      <nav className="flex-1 mt-6">
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                end={item.end}
                title={isTablet ? item.name : ''}
                className={({ isActive }) => `
                  flex items-center rounded-xl transition-all duration-200 group
                  ${isTablet ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                  ${isActive 
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                    : 'text-gray-200 hover:bg-brand-orange/20 hover:text-white'}
                `}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isTablet && <span className="font-semibold text-sm">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className={`flex items-center ${isTablet ? 'justify-center' : 'gap-3 px-2 py-2'}`}>
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center font-bold text-white shadow-lg shadow-brand-orange/20 flex-shrink-0">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          {!isTablet && (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate block">{profile?.full_name || 'Admin'}</span>
              <span className="text-[10px] text-gray-400 block tracking-widest uppercase">Platform Admin</span>
            </div>
          )}
          {!isTablet && (
            <button
              onClick={handleLogout}
              title="Exit Platform"
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default PlatformSidebar;
