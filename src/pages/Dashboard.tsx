import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MemberTable from '../components/MemberTable';
import { getLatestByMember } from '../utils/dataProcessing';
import { ChevronRight, GraduationCap, Building2, BrainCircuit, Database, Activity, AlertTriangle, TrendingUp, Bot, Trophy, ArrowRight, ShieldAlert } from 'lucide-react';

const BATCH_OPTIONS = ['2023-2027', '2024-2028', '2025-2029'];

const Dashboard: React.FC = () => {
  const { data, hierarchy, loading } = useData();
  const [selectedDept, setSelectedDept] = useState<string>('AIML');
  const [selectedBatch, setSelectedBatch] = useState<string>('2023-2027');
  const [viewMode, setViewMode] = useState<'intelligence' | 'data'>('intelligence');

  // Filter logic
  const filtered = useMemo(() => {
    return (data || []).filter((d) => {
      if (!d) return false;
      const deptOk = !selectedDept || d.deptId === selectedDept;
      const batchOk = !selectedBatch || (d as any).batch === selectedBatch || (d as any).assignedBatch === selectedBatch;
      return deptOk && batchOk;
    });
  }, [data, selectedDept, selectedBatch]);

  const departments = hierarchy ? Object.keys(hierarchy) : [];
  
  // Heuristics for Intelligence Mode
  const latestData = useMemo(() => getLatestByMember(filtered || []), [filtered]);
  
  const activeCount = latestData.filter(m => m.totalDailyIncrease > 0).length;
  const avgScore = latestData.length > 0 ? Math.round(latestData.reduce((acc, m) => acc + (m.totalSolved || 0), 0) / latestData.length) : 0;
  
  // Fast signals
  const inactiveStudents = latestData.filter(m => m.totalDailyIncrease === 0).slice(0, 12);
  const trialAndErrorCandidates = latestData.filter(m => m.leetcodeDailyIncrease > 5 && m.totalDailyIncrease < 2).slice(0, 8);
  const rapidImprovers = latestData.filter(m => m.totalDailyIncrease >= 15).slice(0, 5);
  
  const topPerformers = [...latestData].sort((a,b) => (b.totalSolved || 0) - (a.totalSolved || 0)).slice(0, 5);

  const dynamicInterventions = useMemo(() => {
     const sortedByIncrease = [...latestData].sort((a,b) => (b.totalDailyIncrease || 0) - (a.totalDailyIncrease || 0));
     const sortedByRank = [...latestData].sort((a,b) => (b.totalSolved || 0) - (a.totalSolved || 0));
     
     const activities = [];
     
     if (sortedByIncrease[0] && sortedByIncrease[0].totalDailyIncrease > 0) {
        activities.push({
           name: sortedByIncrease[0].memberName,
           action: `Stood out today solving +${sortedByIncrease[0].totalDailyIncrease} tasks`,
           time: "Recently Active"
        });
     }
     
     if (sortedByRank[0]) {
        activities.push({
           name: sortedByRank[0].memberName,
           action: `Maintaining Top Platform Leadership at ${sortedByRank[0].totalSolved} pts`,
           time: "Consistent"
        });
     }
     
     const activeUsers = latestData.filter(m => m.totalDailyIncrease > 0 && m.memberId !== sortedByIncrease[0]?.memberId);
     if (activeUsers.length > 0) {
        activities.push({
           name: activeUsers[0].memberName,
           action: `Demonstrating active engagement across platforms`,
           time: "Active Tracker"
        });
     }
     
     return activities.length > 0 ? activities.slice(0, 3) : [
       { name: "System", action: "Evaluating user learning paths...", time: "Just now" }
     ];
  }, [latestData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-textMuted text-lg font-medium">Loading intelligence core...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Top Refine View & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-2xl border border-border shadow-soft">
         <div className="flex items-center gap-3 bg-background p-1.5 rounded-xl border border-border">
            <button 
               onClick={() => setViewMode('intelligence')} 
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'intelligence' ? 'bg-brand-500 text-white shadow-md' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
            >
               <BrainCircuit className="w-4 h-4" /> Intelligence View
            </button>
            <button 
               onClick={() => setViewMode('data')} 
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'data' ? 'bg-brand-500 text-white shadow-md' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
            >
               <Database className="w-4 h-4" /> Full Data View
            </button>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group">
               <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
               <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="appearance-none pl-9 pr-10 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 text-textMain transition-all cursor-pointer text-sm font-bold w-full md:w-auto outline-none">
                 <option value="" className="bg-surface">System Wide</option>
                 {departments.map((id) => (
                   <option key={id} value={id} className="bg-surface">{hierarchy?.[id]?.name || id}</option>
                 ))}
               </select>
               <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none rotate-90" />
            </div>
            
            <div className="relative group hidden sm:block">
               <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
               <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="appearance-none pl-9 pr-10 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 text-textMain transition-all cursor-pointer text-sm font-bold w-full md:w-auto outline-none">
                 <option value="" className="bg-surface">All Batches</option>
                 {BATCH_OPTIONS.map((b) => (
                   <option key={b} value={b} className="bg-surface">{b}</option>
                 ))}
               </select>
               <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none rotate-90" />
            </div>
         </div>
      </div>

      {viewMode === 'intelligence' ? (
        <div className="space-y-6 animate-fade-in">
           {/* Section 1: System Status */}
           <div className="bg-gradient-to-r from-brand-600/20 to-surface border border-brand-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <BrainCircuit className="w-64 h-64 text-brand-500" />
              </div>
              <div className="relative z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                    <h2 className="text-sm font-bold tracking-widest text-brand-500 uppercase">System Status</h2>
                 </div>
                 <h1 className="text-3xl md:text-4xl font-black text-textMain tracking-tight">Autonomous Learning Intelligence Active</h1>
                 <p className="text-textMuted mt-2 max-w-lg">The background agent is currently monitoring learning paths and user trajectories.</p>
              </div>
              
              <div className="relative z-10 flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                 <div className="bg-surface border border-border p-4 rounded-xl min-w-[120px] shrink-0 text-center shadow-md">
                    <div className="text-3xl font-black text-textMain">{latestData.length}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">Total Members</div>
                 </div>
                 <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl min-w-[120px] shrink-0 text-center shadow-md">
                    <div className="text-3xl font-black text-brand-500">{activeCount}</div>
                    <div className="text-[10px] text-brand-500/70 uppercase font-bold tracking-widest mt-1">Active Users</div>
                 </div>
                 <div className="bg-surface border border-border p-4 rounded-xl min-w-[120px] shrink-0 text-center shadow-md">
                    <div className="text-3xl font-black text-textMain">{avgScore}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">Avg Score</div>
                 </div>
              </div>
           </div>

           {/* Section 2: AI Insights */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                 <AlertTriangle className="w-6 h-6 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                 <h3 className="text-3xl font-black text-textMain mb-1"><span className="text-red-500">{inactiveStudents.length}</span> Users</h3>
                 <p className="text-sm text-textMuted font-medium">Inactive &gt; 3 days</p>
              </div>
              
              <div className="bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
                 <Activity className="w-6 h-6 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                 <h3 className="text-3xl font-black text-textMain mb-1"><span className="text-yellow-500">{trialAndErrorCandidates.length}</span> Users</h3>
                 <p className="text-sm text-textMuted font-medium">Showing trial-and-error signals</p>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                 <TrendingUp className="w-6 h-6 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                 <h3 className="text-3xl font-black text-textMain mb-1"><span className="text-green-500">{rapidImprovers.length}</span> Users</h3>
                 <p className="text-sm text-textMuted font-medium">Improving rapidly this week</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Section 3: Top Performers (Takes up 2 columns) */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-soft">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-textMain flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Platform Leaders</h3>
                    <Link to="/leaderboard" className="text-xs font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider flex items-center gap-1">Full Leaderboard <ArrowRight className="w-3 h-3" /></Link>
                 </div>
                 
                 <div className="space-y-3">
                    {topPerformers.map((p, i) => (
                       <Link key={p.memberId} to={`/individual/${p.memberId}`} className="block">
                         <div className="bg-background hover:bg-border/30 border border-border rounded-xl p-3 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${i === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : i === 1 ? 'bg-slate-300/20 text-slate-500 dark:text-slate-300' : i === 2 ? 'bg-amber-600/20 text-amber-700 dark:text-amber-500' : 'bg-border/50 text-textMuted'}`}>
                                  #{i + 1}
                               </div>
                               <div>
                                  <div className="font-bold text-textMain">{p.memberName}</div>
                                  <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider">{p.teamId} • {p.sectionId}</div>
                               </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                               <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.totalSolved > 500 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : p.totalSolved > 200 ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'}`}>
                                  {p.totalSolved > 500 ? 'Advanced' : p.totalSolved > 200 ? 'Intermediate' : 'Beginner'}
                               </span>
                               <span className="font-mono text-lg font-black text-textMain w-16 text-right">{p.totalSolved}</span>
                            </div>
                         </div>
                       </Link>
                    ))}
                 </div>
              </div>

              {/* Section 4 & 5 Stacked */}
              <div className="space-y-6">
                 {/* Needs Attention */}
                 <div className="bg-surface border border-border rounded-2xl p-6 shadow-soft">
                    <h3 className="text-sm font-bold text-red-500 flex items-center gap-2 uppercase tracking-wider mb-4"><ShieldAlert className="w-4 h-4" /> Requires Attention</h3>
                    <div className="space-y-3">
                       {trialAndErrorCandidates.slice(0, 3).map(p => (
                          <div key={p.memberId} className="flex justify-between items-center p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                             <div>
                                <div className="text-sm font-bold text-textMain">{p.memberName}</div>
                                <div className="text-[10px] text-red-500/80 font-bold uppercase tracking-wider">Low Efficiency Flag</div>
                             </div>
                             <Link to={`/individual/${p.memberId}`} className="text-[10px] font-bold bg-background hover:bg-border/50 text-textMain px-3 py-1.5 rounded transition-colors uppercase tracking-wider border border-border">Analyze</Link>
                          </div>
                       ))}
                       {trialAndErrorCandidates.length === 0 && (
                          <div className="text-[11px] font-medium text-textMuted italic">No prominent risk flags detected today.</div>
                       )}
                    </div>
                 </div>

                 {/* Recent System Insights (Dynamic) */}
                 <div className="bg-surface border border-border rounded-2xl p-6 shadow-soft">
                    <h3 className="text-sm font-bold text-brand-500 flex items-center gap-2 uppercase tracking-wider mb-4"><Bot className="w-4 h-4" /> System Watch</h3>
                    <div className="space-y-4">
                       {dynamicInterventions.map((action, i) => (
                          <div key={i} className="border-l-2 border-brand-500/30 pl-3 py-1 relative">
                             <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-brand-500"></div>
                             <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-0.5">{action.time}</div>
                             <div className="text-xs font-medium text-textMain">{action.action} <span className="font-bold ml-1 text-brand-600 dark:text-brand-400">→ {action.name}</span></div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <MemberTable data={filtered} />
      )}
    </div>
  );
};

export default Dashboard;
