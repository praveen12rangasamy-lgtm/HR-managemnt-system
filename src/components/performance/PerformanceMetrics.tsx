import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { Star, TrendingUp, TrendingDown, Plus, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PerformanceMetrics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        avgRating: 0.0,
        topCount: 0,
        lowCount: 0
    });
    const [deptPerformance, setDeptPerformance] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    const [lowPerformers, setLowPerformers] = useState<any[]>([]);
    
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, department, performance_score');

            if (error) throw error;

            if (profiles) {
                // Normalize scores to 0-5 for UI consistency
                const scores = profiles.map(p => ({
                    ...p,
                    rating: (p.performance_score / 20).toFixed(1)
                }));

                const totalRating = scores.reduce((sum, p) => sum + parseFloat(p.rating), 0);
                const avg = totalRating / (profiles.length || 1);

                setStats({
                    avgRating: parseFloat(avg.toFixed(1)),
                    topCount: scores.filter(p => parseFloat(p.rating) >= 4.5).length,
                    lowCount: scores.filter(p => parseFloat(p.rating) < 3.0).length
                });

                // Dept Breakdown
                const depts: Record<string, { total: number; count: number }> = {};
                scores.forEach(p => {
                    const d = p.department || 'Unassigned';
                    if (!depts[d]) depts[d] = { total: 0, count: 0 };
                    depts[d].total += parseFloat(p.rating);
                    depts[d].count += 1;
                });
                setDeptPerformance(Object.entries(depts).map(([name, data]) => ({
                    name,
                    rating: parseFloat((data.total / data.count).toFixed(1))
                })));

                // Trend (Mock historical for visual flow)
                setTrendData([
                    { month: 'Apr', rating: (avg * 0.95).toFixed(1) },
                    { month: 'May', rating: (avg * 0.98).toFixed(1) },
                    { month: 'Current', rating: avg.toFixed(1) }
                ]);

                // Lists
                setTopPerformers(scores.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 5));
                setLowPerformers(scores.filter(p => parseFloat(p.rating) < 3.5).slice(0, 3));
            }
        } catch (err) {
            console.error('Error fetching performance:', err);
        } finally {
            setLoading(false);
        }
    };

    const openBonusModal = (emp: any) => {
        setSelectedEmployee(emp);
        setShowBonusModal(true);
    };

    const openReviewModal = (emp: any) => {
        setSelectedEmployee(emp);
        setShowReviewModal(true);
    };

    const handleAssignBonus = async (amount: number) => {
        // Logic for assigning bonus (e.g. updating profile or bonus table)
        setShowBonusModal(false);
    };

    if (loading) {
        return (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-teal" size={48} />
          </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-brand-teal bg-brand-card shadow-xl overflow-hidden group">
                    <CardContent className="p-7 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Entity Quality Quotient</p>
                            <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
                                {stats.avgRating} 
                                <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">INDEX / 5.0</span>
                            </h3>
                        </div>
                        <div className="p-5 bg-brand-teal/5 text-brand-teal rounded-3xl group-hover:bg-brand-teal/10 transition-colors">
                            <Star size={28} fill="currentColor" stroke="none" className="animate-pulse" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 bg-brand-card shadow-xl overflow-hidden group">
                    <CardContent className="p-7 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Exceptional Assets</p>
                            <h3 className="text-4xl font-black text-white">{stats.topCount}</h3>
                        </div>
                        <div className="p-5 bg-emerald-500/5 text-emerald-500 rounded-3xl group-hover:bg-emerald-500/10 transition-colors">
                            <TrendingUp size={28} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-status-amber bg-brand-card shadow-xl overflow-hidden group">
                    <CardContent className="p-7 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Critical Deficiencies</p>
                            <h3 className="text-4xl font-black text-white">{stats.lowCount}</h3>
                        </div>
                        <div className="p-5 bg-status-amber/5 text-status-amber rounded-3xl group-hover:bg-status-amber/10 transition-colors">
                            <TrendingDown size={28} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-brand-card border-white/5 shadow-2xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-3">
                           <TrendingUp className="text-brand-teal" size={20}/> Macro Efficiency Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] px-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#4b5563" fontSize={11} fontStyle="italic" />
                                <YAxis stroke="#4b5563" fontSize={11} domain={[0, 5]} hide />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0A121E', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                                />
                                <Line type="stepAfter" dataKey="rating" stroke="#00dfc0" strokeWidth={5} dot={{ r: 6, fill: '#0A121E', stroke: '#00dfc0', strokeWidth: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-brand-card border-white/5 shadow-2xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <AlertCircle className="text-brand-teal" size={20}/> Division Competency Matrix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] px-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptPerformance} barGap={12}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontStyle="italic" />
                                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 5]} hide />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                    contentStyle={{ backgroundColor: '#0A121E', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                                />
                                <Bar dataKey="rating" radius={[8, 8, 0, 0]} barSize={25}>
                                    {deptPerformance.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={parseFloat(entry.rating) >= 4.0 ? '#00dfc0' : parseFloat(entry.rating) >= 3.0 ? '#fbbf24' : '#ef4444'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <Card className="bg-brand-card border-white/5 border-t-2 border-t-brand-teal/30 shadow-2xl overflow-hidden">
                    <CardHeader className="bg-white/5 p-8 flex justify-between items-center">
                        <div>
                            <CardTitle className="text-white text-xl font-black uppercase tracking-tighter">Velocity Leaderboard</CardTitle>
                            <p className="text-[10px] text-brand-teal font-black uppercase tracking-widest mt-1">Top-Tier Contributor Ranking</p>
                        </div>
                        <Badge variant="amber" className="border-brand-teal/30 text-brand-teal font-black text-[10px] uppercase px-4 py-1.5 h-auto">Live Rankings</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[10px] text-gray-500 uppercase bg-black/20 font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6">Human Capital</th>
                                        <th className="px-8 py-6">Execution Domain</th>
                                        <th className="px-8 py-6">IQ Score</th>
                                        <th className="px-8 py-6 text-right">Administrative Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-400">
                                    {topPerformers.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="w-9 h-9 bg-brand-teal/10 rounded-xl flex items-center justify-center font-black text-brand-teal shadow-inner">#{i+1}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-white group-hover:text-brand-teal transition-colors uppercase tracking-tight">{row.full_name}</div>
                                                <div className="text-[9px] text-gray-600 font-bold uppercase mt-0.5 tracking-tighter">Certified Contributor</div>
                                            </td>
                                            <td className="px-8 py-6 font-bold uppercase text-[10px] tracking-widest opacity-60">{row.department}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-1.5 text-brand-teal font-black text-sm">
                                                    <Star size={14} fill="currentColor" stroke="none" /> {row.rating}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button 
                                                    size="sm" 
                                                    className="h-10 text-[9px] font-black bg-brand-teal hover:bg-white text-navy border-none transition-all px-6 rounded-xl uppercase tracking-widest shadow-lg shadow-brand-teal/5 hover:shadow-brand-teal/20"
                                                    onClick={() => openBonusModal(row)}
                                                >
                                                    Incentivize
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {topPerformers.length === 0 && (
                                        <tr><td colSpan={5} className="py-16 text-center text-gray-600 font-bold italic">No performance vectors currently tracking above baseline.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {lowPerformers.length > 0 && (
                    <Card className="bg-brand-card border-none border-t-2 border-t-red-500/20 shadow-2xl overflow-hidden opacity-90 grayscale hover:grayscale-0 transition-all duration-500">
                        <CardHeader className="bg-red-500/5 p-8 flex justify-between items-center">
                            <div>
                                <CardTitle className="text-red-400 text-xl font-black uppercase tracking-tighter">Optimization Queue</CardTitle>
                                <p className="text-[10px] text-red-500/50 font-black uppercase tracking-widest mt-1">Sub-Threshold Performance Vector</p>
                            </div>
                            <Badge variant="red" className="bg-red-500/10 text-red-500 border-none font-black text-[10px] uppercase px-4 animate-pulse">Action Required</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[10px] text-red-900/50 uppercase bg-red-900/10 font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Target Identity</th>
                                            <th className="px-8 py-6">Department</th>
                                            <th className="px-8 py-6">Delta Metric</th>
                                            <th className="px-8 py-6 text-right">Intervention Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-400">
                                        {lowPerformers.map((row, i) => (
                                            <tr key={i} className="hover:bg-red-500/5 transition-colors">
                                                <td className="px-8 py-6 font-black text-white uppercase">{row.full_name}</td>
                                                <td className="px-8 py-6 font-bold uppercase text-[10px] tracking-widest opacity-40">{row.department}</td>
                                                <td className="px-8 py-6 text-red-500 font-black">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingDown size={14} /> {row.rating}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-10 text-[9px] font-black border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all px-6 rounded-xl uppercase tracking-widest"
                                                        onClick={() => openReviewModal(row)}
                                                    >
                                                        Protocol Invoke
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modals - Simplified for MVP Persistence */}
            {showBonusModal && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-2xl z-[2000] flex items-center justify-center p-6">
                    <Card className="w-full max-w-sm bg-brand-card border-brand-teal/20 shadow-[0_0_100px_rgba(0,223,192,0.1)] overflow-hidden scale-in-center">
                        <div className="h-2 bg-gradient-to-r from-brand-teal to-blue-500"></div>
                        <CardHeader className="p-8">
                            <CardTitle className="text-white text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Plus size={24} className="text-brand-teal" /> Incentivize Asset
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-0">
                            <p className="text-sm text-gray-400 font-medium leading-relaxed italic border-l-2 border-brand-teal pl-4">Allocation of performance bonus for <span className="text-white font-black underline decoration-brand-teal decoration-2 italic uppercase">{selectedEmployee?.full_name}</span> has been initiated.</p>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest">Incentive Quantum (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 50000" 
                                    className="w-full bg-navy/50 border-2 border-white/5 p-4 rounded-2xl text-white font-black outline-none focus:border-brand-teal transition-all text-lg"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button className="flex-1 bg-brand-teal hover:bg-white text-navy font-black h-14 rounded-2xl shadow-2xl transition-all uppercase tracking-widest text-xs" onClick={() => handleAssignBonus(0)}>Finalize</Button>
                                <Button variant="outline" className="px-8 border-white/5 text-gray-500 h-14 rounded-2xl hover:bg-white/5 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowBonusModal(false)}>Abort</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showReviewModal && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-2xl z-[2000] flex items-center justify-center p-6">
                    <Card className="w-full max-w-sm bg-brand-card border-red-500/20 shadow-2xl scale-in-center">
                        <div className="h-2 bg-red-500"></div>
                        <CardHeader className="p-8">
                            <CardTitle className="text-white text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Calendar size={24} className="text-red-500" /> Intervention Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-0">
                            <p className="text-sm text-gray-400 font-medium border-l-2 border-red-500 pl-4 italic">Scheduling a mandatory recalibration session for <span className="text-white font-black uppercase">{selectedEmployee?.full_name}</span>.</p>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Temporal Coordinates (Date)</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-navy/50 border-2 border-white/5 p-4 rounded-2xl text-white font-black outline-none focus:border-red-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black h-14 rounded-2xl shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest text-xs" onClick={() => setShowReviewModal(false)}>Confirm</Button>
                                <Button variant="outline" className="px-8 border-white/5 text-gray-500 h-14 rounded-2xl hover:bg-white/5 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowReviewModal(false)}>Dismiss</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PerformanceMetrics;
