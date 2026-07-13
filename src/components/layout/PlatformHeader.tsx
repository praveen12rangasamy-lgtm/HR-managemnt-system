import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 md:px-8 justify-between w-full shadow-sm relative z-10">
      {/* Title */}
      <div className="flex items-center gap-3">
        {isMobile && <div className="w-10" /* Spacer for Mobile Menu Burger */ />}
        <Shield size={20} className="text-brand-orange" />
        <h1 className="text-lg font-bold tracking-tight text-brand-navy">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Connection Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Connected to VyaraHR Platform
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
          <div className="w-7 h-7 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          <span className="text-xs font-semibold text-brand-navy max-w-[120px] truncate">
            {profile?.full_name || 'Platform Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default PlatformHeader;

