import React, { useState } from 'react';
import { Settings, Shield, Sparkles, CreditCard, Bell } from 'lucide-react';

const GlobalSettings: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);
  const [brandingName, setBrandingName] = useState('VyaraHR');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-[#FFFBDC]">Global Platform Settings</h2>
        <p className="text-xs text-[#BAA290]">Configure general parameters, branding defaults, and system operations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold">
            Settings updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Platform Controls */}
          <div className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-3xl space-y-6">
            <h3 className="text-sm font-bold text-[#FF5900] flex items-center gap-2">
              <Shield size={16} />
              <span>Platform Gatekeeper Controls</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#FFFBDC]">Maintenance Mode</p>
                  <p className="text-[10px] text-[#BAA290]">Block client logins during system upgrades.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-[#1A0D00] border border-[#FF5900]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#BAA290] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF5900] peer-checked:after:bg-[#FFFBDC]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#FFFBDC]">Public HR Registrations</p>
                  <p className="text-[10px] text-[#BAA290]">Allow new company creators to signup from landing page.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowNewSignups}
                    onChange={(e) => setAllowNewSignups(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-[#1A0D00] border border-[#FF5900]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#BAA290] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF5900] peer-checked:after:bg-[#FFFBDC]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Branding Default Parameters */}
          <div className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-[#FF5900] flex items-center gap-2">
              <Sparkles size={16} />
              <span>Branding & Trials</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#BAA290] uppercase">Platform Brand Name</label>
              <input
                type="text"
                required
                className="w-full bg-[#1A0D00] border border-[#FF5900]/25 rounded-xl px-4 py-2.5 text-sm text-[#FFFBDC] outline-none focus:border-[#FF5900] transition-colors"
                value={brandingName}
                onChange={(e) => setBrandingName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#BAA290] uppercase">Default Trial Duration (Days)</label>
              <input
                type="number"
                required
                min={1}
                className="w-full bg-[#1A0D00] border border-[#FF5900]/25 rounded-xl px-4 py-2.5 text-sm text-[#FFFBDC] outline-none focus:border-[#FF5900] transition-colors"
                value={defaultTrialDays}
                onChange={(e) => setDefaultTrialDays(parseInt(e.target.value) || 14)}
              />
            </div>
          </div>
        </div>

        {/* Future Billing & Operations Placeholder */}
        <div className="p-6 bg-[#261300] border border-[#FF5900]/15 rounded-3xl space-y-6 opacity-60 pointer-events-none relative overflow-hidden">
          <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-[#FF5900]/10 border border-[#FF5900]/25 text-[#FF5900] rounded-full text-[9px] font-bold uppercase tracking-wider">
            Future Placeholder
          </div>
          <h3 className="text-sm font-bold text-[#FF5900] flex items-center gap-2">
            <CreditCard size={16} />
            <span>Stripe Billing & Subscriptions Settings</span>
          </h3>
          <p className="text-xs text-[#BAA290] leading-relaxed">
            Automatic Stripe webhook sync, tier configuration limits, and checkout redirect URLs will reside here once integrated.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#FF5900] hover:bg-[#FF8237] disabled:opacity-50 text-[#FFFBDC] rounded-xl text-sm font-bold transition-all shadow-md"
          >
            {saving ? 'Saving changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GlobalSettings;
