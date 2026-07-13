import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PlatformHeaderProps {
  isMobile?: boolean;
}

const PlatformHeader: React.FC<PlatformHeaderProps> = ({ isMobile }) => {
  const location = useLocation();
  const { profile } = useAuth();
  const path = location.pathname;

  const getPageTitle = () => {
    if (path === '/platform') return 'Platform Dashboard';
    if (path.startsWith('/platform/organizations')) return 'Organization Management';
    if (path.startsWith('/platform/users')) return 'Platform Administrators';
    if (path.startsWith('/platform/audit-logs')) return 'System Audit Logs';
    if (path.startsWith('/platform/settings')) return 'Global Platform Settings';
    return 'Platform Control';
  };

  return (
    <header className="bg-[#1A0D00] border-b border-[#FF5900]/25 h-16 flex items-center px-6 md:px-8 justify-between w-full shadow-md relative z-10">
      {/* Title */}
      <div className="flex items-center gap-3">
        {isMobile && <div className="w-10" /* Spacer for Mobile Menu Burger */ />}
        <Shield size={20} className="text-[#FF5900]" />
        <h1 className="text-lg font-bold tracking-tight text-[#FFFBDC]">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Connected to VyaraHR Platform
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#261300] rounded-full border border-[#FF5900]/25">
          <div className="w-7 h-7 rounded-full bg-[#FF5900]/10 flex items-center justify-center text-[#FF5900] font-bold text-xs">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          <span className="text-xs font-bold text-[#FFFBDC] max-w-[120px] truncate">
            {profile?.full_name || 'Platform Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default PlatformHeader;
