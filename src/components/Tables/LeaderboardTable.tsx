import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LeaderboardEntry } from '../../types';
import { Crown, Trophy, Medal, Award, ChevronDown, ChevronUp, ChevronRight, ExternalLink } from 'lucide-react';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  showTeamColumn?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ data, showTeamColumn = true }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getRankIcon = (rank: number, isTeamLead: boolean) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />;
    if (isTeamLead) return <Crown className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50 shadow-[0_0_10px_rgba(253,224,71,0.2)]';
    if (rank === 2) return 'bg-slate-300/20 text-slate-300 border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]';
    if (rank === 3) return 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    return 'bg-white/5 text-textMuted border-border/50';
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/50 bg-surface/30">
        <table className="min-w-full text-sm">
          <thead className="bg-surface/80 backdrop-blur-md border-b border-border/50">
            <tr>
              <th className="px-6 py-5 text-center font-black text-textMuted uppercase tracking-widest text-[10px] w-20">Rank</th>
              <th className="px-6 py-5 text-left font-black text-textMuted uppercase tracking-widest text-[10px]">Member</th>
              {showTeamColumn && (
                <th className="px-6 py-5 text-left font-black text-textMuted uppercase tracking-widest text-[10px]">Department</th>
              )}
              <th className="px-6 py-5 text-center font-black text-textMuted uppercase tracking-widest text-[10px]">Readiness</th>
              <th className="px-6 py-5 text-right font-black text-textMuted uppercase tracking-widest text-[10px]">Score</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((entry) => (
              <React.Fragment key={`${entry.memberId}-${entry.rank}`}>
                <tr 
                  className={`group transition-all hover:bg-white/[0.03] cursor-pointer ${expandedId === entry.memberId ? 'bg-white/[0.05]' : ''}`}
                  onClick={() => setExpandedId(expandedId === entry.memberId ? null : entry.memberId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border ${getRankBadge(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                        {entry.memberName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <Link to={`/individual/${entry.memberId}`} className="text-sm font-bold text-textMain hover:text-brand-500 transition-colors" onClick={(e) => e.stopPropagation()}>{entry.memberName}</Link>
                           {getRankIcon(entry.rank, Boolean(entry.isTeamLead))}
                        </div>
                        {entry.isTeamLead && <span className="text-[9px] font-black text-brand-500 uppercase tracking-tighter">Team Lead</span>}
                      </div>
                    </div>
                  </td>
                  {showTeamColumn && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-textMain text-xs">{entry.teamId}</div>
                      <div className="text-[10px] text-textMuted uppercase font-black">{entry.deptId}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      entry.benchmarkLevel === 'Advanced' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                      entry.benchmarkLevel === 'Intermediate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 
                      'bg-gray-500/10 text-textMuted border-border/50'
                    }`}>
                      {entry.benchmarkLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-black text-white text-lg tabular-nums">
                    {entry.totalSolved.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {expandedId === entry.memberId ? <ChevronUp className="w-4 h-4 text-brand-500" /> : <ChevronDown className="w-4 h-4 text-textMuted group-hover:text-white" />}
                  </td>
                </tr>
                {expandedId === entry.memberId && (
                  <tr className="bg-white/[0.02]">
                    <td colSpan={showTeamColumn ? 6 : 5} className="px-12 py-6 border-l-2 border-brand-500/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-down">
                        <div className="bg-surface/50 p-4 rounded-2xl border border-border">
                          <div className="text-[10px] text-textMuted uppercase font-black mb-2 flex justify-between">LeetCode <ExternalLink className="w-2.5 h-2.5 opacity-30" /></div>
                          <div className="text-xl font-black text-white">{entry.leetcodeTotal}</div>
                        </div>
                        <div className="bg-surface/50 p-4 rounded-2xl border border-border">
                          <div className="text-[10px] text-textMuted uppercase font-black mb-2 flex justify-between">SkillRack <ExternalLink className="w-2.5 h-2.5 opacity-30" /></div>
                          <div className="text-xl font-black text-white">{entry.skillrackTotal}</div>
                        </div>
                        <div className="bg-surface/50 p-4 rounded-2xl border border-border">
                          <div className="text-[10px] text-textMuted uppercase font-black mb-2 flex justify-between">CodeChef <ExternalLink className="w-2.5 h-2.5 opacity-30" /></div>
                          <div className="text-xl font-black text-white">{entry.codechefTotal}</div>
                        </div>
                        <div className="bg-surface/50 p-4 rounded-2xl border border-border">
                          <div className="text-[10px] text-textMuted uppercase font-black mb-2 flex justify-between">Others <ExternalLink className="w-2.5 h-2.5 opacity-30" /></div>
                          <div className="text-xl font-black text-white">{entry.hackerrankTotal}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                         <Link to={`/individual/${entry.memberId}`} className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>Complete Profile Analysis <ChevronRight className="w-3 h-3" /></Link>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {data.map((entry) => (
          <div key={`${entry.memberId}-${entry.rank}`} className="bg-surface border border-border rounded-3xl p-6 shadow-soft relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${entry.rank === 1 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : entry.rank === 2 ? 'bg-slate-400' : entry.rank === 3 ? 'bg-amber-600' : 'bg-transparent'}`} />
            
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black border ${getRankBadge(entry.rank)}`}>
                    {entry.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                       <Link to={`/individual/${entry.memberId}`} className="font-black text-textMain text-base">{entry.memberName}</Link>
                       {getRankIcon(entry.rank, Boolean(entry.isTeamLead))}
                    </div>
                    {showTeamColumn && <div className="text-[10px] text-textMuted font-black uppercase tracking-widest mt-0.5">{entry.teamId} • {entry.deptId}</div>}
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-2xl font-black text-white leading-none tabular-nums">{entry.totalSolved.toLocaleString()}</div>
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/5">
                <div className="text-center">
                   <div className="text-[8px] uppercase font-black text-textMuted mb-0.5">LC</div>
                   <div className="text-xs font-bold text-white">{entry.leetcodeTotal}</div>
                </div>
                <div className="text-center">
                   <div className="text-[8px] uppercase font-black text-textMuted mb-0.5">SR</div>
                   <div className="text-xs font-bold text-white">{entry.skillrackTotal}</div>
                </div>
                <div className="text-center">
                   <div className="text-[8px] uppercase font-black text-textMuted mb-0.5">CC</div>
                   <div className="text-xs font-bold text-white">{entry.codechefTotal}</div>
                </div>
                <div className="text-center">
                   <div className="text-[8px] uppercase font-black text-textMuted mb-0.5">HR</div>
                   <div className="text-xs font-bold text-white">{entry.hackerrankTotal}</div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTable;
