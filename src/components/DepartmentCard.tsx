import React from 'react';
import { Users, Building2, TrendingUp, AlertTriangle, Crown, Activity } from 'lucide-react';
import PerformanceBar from './ui/PerformanceBar';

interface DepartmentCardProps {
  department: any; // Mapped to the DepartmentComparison interface from dataProcessing
  onClick: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, onClick }) => {
  let StatusBadge = <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-border text-textMuted">N/A</span>;
  let shadowGlow = 'hover:border-border/50';

  if (department.status === 'Elite') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">🔥 Elite</span>;
    shadowGlow = 'hover:border-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]';
  } else if (department.status === 'Good') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">⚡ Good</span>;
    shadowGlow = 'hover:border-brand-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]';
  } else if (department.status === 'Risk') {
    StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">⚠️ Risk</span>;
    shadowGlow = 'hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]';
  }

  return (
    <div 
       onClick={onClick}
       className={`bg-surface border border-border rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden relative ${shadowGlow}`}
    >
      {/* Imbalance Warning Strip */}
      {department.isImbalanced && (
         <div className="absolute top-0 left-0 w-full bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[9px] font-bold uppercase tracking-widest py-1 text-center flex items-center justify-center gap-1 border-b border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> High performance gap inside department
         </div>
      )}

      {/* Header: Identity */}
      <div className={`flex justify-between items-start mb-6 ${department.isImbalanced ? 'mt-4' : ''}`}>
        <div>
           <h3 className="text-2xl font-black text-textMain tracking-tight group-hover:text-brand-500 transition-colors">
              {department.deptName}
           </h3>
           <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-textMuted uppercase tracking-wider">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/> {department.totalTeams} Teams</span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/> {department.totalMembers} Members</span>
           </div>
        </div>
        <div>{StatusBadge}</div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
         <div className="bg-background border border-border rounded-xl p-3 shadow-inner">
            <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Total Solved</p>
            <p className="text-xl font-mono font-black text-brand-500">{department.totalSolved.toLocaleString()}</p>
         </div>
         <div className="bg-background border border-border rounded-xl p-3 shadow-inner">
            <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1 flex items-center justify-between">
               Avg Score
               {department.trend > 0 && <span className="text-green-500 text-[10px] flex items-center">+{department.trend} <TrendingUp className="w-3 h-3 ml-0.5"/></span>}
            </p>
            <p className="text-xl font-mono font-black text-textMain">{department.avgPerMember.toLocaleString()}</p>
         </div>
      </div>

      {/* Visual Indicator */}
      <div className="mb-6 bg-background rounded-lg p-3 border border-border shadow-inner">
         <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Velocity Profile</p>
         <PerformanceBar value={department.avgPerMember} maxValue={800} />
      </div>

      {/* Intelligence Callouts */}
      <div className="space-y-3 pt-4 border-t border-border">
         <p className="text-[10px] text-brand-500 uppercase font-black tracking-widest mb-1">Engine Callouts</p>
         
         {department.topTeam ? (
            <div className="flex justify-between items-center bg-green-500/5 px-3 py-2 rounded-lg border border-green-500/10">
               <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-bold text-textMain truncate max-w-[120px]" title={department.topTeam.name}>Top: {department.topTeam.name}</span>
               </div>
               <span className="text-[10px] font-mono font-bold text-green-600 dark:text-green-400">{department.topTeam.avg} avg</span>
            </div>
         ) : null}

         {department.weakestTeam ? (
            <div className="flex justify-between items-center bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">
               <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-bold text-textMain truncate max-w-[100px]" title={department.weakestTeam.name}>Risk: {department.weakestTeam.name}</span>
               </div>
               <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">{department.weakestTeam.avg} avg</span>
            </div>
         ) : null}
      </div>
    </div>
  );
};

export default DepartmentCard;
