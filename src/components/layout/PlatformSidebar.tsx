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
    <aside className="h-full bg-[#261300] border-r border-[#FF5900]/25 flex flex-col justify-between py-6">
      <div className="flex flex-col gap-8 px-4">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-xl font-bold tracking-tight text-[#FFFBDC] flex items-center gap-1">
            <span>Vyara</span><span className="text-[#FF5900]">Platform</span>
          </h2>
        </div>

        {/* NAV ITEMS */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-[#FF5900]/15 text-[#FF5900] border border-[#FF5900]/30 shadow-lg' 
                    : 'text-[#BAA290] hover:text-[#FFFBDC] hover:bg-[#FF5900]/5 border border-transparent'}
                `}
              >
                <Icon size={18} />
                <span className={isTablet ? 'hidden md:inline' : 'inline'}>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="px-4 flex flex-col gap-4">
        <div className="p-3 bg-[#FF5900]/5 rounded-2xl border border-[#FF5900]/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FF5900]/10 flex items-center justify-center text-[#FF5900] font-bold">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[#FFFBDC] truncate">{profile?.full_name || 'Admin'}</span>
            <span className="text-[10px] text-[#FF5900] font-semibold tracking-wider uppercase">Platform Admin</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Exit Platform</span>
        </button>
      </div>
    </aside>
  );
};

export default PlatformSidebar;
