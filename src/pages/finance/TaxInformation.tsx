import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FileText, Download, CheckCircle, Upload, ShieldOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TaxInformation = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [toast, setToast] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDownload = (docName: string, year: string) => {
    const content = `VyaraHR Tax Document: ${docName} (${year})\nThis is a mock tax document for testing purposes.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${docName.replace(/\s+/g, '_')}_${year}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${docName} downloaded successfully!`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setUploading(false);
        showToast(`"${file.name}" uploaded successfully! ✓`);
        // Reset input so the same file can be selected again
        e.target.value = '';
      }, 2000);
    }
  };

  const taxDocuments = [
    { year: '2023-24', name: 'Form 16', date: 'June 15, 2024', status: 'Available' },
    { year: '2023-24', name: 'Investment Declaration', date: 'Jan 10, 2024', status: 'Verified' },
    { year: '2022-23', name: 'Form 16', date: 'June 12, 2023', status: 'Available' }
  ];

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full bg-brand-navy/5 flex items-center justify-center mb-6">
          <ShieldOff size={48} className="text-brand-navy opacity-20" />
        </div>
        <h2 className="text-3xl font-bold text-brand-navy mb-4">Tax Information Restricted</h2>
        <div className="max-w-md p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 text-left">
          <AlertCircle className="text-amber-600 mt-1 shrink-0" size={20} />
          <p className="text-amber-800 text-sm leading-relaxed">
            Personal tax Information dashboards are not applicable for Administrator accounts. To manage organization-wide tax settings, please visit the <strong>Cloud Portal</strong> or <strong>Subscription Management</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-24 right-8 bg-brand-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-brand-teal flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="text-brand-teal" size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-brand-navy">Tax Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tax Summary (FY 24-25)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Taxable Income</span>
              <span className="font-semibold text-brand-navy">₹ 1,240,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">TDS Deducted</span>
              <span className="font-semibold text-brand-navy">₹ 142,500</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">80C Investments</span>
              <span className="font-semibold text-brand-teal">₹ 150,000</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investment Declaration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 text-center mb-4 text-sm">Update your investment declarations for the current financial year to optimize your tax savings.</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            
            <button 
              onClick={handleUploadClick}
              disabled={uploading}
              className="bg-brand-navy text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-navy-light transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Upload size={16} className={uploading ? 'animate-bounce' : ''} />
              {uploading ? 'Uploading...' : 'Update Declaration'}
            </button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md border-b">
                <tr>
                  <th className="px-6 py-3">Financial Year</th>
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-6 py-3">Issued Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {taxDocuments.map((doc, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4 font-medium text-brand-navy">{doc.year}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doc.date}</td>
                    <td className="px-6 py-4">
                      <Badge variant="green">{doc.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDownload(doc.name, doc.year)}
                        className="text-brand-teal hover:text-brand-teal-dark flex items-center gap-1 font-medium transition-colors"
                      >
                        <Download size={14} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxInformation;
