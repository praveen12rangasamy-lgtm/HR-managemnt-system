import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Home, User, DollarSign, Monitor, TrendingUp, Menu, X, Users, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isSuperAdmin = profile?.role === 'superadmin' || profile?.role === 'owner';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [expiryNotice, setExpiryNotice] = useState<{ days: number; date: string } | null>(null);

  useEffect(() => {
    const checkExpiry = async () => {
      try {
        const { billingService } = await import('../../services/billingService');
        const cust = await billingService.getCustomerAccount();
        if (cust?.next_due_date && cust.payment_status === 'paid') {
          const dueDate = new Date(cust.next_due_date);
          const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 3600 * 24));
          if (diffDays <= 7 && diffDays >= 0) {
            setExpiryNotice({ days: diffDays, date: cust.next_due_date });
          }
        }
      } catch (_) {}
    };
    checkExpiry();
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false); // Close drawer on route change
  }, [location.pathname]);

  const botNavItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'My Space', icon: User, path: '/dashboard/myspace' },
    { name: 'Finance', icon: DollarSign, path: '/dashboard/finance' },
    { name: 'Assets', icon: Monitor, path: '/dashboard/assets' },
    ...((isAdmin || isSuperAdmin) ? [{ name: 'Performance', icon: TrendingUp, path: '/dashboard/performance' }] : [])
  ];

  return (
    <div className="min-h-screen bg-brand-bg relative">
      {/* HAMBURGER BUTTON (Mobile Only) */}
      {isMobile && (
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="fixed top-3 left-4 z-[1100] w-9 h-9 rounded-lg bg-brand-teal/10 border border-brand-teal/20 text-brand-teal flex items-center justify-center shadow-lg"
          aria-label="Open Menu"
          title="Open Menu"
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
        ${!isMobile ? 'lg:w-[230px] md:w-[64px]' : ''}
      `}>
        <Sidebar isTablet={!isMobile && window.innerWidth >= 768 && window.innerWidth < 1024} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`
        flex flex-col min-h-screen transition-all duration-300
        ${!isMobile ? 'lg:ml-[230px] md:ml-[64px]' : 'ml-0 mt-[120px] mb-[70px]'}
      `}>
        <Header isMobile={isMobile} />
        <main className={`flex-1 ${isMobile ? 'p-4' : 'p-8'}`}>
          {/* Subscription Renewal Reminder Banner */}
          {expiryNotice && !bannerDismissed && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
                  🔔
                </div>
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    Subscription Renewal Notice:
                  </span>
                  <span className="text-amber-800 dark:text-amber-200/90 ml-1">
                    Your workspace subscription renews on <strong>{expiryNotice.date}</strong> ({expiryNotice.days} days remaining).
                  </span>
                  <a
                    href="/dashboard/settings?tab=billing"
                    className="ml-2 font-bold text-brand-orange underline hover:text-black transition-colors"
                  >
                    Review Invoices & Plan &rarr;
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* BOTTOM NAVIGATION (Mobile Only) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-brand-sidebar border-t border-white/10 flex justify-around items-center z-[1000] pb-[env(safe-area-inset-bottom)]">
          {botNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <a 
                key={item.name} 
                href={item.path}
                onClick={(e) => { e.preventDefault(); window.location.href = item.path; }}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand-teal' : 'text-brand-muted'}`}
              >
                <item.icon size={18} />
                <span className="text-xs font-medium">{item.name}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default DashboardLayout;
