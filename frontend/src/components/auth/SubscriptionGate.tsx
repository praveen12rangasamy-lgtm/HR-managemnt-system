import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { resolveEffectiveSlug } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Loader2 } from 'lucide-react';
import LockedPlansLayout from '../layout/LockedPlansLayout';
import { getSubscriptionState, isOperationalAccessAllowed } from '../../utils/billing';
import type { CustomerAccount, PlatformSettings } from '../../types/tenant';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { slug: tenantSlug, mode } = useTenant();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  const effectiveSlug = resolveEffectiveSlug() || tenantSlug;

  // Platform admin mode, billing pages and the owner console are never locked
  const exempt =
    mode === 'platform' ||
    location.pathname === '/plans' ||
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/dashboard/settings');

  useEffect(() => {
    if (exempt) return;
    let isMounted = true;

    const checkSubscription = async () => {
      try {
        const [cust, sett] = await Promise.all([
          billingService.getCustomerAccount(effectiveSlug),
          billingService.getPlatformSettings()
        ]);
        if (isMounted) {
          setCustomer(cust);
          setSettings(sett);
        }
      } catch (err) {
        console.warn('SubscriptionGate check error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSubscription();
    // Re-check periodically so unblock / renewal approval lifts the lock without a manual reload
    const timer = setInterval(checkSubscription, 60_000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [effectiveSlug, exempt]);

  if (exempt) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-3" />
        <p className="text-xs font-medium">Verifying workspace subscription status...</p>
      </div>
    );
  }

  // No customer record yet: grant evaluation access
  if (!customer) return <>{children}</>;

  const state = getSubscriptionState(customer, settings?.default_trial_days || 14);
  if (!isOperationalAccessAllowed(state)) {
    return <LockedPlansLayout customer={customer} state={state} />;
  }

  return <>{children}</>;
};

export default SubscriptionGate;
