import React, { useState } from 'react';
import PerformanceBar from './ui/PerformanceBar';

// Defines the enriched object structure returning from dataProcessing.ts
interface EnhancedTeamComparison {
  teamId?: string;
  teamName: string;
  deptName: string;
  sectionName: string;
  members: number;
  totalSolved: number;
  avgPerMember: number;
  topPerformer: string;
  topPerformerScore: number;
  teamLeadName?: string;
  teamLeadScore?: number;
  trend: number;
  status: 'Elite' | 'Good' | 'Risk';
}

interface TeamTableProps {
  data: EnhancedTeamComparison[];
  onRowClick: (team: EnhancedTeamComparison) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ data, onRowClick }) => {
  const [sortField, setSortField] = useState<keyof EnhancedTeamComparison>('totalSolved');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof EnhancedTeamComparison) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'totalSolved' || field === 'avgPerMember' ? 'desc' : 'asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField] as any;
    const bValue = b[sortField] as any;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-soft bg-surface">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-background">
          <tr>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider w-16">Rank</th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider cursor-pointer hover:bg-border/30 transition-colors group" onClick={() => handleSort('teamName')}>
              <div className="flex items-center gap-1">Team <span className="text-[10px] opacity-0 group-hover:opacity-100">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider cursor-pointer hover:bg-border/30 transition-colors group" onClick={() => handleSort('members')}>
              <div className="flex justify-center items-center gap-1">Members <span className="text-[10px] opacity-0 group-hover:opacity-100">↕</span></div>
            </th>
            <th className="px-6 py-4 text-right font-bold text-textMuted uppercase tracking-wider cursor-pointer hover:bg-border/30 transition-colors group" onClick={() => handleSort('totalSolved')}>
              <div className="flex justify-end items-center gap-1">Total Solved <span className="text-[10px] opacity-0 group-hover:opacity-100">↕</span></div>
            </th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider cursor-pointer hover:bg-border/30 transition-colors group" onClick={() => handleSort('avgPerMember')}>
              <div className="flex items-center gap-1">Performance <span className="text-[10px] opacity-0 group-hover:opacity-100">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider">Lead</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedData.map((team, index) => {
             // For explicit Rank indicator logic based on sorted order
             const rank = index + 1;
             let RankBadge = <span className="text-textMuted font-mono font-bold">{rank}</span>;
             if (rank === 1) RankBadge = <span className="text-yellow-500 font-black text-lg bg-yellow-500/10 px-2 rounded">🥇</span>;
             if (rank === 2) RankBadge = <span className="text-slate-400 font-black text-lg bg-slate-500/10 px-2 rounded">🥈</span>;
             if (rank === 3) RankBadge = <span className="text-amber-600 font-black text-lg bg-amber-500/10 px-2 rounded">🥉</span>;

             let StatusBadge = <span className="text-xs font-bold px-2.5 py-1 rounded bg-border text-textMuted">N/A</span>;
             if (team.status === 'Elite') StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">🔥 Elite</span>;
             if (team.status === 'Good') StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">⚡ Good</span>;
             if (team.status === 'Risk') StatusBadge = <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">⚠️ Risk</span>;

             return (
              <tr 
                 key={team.teamName} 
                 className="hover:bg-border/30 hover:shadow-md transition-all cursor-pointer group"
                 onClick={() => onRowClick(team)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-center text-textMain">
                   {RankBadge}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-textMain group-hover:text-brand-500 transition-colors mb-0.5">{team.teamName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textMuted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span> {team.sectionName}
                    <span className="mx-1 opacity-50">•</span>
                    {team.deptName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-textMain">{team.members}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-black text-brand-500 text-base">{team.totalSolved.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PerformanceBar value={team.avgPerMember} maxValue={800} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {StatusBadge}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {team.teamLeadName ? (
                    <div className="text-xs font-bold text-textMain truncate max-w-[120px]" title={team.teamLeadName}>
                       {team.teamLeadName}
                    </div>
                  ) : <span className="text-textMuted font-bold text-xs">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TeamTable;
