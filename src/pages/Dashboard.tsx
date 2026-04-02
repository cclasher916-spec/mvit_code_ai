import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MemberTable from '../components/MemberTable';
import { getLatestByMember } from '../utils/dataProcessing';
import { ChevronRight, Building2, BrainCircuit, Database, Activity, AlertTriangle, TrendingUp, Bot, Trophy, ArrowRight, ShieldAlert } from 'lucide-react';

const Dashboard: React.FC = () => {

  const { data, hierarchy, loading } = useData();
  const [selectedDept, setSelectedDept] = useState<string>('AIML');
  const [viewMode, setViewMode] = useState<'intelligence' | 'data'>('intelligence');
  const [intelligenceFilter, setIntelligenceFilter] = useState<string | null>(null);

  // Filter logic
  const filtered = useMemo(() => {
    let base = (data || []).filter((d) => {
      if (!d) return false;
      const deptOk = !selectedDept || d.deptId === selectedDept;
      return deptOk;
    });

    if (intelligenceFilter === 'inactive') {
      base = base.filter(m => m.totalDailyIncrease === 0);
    } else if (intelligenceFilter === 'trial') {
      base = base.filter(m => m.leetcodeDailyIncrease > 5 && m.totalDailyIncrease < 2);
    } else if (intelligenceFilter === 'rapid') {
      base = base.filter(m => m.totalDailyIncrease >= 15);
    }

    return base;
  }, [data, selectedDept, intelligenceFilter]);

  const departments = hierarchy ? Object.keys(hierarchy) : [];
  
  // Heuristics for Intelligence Mode
  const latestData = useMemo(() => getLatestByMember(filtered || []), [filtered]);
  const baseLatest = useMemo(() => {
    const baseList = (data || []).filter((d) => {
      if (!d) return false;
      const deptOk = !selectedDept || d.deptId === selectedDept;
      return deptOk;
    });
    return getLatestByMember(baseList);
  }, [data, selectedDept]);

  const activeCount = latestData.filter(m => m.totalDailyIncrease > 0).length;
  const avgScore = latestData.length > 0 ? Math.round(latestData.reduce((acc, m) => acc + (m.totalSolved || 0), 0) / latestData.length) : 0;
  
  const inactiveStudents = baseLatest.filter(m => m.totalDailyIncrease === 0);
  const trialAndErrorCandidates = baseLatest.filter(m => m.leetcodeDailyIncrease > 5 && m.totalDailyIncrease < 2);
  const rapidImprovers = baseLatest.filter(m => m.totalDailyIncrease >= 15);
  
  const inactiveCount = inactiveStudents.length;
  const trialCount = trialAndErrorCandidates.length;
  const rapidCount = rapidImprovers.length;
  
  const topPerformers = [...baseLatest].sort((a,b) => (b.totalSolved || 0) - (a.totalSolved || 0)).slice(0, 5);


  const dynamicInterventions = useMemo(() => {
     const sortedByIncrease = [...baseLatest].sort((a,b) => (b.totalDailyIncrease || 0) - (a.totalDailyIncrease || 0));
     const sortedByRank = [...baseLatest].sort((a,b) => (b.totalSolved || 0) - (a.totalSolved || 0));
     
     const activities = [];
     
     if (sortedByIncrease[0] && sortedByIncrease[0].totalDailyIncrease > 0) {
        activities.push({
           id: sortedByIncrease[0].memberId,
           name: sortedByIncrease[0].memberName,
           action: `Solved +${sortedByIncrease[0].totalDailyIncrease} tasks today`,
           time: "Just Now"
        });
     }
     
     if (sortedByRank[0]) {
        activities.push({
           id: sortedByRank[0].memberId,
           name: sortedByRank[0].memberName,
           action: `Leading with ${sortedByRank[0].totalSolved} pts`,
           time: "Top Rank"
        });
     }
     
     const activeUsers = baseLatest.filter(m => m.totalDailyIncrease > 0 && m.memberId !== sortedByIncrease[0]?.memberId);
     if (activeUsers.length > 0) {
        activities.push({
           id: activeUsers[0].memberId,
           name: activeUsers[0].memberName,
           action: `Active participation detected`,
           time: "Active"
        });
     }
     
     return activities.length > 0 ? activities.slice(0, 3) : [
       { id: null, name: "System", action: "Evaluating paths...", time: "Live" }
     ];
  }, [baseLatest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-textMuted text-lg font-medium">Booting intelligence core...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-fade-in relative px-2 sm:px-0">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Search/Filter Controls Overhaul */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-3 sm:p-4 rounded-3xl border border-border transition-all">
         <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl border border-border w-full md:w-auto">
            <button 
               onClick={() => { setViewMode('intelligence'); setIntelligenceFilter(null); }} 
               className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${viewMode === 'intelligence' ? 'bg-brand-500 text-white shadow-xl' : 'text-textMuted hover:text-textMain'}`}
            >
               <BrainCircuit className="w-4 h-4" /> Intelligence
            </button>
            <button 
               onClick={() => setViewMode('data')} 
               className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${viewMode === 'data' ? 'bg-brand-500 text-white shadow-xl' : 'text-textMuted hover:text-textMain'}`}
            >
               <Database className="w-4 h-4" /> Data
            </button>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
               <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
               <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 text-textMain text-xs sm:text-sm font-bold w-full outline-none">
                 <option value="">System Wide</option>
                 {departments.map((id) => (
                   <option key={id} value={id}>{hierarchy?.[id]?.name || id}</option>
                 ))}
               </select>
               <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted rotate-90" />
            </div>
         </div>
      </div>

      {viewMode === 'intelligence' ? (
        <div className="space-y-6 sm:space-y-8">
           {/* Hero Section */}
           <div className="bg-gradient-to-br from-brand-600/20 via-surface to-background border border-brand-500/20 rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <BrainCircuit className="w-64 h-64 text-brand-500" />
              </div>
              <div className="relative z-10 text-center sm:text-left sm:max-w-2xl">
                 <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-brand-500 uppercase">Neural Network Active</span>
                 </div>
                 <h1 className="text-3xl sm:text-5xl font-black text-textMain tracking-tight leading-none mb-4">Autonomous Performance Oversight</h1>
                 <p className="text-sm sm:text-base text-textMuted font-medium leading-relaxed">Real-time surveillance of student learning tracks and cross-platform growth trajectories.</p>
              </div>
              
              <div className="relative z-10 flex gap-3 sm:gap-4 mt-8 overflow-x-auto pb-4 hide-scrollbar">
                 <div className="bg-surface/50 backdrop-blur-sm border border-border p-4 sm:p-5 rounded-2xl min-w-[120px] flex-1 text-center shadow-lg">
                    <div className="text-3xl sm:text-4xl font-black text-textMain">{baseLatest.length}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">Personnel</div>
                 </div>
                 <div className="bg-brand-500/10 backdrop-blur-sm border border-brand-500/20 p-4 sm:p-5 rounded-2xl min-w-[120px] flex-1 text-center shadow-lg">
                    <div className="text-3xl sm:text-4xl font-black text-brand-500">{activeCount}</div>
                    <div className="text-[10px] text-brand-500/70 uppercase font-bold tracking-widest mt-1">Active</div>
                 </div>
                 <div className="bg-surface/50 backdrop-blur-sm border border-border p-4 sm:p-5 rounded-2xl min-w-[120px] flex-1 text-center shadow-lg hidden sm:block">
                    <div className="text-3xl sm:text-4xl font-black text-textMain">{avgScore}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">Avg Score</div>
                 </div>
              </div>
           </div>

           {/* Mobile Insights Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <button 
                onClick={() => { setViewMode('data'); setIntelligenceFilter('inactive'); }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-red-500/50 hover:shadow-2xl transition-all group relative text-left"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                 </div>
                 <h3 className="text-3xl sm:text-4xl font-black text-red-500 mb-1">{inactiveCount}</h3>
                 <p className="text-[11px] text-textMuted uppercase font-extrabold tracking-widest">Cold Accounts</p>
                 <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-red-500/80 group-hover:translate-x-1 transition-transform">
                    RE-ENGAGE SYSTEM <ArrowRight className="w-3 h-3" />
                 </div>
              </button>
              
              <button 
                onClick={() => { setViewMode('data'); setIntelligenceFilter('trial'); }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-yellow-500/50 hover:shadow-2xl transition-all group relative text-left"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-12 h-12 text-yellow-500" />
                 </div>
                 <h3 className="text-3xl sm:text-4xl font-black text-yellow-500 mb-1">{trialCount}</h3>
                 <p className="text-[11px] text-textMuted uppercase font-extrabold tracking-widest">Efficiency Flags</p>
                 <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-yellow-500/80 group-hover:translate-x-1 transition-transform">
                    DIAGNOSE FRICTION <ArrowRight className="w-3 h-3" />
                 </div>
              </button>

              <button 
                onClick={() => { setViewMode('data'); setIntelligenceFilter('rapid'); }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-green-500/50 hover:shadow-2xl transition-all group relative text-left"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-12 h-12 text-green-500" />
                 </div>
                 <h3 className="text-3xl sm:text-4xl font-black text-green-500 mb-1">{rapidCount}</h3>
                 <p className="text-[11px] text-textMuted uppercase font-extrabold tracking-widest">Peak Velocity</p>
                 <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-green-500/80 group-hover:translate-x-1 transition-transform">
                    AMPLIFY MOMENTUM <ArrowRight className="w-3 h-3" />
                 </div>
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard Excerpt */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-[2rem] p-6 sm:p-8 shadow-soft">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-textMain flex items-center gap-3"><Trophy className="w-6 h-6 text-yellow-500" /> Elite Cadre</h3>
                    <Link to="/leaderboard" className="p-2 px-4 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all">Full View</Link>
                 </div>
                 
                 <div className="space-y-4">
                    {topPerformers.map((p, i) => (
                       <Link key={p.memberId} to={`/individual/${p.memberId}`} className="block group">
                          <div className="bg-background/50 hover:bg-white dark:hover:bg-brand-900/10 border border-transparent hover:border-brand-500/30 rounded-2xl p-4 flex items-center justify-between transition-all">
                             <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-surface text-textMuted'}`}>
                                   0{i + 1}
                                </div>
                                <div className="min-w-0">
                                   <div className="font-bold text-textMain group-hover:text-brand-500 transition-colors truncate text-base sm:text-lg">{p.memberName}</div>
                                   <div className="text-[10px] text-textMuted font-bold uppercase tracking-widest truncate">{p.teamId} • {p.sectionId}</div>
                                </div>
                             </div>
                             <div className="text-right shrink-0">
                                <span className="font-mono text-xl sm:text-2xl font-black text-textMain tracking-tighter">{p.totalSolved}</span>
                             </div>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>

              {/* Feed & Focus */}
              <div className="space-y-6 sm:space-y-8">
                 <div className="bg-surface border border-border rounded-[2rem] p-6 sm:p-8 shadow-soft relative overflow-hidden">
                    <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-[0.15em] text-[10px] mb-6"><ShieldAlert className="w-4 h-4" /> Priority Focus</div>
                    <div className="space-y-4">
                       {trialAndErrorCandidates.slice(0, 3).map(p => (
                          <Link key={p.memberId} to={`/individual/${p.memberId}`} className="flex justify-between items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10 hover:bg-red-500/10 hover:scale-[1.02] transition-all">
                             <div className="min-w-0">
                                <div className="text-sm font-bold text-textMain truncate">{p.memberName}</div>
                                <div className="text-[10px] text-red-500/80 font-black uppercase tracking-widest mt-0.5">Efficiency flag</div>
                             </div>
                             <ArrowRight className="w-4 h-4 text-red-500/50" />
                          </Link>
                       ))}
                    </div>
                 </div>

                 <div className="bg-surface border border-border rounded-[2rem] p-6 sm:p-8 shadow-soft">
                    <div className="flex items-center gap-2 text-brand-500 font-black uppercase tracking-[0.15em] text-[10px] mb-6"><Bot className="w-4 h-4" /> Neural Feed</div>
                    <div className="space-y-6">
                       {dynamicInterventions.map((action, i) => (
                          <div key={i} className="pl-4 border-l-2 border-brand-500/20 relative py-0.5">
                             <div className="absolute -left-1 top-2 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
                             <div className="text-[9px] text-textMuted uppercase font-extrabold tracking-widest mb-1">{action.time}</div>
                             <Link to={action.id ? `/individual/${action.id}` : '#'} className="text-xs font-semibold text-textMain hover:text-brand-500 transition-colors leading-relaxed block">
                                {action.action} <span className="text-brand-500 font-black">@ {action.name}</span>
                             </Link>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in px-minus-2">
           {intelligenceFilter && (
              <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/30 p-4 rounded-2xl mx-2 sm:mx-0">
                 <div className="flex items-center gap-3 text-brand-500 text-sm font-black uppercase tracking-widest">
                    <Activity className="w-4 h-4" /> 
                    {intelligenceFilter} filtered
                 </div>
                 <button onClick={() => setIntelligenceFilter(null)} className="px-3 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Reset</button>
              </div>
           )}
           <div className="bg-surface sm:rounded-3xl border sm:border border-border shadow-2xl overflow-hidden">
              <MemberTable data={filtered} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
