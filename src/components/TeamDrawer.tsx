import React, { useEffect } from 'react';
import { X, TrendingUp, Users, Crown } from 'lucide-react';

interface TeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: any | null; // The exact team object being examined
}

const TeamDrawer: React.FC<TeamDrawerProps> = ({ isOpen, onClose, team }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !team) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Sliding Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface sticky top-0 z-10 flex justify-between items-start">
          <div>
             <h2 className="text-2xl font-black text-textMain tracking-tight mb-1">{team.teamName}</h2>
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-textMuted">
               <span className="w-2 h-2 rounded-full bg-brand-500"></span>
               {team.sectionName} • {team.deptName}
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
        <div className="p-6 flex-1 space-y-8 animate-fade-in">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Active Roster</p>
                <p className="text-3xl font-mono font-black text-textMain">{team.members}</p>
             </div>
             <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/> Score Velocity</p>
                {team.trend > 0 ? (
                   <p className="text-3xl font-mono font-black text-green-500">+{team.trend}</p>
                ) : (
                   <p className="text-3xl font-mono font-black text-textMuted">0</p>
                )}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-brand-500/5 py-4 px-6 rounded-xl border border-brand-500/20 col-span-2 flex justify-between items-center group cursor-default">
                <div>
                   <p className="text-[10px] text-brand-500 uppercase font-bold tracking-widest mb-1">Total Operational Output</p>
                   <p className="text-4xl font-mono font-black text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform origin-left">{team.totalSolved}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Average / Head</p>
                   <p className="text-2xl font-mono font-black text-textMain">{team.avgPerMember}</p>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm border-b border-border pb-2 font-bold text-textMain tracking-widest flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" /> Organizational Hierarchy
             </h3>
             <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                {team.teamLeadName ? (
                   <div className="flex justify-between items-center">
                     <div>
                        <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-1">Assigned Team Lead</div>
                        <div className="text-lg font-bold text-textMain">{team.teamLeadName}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Lead Score</div>
                        <div className="text-lg font-mono font-black text-brand-500">{team.teamLeadScore}</div>
                     </div>
                   </div>
                ) : (
                   <div className="text-sm font-medium italic text-textMuted text-center py-2">
                      No explicitly defined active team lead within scope.
                   </div>
                )}
             </div>
             
             {team.topPerformer && team.topPerformer !== team.teamLeadName && (
                <div className="bg-background border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                   <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>
                     <div className="flex justify-between items-center pl-3">
                     <div>
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Autonomous Top Performer</div>
                        <div className="text-sm font-bold text-textMain">{team.topPerformer}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Earned</div>
                        <div className="text-sm font-mono font-black text-textMain">{team.topPerformerScore}</div>
                     </div>
                   </div>
                </div>
             )}
          </div>
          
        </div>
      </div>
    </>
  );
};

export default TeamDrawer;
