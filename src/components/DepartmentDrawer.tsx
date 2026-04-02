import React, { useEffect } from 'react';
import { X, TrendingUp, Users, AlertTriangle, BookOpen, Activity, LayoutDashboard, Crown, Target } from 'lucide-react';

interface DepartmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  department: any | null; // DepartmentComparison structure
}

const DepartmentDrawer: React.FC<DepartmentDrawerProps> = ({ isOpen, onClose, department }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !department) return null;

  // Insight Generation Pipeline
  const generateInsights = () => {
    const alerts: React.ReactNode[] = [];
    const contribSorted = [...department.contributionDistribution].sort((a, b) => b.contribution - a.contribution);
    
    // Insight 1: Dominance Detection (e.g. 70% from top 2)
    if (contribSorted.length >= 2) {
       const top2Contrib = contribSorted[0].contribution + contribSorted[1].contribution;
       if (top2Contrib > 60) {
          alerts.push(<span key="1"><strong>{Math.round(top2Contrib)}%</strong> of aggregate operational performance is sustained entirely by the Top 2 squads.</span>);
       }
    }

    // Insight 2: Spread Awareness
    if (department.isImbalanced) {
       alerts.push(<span key="2" className="text-amber-500">Critical structural variance detected: significant <strong>{department.performanceSpread} pt</strong> gap between upper and lower squad tiers.</span>);
    }

    // Insight 3: Velocity Status
    if (department.trend > 100) {
       alerts.push(<span key="3" className="text-green-500">Massive structural velocity scale achieving <strong>+{department.trend}</strong> operations in the last 24h cycle.</span>);
    } else if (department.trend < 0) {
       alerts.push(<span key="4" className="text-red-500">Negative regressive trend detected. Immediate intervention advised.</span>);
    }

    if (alerts.length === 0) {
       alerts.push(<span key="5">Framework executing natively within expected operational bounds.</span>);
    }
    return alerts;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[600px] bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface sticky top-0 z-10 flex justify-between items-start">
          <div>
             <h2 className="text-3xl font-black text-textMain tracking-tight mb-1">{department.deptName}</h2>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-textMuted mt-2">
               <span className="px-2 py-0.5 border border-border rounded-full flex items-center gap-1"><LayoutDashboard className="w-3 h-3"/> Organization Macro-View</span>
             </div>
          </div>
          <button 
             onClick={onClose}
             className="p-2 bg-background hover:bg-border/50 text-textMuted hover:text-textMain rounded-full transition-colors border border-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 space-y-8 pb-12 animate-fade-in">
          
          {/* Executive Overview Row */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col items-center text-center">
                <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1.5"><Users className="w-3.5 h-3.5 text-brand-500"/> Total Roster</p>
                <p className="text-3xl font-mono font-black text-textMain">{department.totalMembers}</p>
             </div>
             <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-brand-500 rounded-full blur-xl group-hover:bg-brand-400 transition-colors w-16 h-16 pointer-events-none"></div>
                <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-500"/> Output Velocity</p>
                <p className={`text-3xl font-mono font-black ${department.trend > 0 ? 'text-green-500' : 'text-textMuted'}`}>
                   {department.trend > 0 ? `+${department.trend}` : '0'}
                </p>
             </div>
          </div>

          <div className="bg-brand-500/10 py-5 px-6 rounded-xl border border-brand-500/20 col-span-2 flex justify-between items-center group shadow-inner">
             <div>
                <p className="text-[10px] text-brand-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> Operations Complete</p>
                <p className="text-5xl font-mono font-black text-brand-600 dark:text-brand-400 mt-2">{department.totalSolved.toLocaleString()}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Mean Trajectory</p>
                <p className="text-3xl font-mono font-black text-textMain mt-1">{department.avgPerMember.toLocaleString()}</p>
             </div>
          </div>

          {/* AI Insights Generative Component */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <h3 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Synthesized Telemetrics
              </h3>
              <ul className="text-sm font-medium text-textMain space-y-3 leading-relaxed">
                 {generateInsights().map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-background border border-border p-3 rounded-lg shadow-inner">
                       <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0 block"></span>
                       <span>{insight}</span>
                    </li>
                 ))}
              </ul>
          </div>

          {/* Deep Dive Performance Spread */}
          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="text-sm border-b border-border pb-2 font-black text-textMain tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-500" /> Operational Spread Tracker
             </h3>
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:bg-green-500/10 hover:border-green-500/30">
                     <p className="text-[10px] uppercase font-black text-green-500 tracking-widest mb-2 flex items-center gap-1.5"><Crown className="w-3 h-3"/> Alpha Variant</p>
                     <p className="font-bold text-sm text-textMain truncate leading-none mb-1">{department.topTeam ? department.topTeam.name : 'N/A'}</p>
                     <p className="text-xl font-mono font-black text-green-600 dark:text-green-400 mt-2">{department.topTeam ? department.topTeam.avg : 0} <span className="text-[10px] text-green-500/50">avg</span></p>
                 </div>
                 <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:bg-red-500/10 hover:border-red-500/30">
                     <p className="text-[10px] uppercase font-black text-red-500 tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3"/> Base Variant</p>
                     <p className="font-bold text-sm text-textMain truncate leading-none mb-1">{department.weakestTeam ? department.weakestTeam.name : 'N/A'}</p>
                     <p className="text-xl font-mono font-black text-red-600 dark:text-red-400 mt-2">{department.weakestTeam ? department.weakestTeam.avg : 0} <span className="text-[10px] text-red-500/50">avg</span></p>
                 </div>
             </div>
             {department.isImbalanced && (
                <div className="w-full h-1 bg-gradient-to-r from-green-500 to-red-500 rounded-full mt-4 shadow-[0_0_10px_rgba(239,68,68,0.2)]"></div>
             )}
          </div>

          {/* Contribution Matrix */}
          <div className="space-y-4 pt-6">
             <h3 className="text-sm font-black text-textMain tracking-widest flex justify-between items-center mb-4">
                <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-brand-500" /> Distribution Matrix</span>
                <span className="text-[10px] text-textMuted bg-surface px-2 py-0.5 rounded-full border border-border">Total Solved / Volume</span>
             </h3>
             <div className="space-y-3">
                 {[...department.contributionDistribution].sort((a, b) => b.contribution - a.contribution).map((t, index) => (
                    <div key={t.teamId} className="flex justify-between items-center bg-surface border border-border rounded-xl p-4 hover:border-brand-500/30 transition-colors shadow-sm relative overflow-hidden group">
                       <div className="absolute left-0 top-0 bottom-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors w-full" style={{ transform: `scaleX(${t.contribution / 100})`, transformOrigin: 'left', zIndex: 0 }}></div>
                       
                       <div className="relative z-10 flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <span className={`font-mono text-xs font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : 'text-textMuted'}`}>{index + 1}.</span>
                          <div className="min-w-0 flex-1">
                             <p className="text-sm font-bold text-textMain truncate">{t.teamName}</p>
                             <p className="text-[10px] font-mono text-textMuted">{t.totalSolved.toLocaleString()} solved</p>
                          </div>
                          
                       </div>
                       
                       <div className="relative z-10 text-right shrink-0">
                          <p className="text-base font-black font-mono text-brand-500 leading-none mb-1">{Math.round(t.contribution)}%</p>
                          <p className="text-[10px] font-bold text-textMuted uppercase">{t.avgPerMember} avg per sec</p>
                       </div>
                    </div>
                 ))}
             </div>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default DepartmentDrawer;
