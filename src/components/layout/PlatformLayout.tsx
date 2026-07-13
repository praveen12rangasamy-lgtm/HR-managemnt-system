import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';
import PlatformHeader from './PlatformHeader';
import { Menu } from 'lucide-react';

const PlatformLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false); // Close drawer on route change
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#1A0D00] relative text-[#FFFBDC]">
      {/* HAMBURGER BUTTON (Mobile Only) */}
      {isMobile && (
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="fixed top-3 left-4 z-[1100] w-9 h-9 rounded-lg bg-[#FF5900]/10 border border-[#FF5900]/20 text-[#FF5900] flex items-center justify-center shadow-lg"
          aria-label="Open Platform Menu"
          title="Open Platform Menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {isMobile && isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1150] transition-opacity animate-in fade-in"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* SIDEBAR / DRAWER */}
      <div className={`
        fixed left-0 top-0 h-screen z-[1200] transition-transform duration-300 ease-in-out
        ${isMobile ? (isDrawerOpen ? 'translate-x-0 w-[280px] max-w-[80%]' : '-translate-x-full w-[280px]') : 'translate-x-0'}
        ${!isMobile ? 'lg:w-[240px] md:w-[64px]' : ''}
      `}>
        <PlatformSidebar isTablet={!isMobile && window.innerWidth >= 768 && window.innerWidth < 1024} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`
        flex flex-col min-h-screen transition-all duration-300
        ${!isMobile ? 'lg:ml-[240px] md:ml-[64px]' : 'ml-0 mt-[64px]'}
      `}>
        <PlatformHeader isMobile={isMobile} />
        <main className={`flex-1 ${isMobile ? 'p-4' : 'p-8'} relative z-0`}>
          {/* Subtle grid pattern background like landing page */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,89,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,89,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-[-1]" />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
