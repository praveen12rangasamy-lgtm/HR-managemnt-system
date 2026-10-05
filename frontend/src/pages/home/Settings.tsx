import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  RefreshCw, 
  Smartphone, 
  Database, 
  BookOpen, 
  CreditCard,
  Check,
  X,
  Copy,
  CheckCheck,
  FileText,
  Download,
  ExternalLink,
  ArrowRight,
  Loader2,
  Sparkles,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase, resolveEffectiveSlug } from '../../lib/supabase';
import { getScopedKey } from '../../utils/tenantHelper';
import { buildUpiLink, getSubscriptionState, pickEffectiveSlug } from '../../utils/billing';
import { billingService, PLATFORM_PLANS, type PlanConfig } from '../../services/billingService';
import type { CustomerAccount, MembershipPayment, PlatformSettings } from '../../types/tenant';

const Settings: React.FC = () => {
  const { profile, user } = useAuth();
  const { slug: tenantSlug, name: tenantName } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'billing' | 'security' | 'notifications') || 'billing';
  const [activeTab, setActiveTab] = useState<'billing' | 'security' | 'notifications'>(initialTab);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin' || profile?.role === 'owner';
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState('');

  // Password Update State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordState, setPasswordState] = useState({ old: '', new: '', confirm: '' });
  const [step, setStep] = useState(1);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    payroll: true,
    hr: true,
    security: true
  });

  // Billing & Subscription State
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Invoices Modal State
  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<MembershipPayment[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const effectiveSlug = pickEffectiveSlug(resolveEffectiveSlug(), tenantSlug);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Sync tab change with searchParams
  const handleTabChange = (tab: 'billing' | 'security' | 'notifications') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'security' || tabParam === 'notifications' || tabParam === 'billing') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load Billing Data
  const loadBillingData = async () => {
    try {
      const [sett, cust] = await Promise.all([
        billingService.getPlatformSettings(),
        billingService.getCustomerAccount(effectiveSlug)
      ]);
      setPlatformSettings(sett);
      setCustomer(cust);
      if (cust) {
        setPayerName(cust.contact_name || profile?.full_name || '');
        setPayerEmail(cust.contact_email || profile?.email || '');
      } else {
        setPayerName(profile?.full_name || '');
        setPayerEmail(profile?.email || '');
      }
    } catch (err) {
      console.error('Failed to load billing configuration in Settings:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [effectiveSlug]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName.toUpperCase()} to clipboard! ✓`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenCheckout = (plan: PlanConfig) => {
    setSelectedPlan(plan);
    setSubmitError(null);
    setSubmitSuccess(null);
    setUtrNumber('');
    setProofFile(null);
    setCheckoutModalOpen(true);
  };

  const handleOpenInvoices = async () => {
    setInvoicesModalOpen(true);
    setLoadingInvoices(true);
    try {
      const data = await billingService.getTenantInvoices(effectiveSlug);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch past invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const price = isAnnual ? selectedPlan.annualTotal : selectedPlan.monthlyPrice;

    try {
      let uploadedProofUrl = '';
      if (proofFile) {
        uploadedProofUrl = await billingService.uploadPaymentProof(proofFile, effectiveSlug);
      }

      const result = await billingService.submitPaymentVerification({
        tenant_slug: effectiveSlug,
        plan_tier: selectedPlan.id,
        billing_cycle: isAnnual ? 'annual' : 'monthly',
        amount: price,
        proof_path: uploadedProofUrl,
        submitted_by_name: payerName,
        submitted_by_email: payerEmail,
        utr_number: utrNumber
      });

      setSubmitSuccess(result.message);
      showToast('Payment verification submitted! ✓');
      await loadBillingData();
    } catch (err: any) {
      console.error('Verification error:', err);
      setSubmitError(err.message || 'Failed to submit payment verification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Password update handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;

    if (step === 1) {
      showToast('Verifying current password...');
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordState.old
      });

      if (error) {
        showToast('Incorrect old password! ✗');
      } else {
        setStep(2);
        showToast('Old password verified! ✓');
      }
    } else {
      if (passwordState.new.length < 8) {
        showToast('Password must be at least 8 characters! ✗');
      } else if (passwordState.new !== passwordState.confirm) {
        showToast('Passwords do not match! ✗');
      } else {
        showToast('Updating password...');
        const { error } = await supabase.auth.updateUser({ password: passwordState.new });

        if (error) {
          showToast(`Failed to update password: ${error.message} ✗`);
        } else {
          if (profile.role === 'employee') {
            await supabase
              .from('profiles')
              .update({ password: passwordState.new })
              .eq('id', profile.id);
          }
          
          showToast('Password updated successfully! ✓');
          setShowPasswordChange(false);
          setStep(1);
          setPasswordState({ old: '', new: '', confirm: '' });
        }
      }
    }
  };

  // System reset handler for primary admins
  const handleSystemReset = async () => {
    if (!window.confirm("CRITICAL WARNING: This will delete ALL employees, payroll history, loans, and tax records permanently. This cannot be undone. Are you absolutely sure?")) {
      return;
    }

    setIsResetting(true);
    try {
      const adminEmail = profile?.email || '';
      const primaryAdmins = ['praveen12rangasamy@gmail.com', 'pranavanandan18@gmail.com', 'pranavananthan18@gmail.com', 'jin@gmail.com'];
      const isPrimary = primaryAdmins.includes(adminEmail.trim().toLowerCase());

      let profileDeleteQuery = supabase.from('profiles').delete();
      if (adminEmail && !isPrimary) {
        profileDeleteQuery = profileDeleteQuery.eq('hired_by', adminEmail);
      } else {
        profileDeleteQuery = profileDeleteQuery.neq('id', profile?.id);
      }
      const { error: profErr } = await profileDeleteQuery;
      if (profErr) throw profErr;

      if (isPrimary) {
        await supabase.from('payroll_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('loans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('tax_declarations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('calendar_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else {
        const { data: myEmployees } = await supabase
          .from('profiles')
          .select('id')
          .eq('hired_by', adminEmail);
        const myEmployeeIds = (myEmployees || []).map(p => p.id);
        
        await supabase.from('payroll_runs').delete().in('employee_id', myEmployeeIds);
        await supabase.from('loans').delete().in('employee_id', myEmployeeIds);
        await supabase.from('tax_declarations').delete().in('employee_id', myEmployeeIds);
        await supabase.from('calendar_events').delete().like('id', `custom-event-${adminEmail}-%`);
      }

      const keysToWipe = [
        getScopedKey('hr_employee_credentials', profile, user), 
        getScopedKey('hr_employee_submissions', profile, user),
        getScopedKey('hr_loan_applications', profile, user),
        getScopedKey('hr_applicants', profile, user),
        getScopedKey('hr_leave_requests', profile, user),
        getScopedKey('hr_role_hierarchy', profile, user),
        getScopedKey('all_equipment', profile, user),
        getScopedKey('software_licenses', profile, user),
        getScopedKey('asset_queries', profile, user),
        getScopedKey('hr_notifications', profile, user),
        getScopedKey('hr_payroll_ledger', profile, user),
        getScopedKey('hr_courses_assigned', profile, user)
      ];
      keysToWipe.forEach(k => localStorage.removeItem(k));

      alert("System has been successfully reset. Your tenant's employee data has been wiped.");
      window.location.reload();
    } catch (err: any) {
      alert(`Error during reset: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const securityProtocols = [
    { label: 'Passwords', desc: '12+ Characters, No forced periodic resets.', icon: Key },
    { label: 'MFA', desc: 'Authenticator App or Biometrics (Required for Admins).', icon: Smartphone },
    { label: 'Encryption', desc: 'SSL/TLS in transit, AES-256 at rest.', icon: Lock },
    { label: 'Logging', desc: '100% Audit trail of all salary/document access.', icon: Database },
    { label: 'Compliance', desc: 'DPDP (India) / GDPR (Global) ready.', icon: BookOpen }
  ];

  // Price & deep link variables for modal
  const currentPrice = selectedPlan ? (isAnnual ? selectedPlan.annualTotal : selectedPlan.monthlyPrice) : 0;
  const upiId = platformSettings?.upi_id || 'vyarahr@upi';
  const upiName = platformSettings?.upi_name || 'VyaraHR Technologies Pvt Ltd';
  const upiDeepLink = buildUpiLink({ upiId, upiName, amount: currentPrice, tier: selectedPlan?.name || '' });

  const subState = getSubscriptionState(customer, platformSettings?.default_trial_days ?? 14);
  const isTrialExpired = subState === 'trial_expired' || subState === 'overdue' || subState === 'cancelled';

  return (
    <div className="space-y-6 max-w-6xl pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="text-brand-orange" size={20} />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-orange/10 rounded-xl text-brand-orange">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">Account Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your workspace commercial subscriptions, billing, and security.</p>
        </div>
      </div>

      {/* Platform Native Underline Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
          { id: 'security', label: 'Security & Access', icon: Shield },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-brand-orange text-brand-navy'
                : 'border-transparent text-gray-400 hover:text-brand-navy hover:border-gray-200'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-brand-orange' : 'text-gray-400'} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BILLING & SUBSCRIPTION PLANS */}
      {/* ======================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Active Workspace Subscription Status Card */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-lg flex-shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-brand-navy">
                    {tenantName || customer?.tenant_slug || 'Organization Workspace'}
                  </h3>
                  <Badge variant={customer?.payment_status === 'paid' ? 'green' : customer?.payment_status === 'trial' ? 'blue' : 'amber'}>
                    {customer?.payment_status?.toUpperCase() || 'EVALUATION'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active Tier: <strong className="text-brand-navy capitalize font-semibold">{customer?.plan_tier || 'Growth'}</strong>
                  {' · '}Cycle: <span className="capitalize">{customer?.billing_cycle || 'monthly'}</span>
                  {customer?.next_due_date && (
                    <> · Next Renewal: <strong className="text-brand-navy">{customer.next_due_date}</strong></>
                  )}
                </p>
                <span className="text-[11px] text-gray-400 font-mono mt-1 block">
                  Workspace Identifier: /{effectiveSlug}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInvoices}
                className="gap-2 text-xs font-bold border-gray-300 text-brand-navy hover:bg-gray-50"
              >
                <FileText size={14} className="text-brand-orange" />
                <span>GST Tax Invoices</span>
              </Button>
            </div>
          </div>

          {/* Pricing Selector Header with Monthly / Annual Switch */}
          <div className="text-center space-y-4 pt-2">
            <div>
              <span className="px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Zero Transaction Fees · Direct Indian Payment Rails (UPI / IMPS)</span>
              </span>
              <h2 className="text-2xl font-black text-brand-navy mt-2">
                Simple Scaling, Transparent Commercial Plans
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-lg mx-auto">
                All plans include automated Indian payroll, PF/ESI compliance, leave workflows, and digital documentation.
              </p>
            </div>

            {/* Toggle */}
            <div className="inline-flex items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isAnnual 
                    ? 'bg-brand-navy text-white shadow-md' 
                    : 'text-gray-500 hover:text-brand-navy'
                }`}
              >
                Billed Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isAnnual 
                    ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25' 
                    : 'text-gray-500 hover:text-brand-navy'
                }`}
              >
                <span>Billed Annually</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-brand-orange font-black text-[10px]">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid (4 Tiers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_PLANS.map((plan) => {
              const isPopular = plan.id === 'growth';
              const price = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
              const isCurrent = customer?.plan_tier === plan.id;
              const isTrialBlocked = plan.id === 'trial' && isTrialExpired;

              return (
                <div
                  key={plan.id}
                  className={`
                    relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 bg-white
                    ${isPopular 
                      ? 'border-2 border-brand-orange shadow-xl scale-102 ring-4 ring-brand-orange/10' 
                      : 'border border-gray-200 shadow-sm hover:shadow-md'}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-brand-navy">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 min-h-[32px] leading-relaxed mb-4">
                      {plan.description}
                    </p>

                    {/* Price Tag */}
                    <div className="py-4 border-y border-gray-100 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-brand-orange">₹</span>
                        <span className="text-3xl font-extrabold text-brand-navy tracking-tight">
                          {price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">/ month</span>
                      </div>
                      {isAnnual && plan.annualTotal > 0 && (
                        <span className="text-[11px] text-gray-400 block mt-1">
                          ₹{plan.annualTotal.toLocaleString('en-IN')} billed annually
                        </span>
                      )}
                      {plan.id === 'trial' && (
                        <span className="text-[11px] text-brand-orange font-semibold block mt-1">
                          14-day full platform evaluation
                        </span>
                      )}
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-3 mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                        Included Features
                      </span>
                      <ul className="space-y-2 text-xs text-gray-600">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <Check size={14} className="text-brand-orange flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                        {plan.notIncluded?.map((notFeat) => (
                          <li key={notFeat} className="flex items-start gap-2 text-gray-300">
                            <X size={14} className="flex-shrink-0 mt-0.5" />
                            <span>{notFeat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    {plan.id === 'trial' ? (
                      <button
                        type="button"
                        disabled={isTrialBlocked || isCurrent}
                        onClick={() => handleOpenCheckout(plan)}
                        className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isTrialBlocked ? 'Trial Expired' : isCurrent ? 'Active Evaluation' : 'Start Free Trial'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(plan)}
                        className={`
                          w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer
                          ${isPopular 
                            ? 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-brand-orange/25' 
                            : 'bg-brand-navy hover:bg-black text-white'}
                        `}
                      >
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SECURITY & PASSWORDS (Existing Platform Feature) */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
          <Card className="border-t-4 border-t-brand-navy flex flex-col shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3">
                  <Shield size={22} className="text-brand-navy" />
                  Security & Data Protection
                </CardTitle>
                {!showPasswordChange && (
                  <Button size="sm" variant="outline" onClick={() => setShowPasswordChange(true)} className="gap-2">
                    <RefreshCw size={14} /> Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {!showPasswordChange ? (
                <div className="grid gap-4">
                  {securityProtocols.map((protocol, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-orange/20 transition-all">
                      <div className="p-2 bg-white rounded-lg border shadow-sm h-fit">
                        <protocol.icon size={18} className="text-brand-navy" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-brand-navy">{protocol.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{protocol.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200">
                    <Key size={18} className="text-brand-navy" />
                    <h4 className="font-bold text-brand-navy">Change Account Password</h4>
                  </div>
                  <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                    {step === 1 ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Old Password</label>
                        <input type="password" className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white" value={passwordState.old} onChange={(e) => setPasswordState({...passwordState, old: e.target.value})} placeholder="Enter current password" required />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">New Password</label>
                          <input type="password" className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white" value={passwordState.new} onChange={(e) => setPasswordState({...passwordState, new: e.target.value})} placeholder="Min. 8 characters" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirm Password</label>
                          <input type="password" className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white" value={passwordState.confirm} onChange={(e) => setPasswordState({...passwordState, confirm: e.target.value})} placeholder="Repeat new password" required />
                        </div>
                      </>
                    )}
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1 bg-brand-navy hover:bg-black font-bold h-12">
                        {step === 1 ? 'Verify Old Password' : 'Update Password'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowPasswordChange(false); setStep(1); }} className="text-gray-400 h-12">Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Reset for Admins */}
          {isAdmin && (
            <Card className="border-t-4 border-t-red-500 flex flex-col shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-600">
                  <AlertCircle size={22} className="text-red-500" />
                  Workspace Data Governance
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Reset employee records, payroll test ledger, and attendance logs for this workspace. This action requires administrative confirmation.
                </p>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-brand-navy block">Tenant Database Wipe</span>
                    <span className="text-[11px] text-gray-400">Scoped to workspace /{effectiveSlug}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isResetting}
                    onClick={handleSystemReset}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {isResetting ? 'Resetting...' : 'System Reset'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: NOTIFICATIONS (Existing Platform Feature) */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl animate-in fade-in duration-200">
          <Card className="border-t-4 border-t-brand-orange flex flex-col shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell size={22} className="text-brand-orange" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <p className="text-sm text-gray-500">Manage how you receive updates and operational system alerts.</p>
              <div className="space-y-4">
                {[
                  { key: 'payroll', label: 'Payroll Alerts', color: 'text-red-500', bg: 'bg-red-50', desc: 'Monthly disbursement and tax document availability.' },
                  { key: 'hr', label: 'HR Operations', color: 'text-brand-orange', bg: 'bg-brand-orange/10', desc: 'Policy updates and operational announcements.' },
                  { key: 'security', label: 'Security Alerts', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Suspicious logins and account changes.' }
                ].map((notif) => (
                  <div key={notif.key} className="p-4 border border-gray-200 rounded-2xl hover:bg-gray-50/50 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-brand-navy text-sm">{notif.label}</span>
                      <label className="relative inline-flex items-center h-4 w-8 shrink-0 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          title={notif.label}
                          aria-label={notif.label}
                          checked={notificationSettings[notif.key as keyof typeof notificationSettings]} 
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [notif.key]: e.target.checked
                          })}
                        />
                        <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-brand-orange after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{notif.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
                <AlertCircle className="text-blue-500 shrink-0" size={16} />
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                  Critical alerts (Security/Compliance) are enforced by system policy and cannot be disabled.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* INDIAN PAYMENT RAILS CHECKOUT MODAL */}
      {/* ======================================================== */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy">
                    Indian Payment Rails Checkout: {selectedPlan.name} Plan
                  </h3>
                  <span className="text-xs text-gray-500">
                    Workspace: <strong className="text-brand-orange font-mono">/{effectiveSlug}</strong> · Amount:{' '}
                    <strong className="text-brand-navy font-mono">₹{currentPrice.toLocaleString('en-IN')}</strong> ({isAnnual ? 'Annual' : 'Monthly'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="text-gray-400 hover:text-brand-navy p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="text-lg font-bold text-brand-navy">Payment Verification Submitted!</h4>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  {submitSuccess}
                </p>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 max-w-sm mx-auto text-xs text-gray-600 space-y-1">
                  <p><strong>UTR:</strong> {utrNumber}</p>
                  <p><strong>Workspace:</strong> /{effectiveSlug}</p>
                  <p><strong>Plan:</strong> {selectedPlan.name} ({isAnnual ? 'Annual' : 'Monthly'})</p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      window.location.reload();
                    }}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs px-8"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* Left: Dynamic UPI QR Code & Bank Details */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange mb-3">
                      Scan via GPay, PhonePe, Paytm, or BHIM
                    </span>

                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                      <QRCodeCanvas
                        value={upiDeepLink}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <p className="text-xs font-mono font-bold text-brand-navy mt-2">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </p>

                    {/* Copy UPI */}
                    <div className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs">
                      <span className="font-mono text-gray-600 truncate">{upiId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiId, 'upi')}
                        className="text-brand-orange hover:underline flex items-center gap-1 font-semibold cursor-pointer ml-2 flex-shrink-0"
                      >
                        {copiedField === 'upi' ? <CheckCheck size={13} /> : <Copy size={13} />}
                        <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Deep link button */}
                    <a
                      href={upiDeepLink}
                      className="mt-2.5 w-full py-2 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ExternalLink size={13} />
                      <span>Open in UPI App</span>
                    </a>
                  </div>

                  {/* IMPS Bank Details */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                    <span className="font-bold text-brand-navy text-[11px] uppercase tracking-wider block mb-1">
                      Direct IMPS / NEFT Bank Transfer
                    </span>
                    <div className="flex justify-between text-gray-500">
                      <span>Bank:</span>
                      <strong className="text-brand-navy">{platformSettings?.bank_name || 'HDFC Bank'}</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                      <span>Account No:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-brand-navy font-mono">{platformSettings?.account_number || '50200088991122'}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(platformSettings?.account_number || '50200088991122', 'acc')}
                          className="text-brand-orange hover:underline cursor-pointer"
                        >
                          {copiedField === 'acc' ? <CheckCheck size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>IFSC Code:</span>
                      <strong className="text-brand-navy font-mono">{platformSettings?.ifsc_code || 'HDFC0001234'}</strong>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Payee:</span>
                      <strong className="text-brand-navy truncate max-w-[150px]">{platformSettings?.account_name || 'VyaraHR Tech'}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Verification Submission Form */}
                <form onSubmit={handleSubmitVerification} className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-brand-navy mb-0.5">Submit Payment Verification</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Enter the 12-digit transaction UTR reference generated by your bank or UPI application.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      12-Digit Bank / UPI Reference (UTR) Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="e.g. 428711892019"
                      maxLength={20}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-brand-navy focus:ring-2 focus:ring-brand-orange outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-brand-navy focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Invoice Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="finance@company.com"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-brand-navy focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Screenshot / Receipt (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-navy file:text-white hover:file:bg-black cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs shadow-md shadow-brand-orange/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying UTR Reference...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit for Instant Activation</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center">
                    Official GST Tax Invoice (18% input credit compliant) will be dispatched to your email upon approval.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* GST TAX INVOICES MODAL */}
      {/* ======================================================== */}
      {invoicesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy">GST Tax Invoices & Billing History</h3>
                  <span className="text-xs text-gray-500">
                    Workspace: <strong className="text-brand-orange font-mono">/{effectiveSlug}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoicesModalOpen(false)}
                className="text-gray-400 hover:text-brand-navy cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {loadingInvoices ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-7 h-7 text-brand-orange animate-spin mb-3" />
                <p className="text-xs">Fetching past tax invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm font-semibold text-brand-navy">No approved invoices found yet</p>
                <p className="text-xs mt-1">Approved payments will generate official B2B GST tax invoices here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-semibold">
                      <th className="py-3 px-3">Invoice Number</th>
                      <th className="py-3 px-3">Plan & Cycle</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Payment Ref (UTR)</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-bold text-brand-navy">
                          {inv.invoice_number || 'VYR/INV/PENDING'}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          {inv.plan_tier} ({inv.billing_cycle})
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-brand-navy">
                          ₹{Number(inv.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500">
                          {inv.utr_number || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.invoice_pdf_path ? (
                            <a
                              href={billingService.getInvoiceUrl(inv.invoice_pdf_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                            >
                              <Download size={12} />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
