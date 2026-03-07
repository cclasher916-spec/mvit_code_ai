import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MemberGrid from '../components/MemberGrid';
import { ChevronRight, GraduationCap, Building2 } from 'lucide-react';

const BATCH_OPTIONS = ['2023-2027', '2024-2028', '2025-2029'];

const Dashboard: React.FC = () => {
  const { data, hierarchy, loading } = useData();
  const [selectedDept, setSelectedDept] = useState<string>('AIML');
  const [selectedBatch, setSelectedBatch] = useState<string>('2023-2027');

  // Filter by department and batch if present on member data
  const filtered = (data || []).filter((d) => {
    if (!d) return false;
    const deptOk = !selectedDept || d.deptId === selectedDept;
    const batchOk = !selectedBatch || (d as any).batch === selectedBatch || (d as any).assignedBatch === selectedBatch;
    return deptOk && batchOk;
  });

  const departments = hierarchy ? Object.keys(hierarchy) : [];
  const totalMembersCount = React.useMemo(() => new Set((data || []).map(d => d?.memberId).filter(Boolean)).size, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-textMuted text-lg font-medium">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <nav className="flex items-center space-x-2 text-sm text-textMuted bg-surface/50 w-fit px-4 py-2 rounded-full border border-border">
        <span className="font-semibold text-textMain flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400"></div> Dashboard
        </span>
        <ChevronRight className="h-4 w-4" />
        <Link to="/leaderboard" className="hover:text-brand-400 transition-colors">Go to Leaderboard</Link>
      </nav>

      {/* Hero Section */}
      <div className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-accent-purple/10 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Organization Overview</h1>
            <p className="text-textMuted max-w-xl">Monitor coding performance, identify top talent, and track progress across all departments and batches in real-time.</p>
          </div>

          <div className="flex gap-4 bg-surface/80 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="text-center px-4 border-r border-border/50">
              <div className="text-2xl font-display font-bold text-white">{totalMembersCount}</div>
              <div className="text-xs text-brand-400 font-medium uppercase tracking-wider mt-1">Total Members</div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-display font-bold text-white">{departments.length}</div>
              <div className="text-xs text-accent-purple font-medium uppercase tracking-wider mt-1">Departments</div>
            </div>
          </div>
        </div>
      </div>

      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-brand-500/30">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center text-xl font-display">
            <div className="p-2 rounded-lg bg-brand-500/10 mr-3">
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            Refine View
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-brand-400">
                <Building2 className="h-3.5 w-3.5 mr-2" />Department
              </label>
              <div className="relative">
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full appearance-none px-4 py-3 bg-white/5 border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-white transition-all cursor-pointer">
                  <option value="" className="bg-surface text-white">All Departments</option>
                  {departments.map((id) => (
                    <option key={id} value={id} className="bg-surface text-white">{hierarchy?.[id]?.name || id}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-textMuted group-focus-within:text-brand-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-accent-purple">
                <GraduationCap className="h-3.5 w-3.5 mr-2" />Batch
              </label>
              <div className="relative">
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="w-full appearance-none px-4 py-3 bg-white/5 border border-border rounded-xl focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/30 text-white transition-all cursor-pointer">
                  <option value="" className="bg-surface text-white">All Batches</option>
                  {BATCH_OPTIONS.map((b) => (
                    <option key={b} value={b} className="bg-surface text-white">{b}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-textMuted group-focus-within:text-accent-purple">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MemberGrid data={filtered} title={`Top Members ${selectedDept ? '• ' + selectedDept : ''} ${selectedBatch ? '• ' + selectedBatch : ''}`} />
    </div>
  );
};

export default Dashboard;
