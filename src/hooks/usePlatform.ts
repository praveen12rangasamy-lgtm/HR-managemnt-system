import { useTenant } from './useTenant';
import { useRole } from './useRole';

export const usePlatform = () => {
  const { mode } = useTenant();
  const { isPlatformAdmin } = useRole();

  return {
    isPlatformMode: mode === 'platform',
    isPlatformAdmin,
  };
};
