import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EmployeeOverview from '../../components/performance/EmployeeOverview';
import AttendanceAnalytics from '../../components/performance/AttendanceAnalytics';
import LeaveAnalytics from '../../components/performance/LeaveAnalytics';
import PayrollSummary from '../../components/performance/PayrollSummary';
import PerformanceMetrics from '../../components/performance/PerformanceMetrics';
import { Layout, Users, Calendar, Clock, DollarSign, Star, TrendingUp, Lock } from 'lucide-react';

const Performance = () => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const navigate = useNavigate();
    
    // Sub-tabs for "Company Performance"
    const [companySubTab, setCompanySubTab] = useState('Employee Overview');

    const companyTabs = [
        { name: 'Employee Overview', icon: Users },
        { name: 'Attendance Analytics', icon: Clock },
        { name: 'Leave Analytics', icon: Calendar },
        { name: 'Payroll Summary', icon: DollarSign },
        { name: 'Performance Metrics', icon: Star },
    ];

    useEffect(() => {
        // Redirection for non-admins
        if (!isAdmin) {
            navigate('/dashboard');
        }

        // Auto-logout/Session Management for Performance Dashboard (30 mins inactivity)
        let timeoutId: any;
        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.warn('Session expired due to inactivity on Performance Tab');
                navigate('/dashboard');
            }, 30 * 60 * 1000); // 30 minutes
        };

        if (isAdmin) {
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keydown', resetTimer);
            resetTimer();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
        };
    }, [isAdmin, navigate]);

    const renderCompanyContent = () => {
        switch (companySubTab) {
            case 'Employee Overview': return <EmployeeOverview />;
            case 'Attendance Analytics': return <AttendanceAnalytics />;
            case 'Leave Analytics': return <LeaveAnalytics />;
            case 'Payroll Summary': return <PayrollSummary />;
            case 'Performance Metrics': return <PerformanceMetrics />;
            default: return <EmployeeOverview />;
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1 px-3 bg-brand-teal/10 text-brand-teal rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-teal/20 flex items-center gap-1">
                            <Lock size={10} /> Admin Only
                        </div>
                        <h2 className="text-3xl font-bold text-white">Company Performance Dashboard</h2>
                    </div>
                    <p className="text-gray-500 font-medium">Holistic real-time analytics for Vyara HR system.</p>
                </div>
            </header>

            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-brand-card p-2 rounded-2xl flex flex-wrap gap-2 border border-white/5 shadow-2xl">
                    {companyTabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setCompanySubTab(tab.name)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm
                                ${companySubTab === tab.name 
                                    ? 'bg-brand-teal text-navy shadow-xl shadow-brand-teal/10 scale-105' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
                            `}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </button>
                    ))}
                </div>
                <div className="mt-4 transition-all duration-500">
                    {renderCompanyContent()}
                </div>
            </div>
        </div>
    );
};

export default Performance;
