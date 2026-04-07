import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, AlertTriangle, Crown, Activity } from 'lucide-react';
import PerformanceBar from './ui/PerformanceBar';

interface DepartmentCardProps {
  department: any; // Mapped to the DepartmentComparison interface from dataProcessing
  onClick: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, onClick }) => {
  let StatusBadge = <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-border text-textMuted">N/A</span>;
  let shadowGlow = 'hover:border-border/50';

  if (department.status === 'Elite') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">🔥 Elite Readiness</span>;
    shadowGlow = 'hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]';
  } else if (department.status === 'Good') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 shadow-[0_0_10px_rgba(14,165,233,0.1)]">⚡ Growth Track</span>;
    shadowGlow = 'hover:border-brand-500/40 hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]';
  } else if (department.status === 'Risk') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]">⚠️ Attention</span>;
    shadowGlow = 'hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]';
  }

  return (
    <div 
       className={`bg-surface border border-border rounded-2xl p-4 sm:p-5 transition-all group flex flex-col justify-between overflow-hidden relative ${shadowGlow}`}
    >
      {/* Header: Identity */}
      <div 
        onClick={onClick}
        className="flex justify-between items-start mb-4 cursor-pointer"
      >
        <div className="min-w-0 pr-2">
           <h3 className="text-lg sm:text-xl font-black text-textMain tracking-tight group-hover:text-brand-500 transition-colors truncate">
              {department.deptName}
           </h3>
           <div className="flex items-center gap-2 mt-1 text-[9px] sm:text-[10px] font-bold text-textMuted uppercase tracking-wider">
              <span className="flex items-center gap-1 shrink-0"><Building2 className="w-3 h-3"/> {department.totalTeams}</span>
              <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
              <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3"/> {department.totalMembers}</span>
           </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {StatusBadge}
          {department.isImbalanced && (
            <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Gap
            </span>
          )}
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 relative z-10">
         <div className="bg-background border border-border rounded-xl p-3 shadow-inner text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Total Solved</p>
            <p className="text-lg sm:text-xl font-mono font-black text-brand-500">{department.totalSolved.toLocaleString()}</p>
         </div>
         <div className="bg-background border border-border rounded-xl p-3 shadow-inner text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1 flex items-center justify-between">
               Avg
               {department.trend > 0 && <span className="text-green-500 text-[9px] flex items-center shrink-0">+{department.trend}</span>}
            </p>
            <p className="text-lg sm:text-xl font-mono font-black text-textMain">{department.avgPerMember.toLocaleString()}</p>
         </div>
      </div>

      {/* Visual Indicator */}
      <div className="mb-6 bg-background/50 rounded-xl p-3 border border-border/50">
         <p className="text-[9px] text-textMuted uppercase font-black tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3 text-brand-500"/> Performance Velocity</p>
         <PerformanceBar value={department.avgPerMember} maxValue={800} />
      </div>

      {/* Intelligence Callouts */}
      <div className="space-y-2 pt-4 border-t border-border">
         <p className="text-[9px] text-brand-500 uppercase font-black tracking-widest mb-1">Department Insights</p>
         
         {department.topTeam ? (
            <Link to={`/team/${department.deptId}/${department.topTeam.sectionId}/${department.topTeam.id}`} className="flex justify-between items-center bg-green-500/5 px-3 py-2 rounded-lg border border-green-500/10 hover:bg-green-500/10 transition-colors group/callout">
               <div className="flex items-center gap-2 min-w-0">
                  <Crown className="w-3 h-3 text-green-500" />
                  <span className="text-[11px] font-bold text-textMain truncate">Top: {department.topTeam.name}</span>
               </div>
               <span className="text-[9px] font-mono font-bold text-green-600 dark:text-green-400 shrink-0 group-hover/callout:translate-x-0.5 transition-transform">→</span>
            </Link>
         ) : null}

         {department.weakestTeam ? (
            <Link to={`/team/${department.deptId}/${department.weakestTeam.sectionId}/${department.weakestTeam.id}`} className="flex justify-between items-center bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10 hover:bg-red-500/10 transition-colors group/callout">
               <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[11px] font-bold text-textMain truncate">Risk: {department.weakestTeam.name}</span>
               </div>
               <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400 shrink-0 group-hover/callout:translate-x-0.5 transition-transform">→</span>
            </Link>
         ) : null}
      </div>
    </div>
  );
};

export default DepartmentCard;

