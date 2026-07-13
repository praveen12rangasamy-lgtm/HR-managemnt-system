import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../hooks/usePlatform';

interface PlatformRouteProps {
  children: React.ReactNode;
}

const PlatformRoute: React.FC<PlatformRouteProps> = ({ children }) => {
  const { session, profile, loading } = useAuth();
  const { isPlatformMode, isPlatformAdmin } = usePlatform();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy" style={{ backgroundColor: '#1A0D00' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal" style={{ borderColor: '#FF5900' }}></div>
      </div>
    );
  }

  // If no auth session or profile, send to landing
  if (!session || !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verify they are in Platform Mode and have Platform Admin role
  if (!isPlatformMode || !isPlatformAdmin) {
    console.warn('Access denied: User is not a Platform Administrator or not in platform mode.');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PlatformRoute;
