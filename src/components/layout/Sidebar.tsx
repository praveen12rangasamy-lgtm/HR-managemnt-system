import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, DollarSign, Monitor, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const navItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'My Space', icon: User, path: '/dashboard/myspace' },
    { name: 'Finance', icon: DollarSign, path: '/dashboard/finance' },
    { name: 'Assets', icon: Monitor, path: '/dashboard/assets' },
    ...(isAdmin ? [{ name: 'Performance', icon: TrendingUp, path: '/dashboard/performance' }] : []),
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="w-64 bg-black h-screen text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-8 flex items-center justify-center border-b border-white/10">
        <img src="/logo.png" alt="VyaraHR" className="w-full h-auto object-contain max-h-16" />
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                end={item.path === '/dashboard'}
                className={({isActive}) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-gray-400 hover:bg-brand-orange/20 hover:text-white'}`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
