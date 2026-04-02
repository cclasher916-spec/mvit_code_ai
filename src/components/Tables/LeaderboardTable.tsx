import React from 'react';
import { Link } from 'react-router-dom';
import { LeaderboardEntry } from '../../types';
import { Crown, Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  showTeamColumn?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ data, showTeamColumn = true }) => {
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
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-surface/30">
      <table className="min-w-full divide-y divide-border/50 text-sm">
        <thead className="bg-surface/80 backdrop-blur-sm">
          <tr>
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider w-24">Rank</th>
            <th className="px-6 py-4 text-left font-semibold text-textMuted uppercase tracking-wider">Member</th>
            {showTeamColumn && (
              <th className="px-6 py-4 text-left font-semibold text-textMuted uppercase tracking-wider">Team</th>
            )}
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider">LC</th>
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider">SR</th>
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider">CC</th>
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider">HR</th>
            <th className="px-6 py-4 text-center font-semibold text-textMuted uppercase tracking-wider">Level</th>
            <th className="px-6 py-4 text-right font-semibold text-textMuted uppercase tracking-wider">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((entry) => (
            <tr key={`${entry.memberId}-${entry.rank}`} className={`hover:bg-white/5 transition-colors group relative ${entry.rank <= 3 ? 'bg-white/[0.02]' : ''}`}>
              {entry.rank === 1 && (
                <td className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent pointer-events-none border-l-2 border-yellow-500" colSpan={100} />
              )}
              {entry.rank === 2 && (
                <td className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-transparent pointer-events-none border-l-2 border-slate-400" colSpan={100} />
              )}
              {entry.rank === 3 && (
                <td className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none border-l-2 border-amber-500" colSpan={100} />
              )}
              <td className="px-6 py-4 whitespace-nowrap relative z-10 w-24">
                <div className="flex items-center justify-center space-x-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getRankBadge(entry.rank)}`}>
                    {entry.rank}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap relative z-10">
                <div className="flex items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link to={`/individual/${entry.memberId}`} className="text-sm font-bold text-white hover:text-brand-400 transition-colors">
                        {entry.memberName}
                      </Link>
                      {getRankIcon(entry.rank, Boolean(entry.isTeamLead))}
                      {entry.isTeamLead && (
                        <span className="inline-flex items-center justify-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5">
                          <Crown className="w-3 h-3 mr-1" /> Lead
                        </span>
                      )}
                    </div>
                    {!entry.isTeamLead && entry.assignedTeamLead && (
                      <div className="text-xs font-medium text-brand-400/80 mt-0.5">Under: {entry.assignedTeamLead}</div>
                    )}
                  </div>
                </div>
              </td>
              {showTeamColumn && (
                <td className="px-6 py-4 whitespace-nowrap relative z-10">
                  <Link to={`/team/${entry.deptId}/${entry.sectionId}/${entry.teamId}`} className="text-sm font-bold text-white mb-0.5 hover:text-brand-400 transition-colors block">
                    {entry.teamId}
                  </Link>
                  <div className="text-xs font-medium text-textMuted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {entry.sectionId}
                    <span className="mx-1 opacity-50">•</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {entry.deptId}
                  </div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-center relative z-10"><span className="text-sm font-bold text-[#FFA500] bg-[#FFA500]/10 px-2 rounded-md py-0.5">{entry.leetcodeTotal}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-center relative z-10"><span className="text-sm font-bold text-[#00D4AA] bg-[#00D4AA]/10 px-2 rounded-md py-0.5">{entry.skillrackTotal}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-center relative z-10"><span className="text-sm font-bold text-[#D4957A] bg-[#D4957A]/10 px-2 rounded-md py-0.5">{entry.codechefTotal}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-center relative z-10"><span className="text-sm font-bold text-[#00EA64] bg-[#00EA64]/10 px-2 rounded-md py-0.5">{entry.hackerrankTotal}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-center relative z-10">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border text-white ${
                  entry.benchmarkLevel === 'Advanced' ? 'bg-purple-500/20 border-purple-500/50' : 
                  entry.benchmarkLevel === 'Intermediate' ? 'bg-blue-500/20 border-blue-500/50' : 
                  'bg-gray-500/20 border-gray-500/50'
                }`}>
                  {entry.benchmarkLevel}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right relative z-10 font-bold text-white pr-8">{entry.totalSolved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
