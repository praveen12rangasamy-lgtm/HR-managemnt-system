import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { profile } = useAuth();
  const role = profile?.role || 'employee';

  return {
    role,
    isOwner: role === 'owner' || role === 'superadmin',
    isAdmin: role === 'admin',
    isEmployee: role === 'employee',
    isPlatformAdmin: role === 'platform_admin',
  };
};
