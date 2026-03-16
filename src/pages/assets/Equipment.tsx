import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Send, Eye, EyeOff, Shield, MonitorPlay, Key, Laptop, AlertCircle, CheckCircle, Search, User, KeyRound, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Equipment = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [showPwd, setShowPwd] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Provisioning States
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [showSoftwareModal, setShowSoftwareModal] = useState(false);
  const [newHardware, setNewHardware] = useState({ employee: '', item: '', model: '', date: new Date().toISOString().split('T')[0] });
  const [newSoftware, setNewSoftware] = useState({ employee: '', software: '', key: '', expiry: '' });

  // Equipment state - shared via localStorage for demo purposes
  const [equipment, setEquipment] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);

  useEffect(() => {
    const initialEquip = [
      { employee: 'Jane Doe', item: 'Laptop', model: 'MacBook Pro 16"', date: 'Jan 15, 2023', status: 'Active' },
      { employee: 'Michael Chen', item: 'Monitor', model: 'Dell UltraSharp 27"', date: 'Feb 01, 2023', status: 'Active' },
      { employee: 'Sarah Miller', item: 'Headset', model: 'Sony WH-1000XM5', date: 'Jun 10, 2024', status: 'Repairing' },
      { employee: 'John Doe', item: 'Laptop', model: 'Lenovo ThinkPad X1', date: 'Mar 12, 2024', status: 'Active' },
      { employee: 'VYR-2024-001', item: 'Laptop', model: 'Dell Latitude 7440', date: 'Mar 16, 2024', status: 'Active' },
      { employee: 'Emily Brown', item: 'Tablet', model: 'iPad Pro 12.9"', date: 'Oct 20, 2023', status: 'Active' },
      { employee: 'David Wilson', item: 'Monitor', model: 'LG 34" Ultrawide', date: 'Dec 05, 2023', status: 'Active' },
      { employee: 'Lisa Wang', item: 'Laptop', model: 'Dell XPS 15', date: 'Jan 22, 2024', status: 'Repairing' },
      { employee: 'Kevin Park', item: 'Phone', model: 'iPhone 15 Pro', date: 'Nov 14, 2023', status: 'Active' },
      { employee: 'Rachel Green', item: 'Headset', model: 'Bose QC45', date: 'Apr 08, 2024', status: 'Active' },
      { employee: 'Tom Baker', item: 'Laptop', model: 'MacBook Air M2', date: 'Feb 28, 2024', status: 'Active' },
      { employee: 'Alice Smith', item: 'Laptop', model: 'MacBook Pro 14"', date: 'May 15, 2024', status: 'Active' },
      { employee: 'Bob Johnson', item: 'Mouse', model: 'Logitech MX Master 3', date: 'Jun 01, 2024', status: 'Active' },
    ];
    const initialLicenses = [
      { employee: 'Jane Doe', software: 'Microsoft 365', key: 'M365-X89B-VYRA', expiry: 'Dec 31, 2026', status: 'Active' },
      { employee: 'Sarah Miller', software: 'Adobe Creative Cloud', key: 'ADBE-CC-2026', expiry: 'Jan 15, 2027', status: 'Active' },
      { employee: 'John Doe', software: 'Figma Enterprise', key: 'FIG-ENT-SSO', expiry: 'N/A', status: 'Active' },
      { employee: 'Michael Chen', software: 'Slack Enterprise', key: 'SLK-EMP-2026', expiry: 'Dec 01, 2026', status: 'Active' },
      { employee: 'Emily Brown', software: 'Zoom Pro', key: 'ZM-PR-445B', expiry: 'Jul 10, 2025', status: 'Active' },
      { employee: 'Alice Smith', software: 'GitHub Copilot', key: 'GH-COP-2025', expiry: 'Aug 22, 2025', status: 'Active' },
      { employee: 'Bob Johnson', software: 'PyCharm Pro', key: 'PY-JB-2026', expiry: 'Oct 30, 2026', status: 'Active' },
    ];

    const storedEquip = localStorage.getItem('all_equipment');
    const storedLicenses = localStorage.getItem('software_licenses');

    if (storedEquip) setEquipment(JSON.parse(storedEquip));
    else {
      setEquipment(initialEquip);
      localStorage.setItem('all_equipment', JSON.stringify(initialEquip));
    }

    if (storedLicenses) setLicenses(JSON.parse(storedLicenses));
    else {
      setLicenses(initialLicenses);
      localStorage.setItem('software_licenses', JSON.stringify(initialLicenses));
    }
  }, []);

  const handleReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const asset = (e.currentTarget.elements[0] as HTMLSelectElement).value;
    const userIdentifier = profile?.full_name || profile?.employeeId || profile?.employee_id || 'Jane Doe';
    
    // Update local status for the employee
    const updated = equipment.map(item => 
      item.employee === userIdentifier && item.item === asset.split(':')[1]?.trim() 
      ? { ...item, status: 'Repairing' } 
      : item
    );
    setEquipment(updated);
    localStorage.setItem('all_equipment', JSON.stringify(updated));

    setToast('Your issue has been reported. Asset status changed to Repairing.');
    setTimeout(() => setToast(''), 4000);
  };

  const handleAddHardware = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = { ...newHardware, status: 'Active' };
    const updated = [newRecord, ...equipment];
    setEquipment(updated);
    localStorage.setItem('all_equipment', JSON.stringify(updated));
    setShowHardwareModal(false);
    setNewHardware({ employee: '', item: '', model: '', date: new Date().toISOString().split('T')[0] });
    setToast(`${newRecord.item} provided to ${newRecord.employee} successfully!`);
    setTimeout(() => setToast(''), 4000);
  };

  const handleAddSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = { ...newSoftware, status: 'Active' };
    const updated = [newRecord, ...licenses];
    setLicenses(updated);
    localStorage.setItem('software_licenses', JSON.stringify(updated));
    setShowSoftwareModal(false);
    setNewSoftware({ employee: '', software: '', key: '', expiry: '' });
    setToast(`${newRecord.software} license provided to ${newRecord.employee} successfully!`);
    setTimeout(() => setToast(''), 4000);
  };

  const filteredEquip = equipment.filter(e => 
    e.employee.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLicenses = licenses.filter(l => 
    l.employee.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.software.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic user identifier for filtering personal view
  const userIdentifier = profile?.full_name || profile?.employeeId || profile?.employee_id || 'Jane Doe';
  const myEquipment = equipment.filter(e => e.employee === userIdentifier);
  const myLicenses = licenses.filter(l => l.employee === userIdentifier);

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500 pb-12">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <AlertCircle className="text-brand-teal" size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Hardware Provisioning Modal */}
      {showHardwareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2"><Laptop size={20}/> Provision Hardware</CardTitle>
              <button onClick={() => setShowHardwareModal(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddHardware} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name or ID</label>
                  <input type="text" required placeholder="e.g. VYR-2024-001 or John Smith" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                    value={newHardware.employee} onChange={e => setNewHardware({...newHardware, employee: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                    <input type="text" required placeholder="e.g. Laptop" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                      value={newHardware.item} onChange={e => setNewHardware({...newHardware, item: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Model</label>
                    <input type="text" required placeholder="e.g. Dell XPS 15" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                      value={newHardware.model} onChange={e => setNewHardware({...newHardware, model: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Date</label>
                  <input type="date" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                    value={newHardware.date} onChange={e => setNewHardware({...newHardware, date: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-brand-navy hover:bg-black mt-2">Provision Asset</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Software Provisioning Modal */}
      {showSoftwareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2"><KeyRound size={20}/> Assign License</CardTitle>
              <button onClick={() => setShowSoftwareModal(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddSoftware} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</label>
                  <input type="text" required placeholder="Employee Name" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                    value={newSoftware.employee} onChange={e => setNewSoftware({...newSoftware, employee: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Software Name</label>
                  <input type="text" required placeholder="e.g. IntelliJ IDEA" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                    value={newSoftware.software} onChange={e => setNewSoftware({...newSoftware, software: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">License Key</label>
                    <input type="text" required placeholder="Key or SSO" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                      value={newSoftware.key} onChange={e => setNewSoftware({...newSoftware, key: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</label>
                    <input type="text" required placeholder="e.g. Dec 2026" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" 
                      value={newSoftware.expiry} onChange={e => setNewSoftware({...newSoftware, expiry: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-brand-navy hover:bg-black mt-2">Provision License</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
          <MonitorPlay size={24} className="text-brand-teal" /> 
          {isAdmin ? 'Global Asset Inventory' : 'My Equipment & Assets'}
        </h2>
        {isAdmin && (
          <div className="relative w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by employee or asset..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'gap-10' : 'lg:grid-cols-2 gap-8'}`}>
        
        {/* Hardware Card */}
        <Card className="h-full border-t-4 border-t-brand-navy shadow-xl shadow-brand-navy/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Laptop size={20} className="text-brand-navy" /> {isAdmin ? 'Hardware Distributions' : 'Hardware Assigned'}</CardTitle>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowHardwareModal(true)} className="gap-2 bg-brand-teal hover:bg-brand-teal/90">
                <Plus size={16}/> Provide Asset to New User
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <tr>
                    {isAdmin && <th className="px-6 py-4">Employee</th>}
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Assigned Date</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(isAdmin ? filteredEquip : myEquipment).map((item, i) => (
                    <tr key={i} className="hover:bg-brand-teal/5 transition-colors group">
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                              {item.employee[0]}
                            </div>
                            <span className="font-bold text-brand-navy text-xs">{item.employee}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 font-semibold text-gray-700">{item.item}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{item.model}</td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-medium italic">{item.date}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={item.status === 'Active' ? 'green' : 'amber'} className="font-bold shadow-sm">
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(isAdmin ? filteredEquip : myEquipment).length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-400 italic">No asset records found matching your profile.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Software Licenses Card */}
        <Card className="h-full border-t-4 border-t-brand-teal shadow-xl shadow-brand-navy/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><KeyRound size={20} className="text-brand-teal" /> {isAdmin ? 'Master Software Licenses' : 'Software Licenses'}</CardTitle>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowSoftwareModal(true)} className="gap-2 bg-brand-navy hover:bg-black">
                <Plus size={16}/> Provide License to New User
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <tr>
                    {isAdmin && <th className="px-6 py-4">Employee</th>}
                    <th className="px-6 py-4">Software</th>
                    <th className="px-6 py-4">License Key</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(isAdmin ? filteredLicenses : myLicenses).map((license, i) => (
                    <tr key={i} className="hover:bg-brand-teal/5 transition-colors group">
                      {isAdmin && (
                        <td className="px-6 py-4">
                           <span className="font-bold text-brand-navy text-xs">{license.employee}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 font-semibold text-gray-700">{license.software}</td>
                      <td className="px-6 py-4 font-mono text-[10px] tracking-tighter text-gray-400 bg-gray-50/30 rounded px-2 py-1 mx-6 my-4 inline-block">
                        {isAdmin || showKey ? license.key : '••••-••••-••••'}
                        {!isAdmin && (
                          <button onClick={() => setShowKey(!showKey)} className="ml-1 text-gray-400 hover:text-brand-teal">
                            {showKey ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-medium">
                        {license.expiry}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={license.status === 'Active' ? 'green' : 'red'} className="font-bold shadow-sm">
                          {license.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(isAdmin ? filteredLicenses : myLicenses).length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-400 italic">No license records found matching your profile.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conditional Box 3 & 4 (Only for Employees) */}
        {!isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 col-span-2">
            <Card className="h-full border-t-4 border-t-brand-navy">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield size={18} /> Credentials & Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-gray-500">ID Card</span>
                  <span className="text-sm font-semibold">Active ({profile?.employeeId || profile?.employee_id || 'N/A'})</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-gray-500">Login ID</span>
                  <span className="text-sm font-semibold">{profile?.email || 'jane.doe@vyarahr.com'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-gray-500">System Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono tracking-wider">{showPwd ? 'Hunter*2026!' : '••••••••••••'}</span>
                    <button onClick={() => setShowPwd(!showPwd)} className="text-gray-400 hover:text-brand-teal">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-500">Building Badge</span>
                  <span className="text-sm font-semibold text-status-green items-center gap-1 flex"><CheckCircle size={14}/> Provisioned</span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full bg-gray-50 border-dashed border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600"><AlertCircle size={18} /> Report an Issue</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleReport}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal text-sm bg-white" required>
                      <option value="">-- Choose asset --</option>
                      {myEquipment.map((e, idx) => (
                        <option key={`hw-${idx}`} value={`Hardware: ${e.item}`}>Hardware: {e.item} ({e.model})</option>
                      ))}
                      {myLicenses.map((l, idx) => (
                        <option key={`sw-${idx}`} value={`Software: ${l.software}`}>Software: {l.software}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-brand-teal text-sm bg-white" required>
                      <option value="">-- Choose issue category --</option>
                      <option>Damaged / Broken</option>
                      <option>Not Working / Software Error</option>
                      <option>Lost / Stolen</option>
                      <option>Need Upgrade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Describe Issue</label>
                    <textarea rows={3} className="w-full border border-gray-300 bg-white rounded-md p-2 focus:ring-brand-teal resize-none text-sm" placeholder="Please provide details about what went wrong..." required></textarea>
                  </div>

                  <div className="pt-2">
                     <Button type="submit" className="w-full gap-2 bg-brand-navy hover:bg-black transition-all shadow-md"><Send size={16}/> Submit Report</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment;
