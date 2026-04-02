import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DailyTotal } from '../types';
import { getLatestByMember } from '../utils/dataProcessing';
import { User, Eye, ChevronDown, ChevronUp, Search, Crown, Activity } from 'lucide-react';

interface MemberTableProps {
  data: DailyTotal[];
}

const MemberTable: React.FC<MemberTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'performance' | 'name'>('performance');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 15;

  const latestData = getLatestByMember(data || []);

  const filteredMembers = (latestData || [])
    .filter(m => {
      if (!m) return false;
      return (m.memberName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.teamId || '').toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      return sortBy === 'name' ? (a.memberName || '').localeCompare(b.memberName || '') : (b.totalSolved || 0) - (a.totalSolved || 0);
    });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const currentMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden animate-fade-in shadow-xl">
      <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
           <Activity className="text-brand-500" /> Full Data View 
           <span className="text-xs bg-border/50 px-2 py-0.5 rounded-full text-textMuted font-mono">{filteredMembers.length} records</span>
        </h2>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search members or teams..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="pl-9 w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-textMain placeholder-textMuted/50 transition-all font-medium" 
            />
          </div>
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value as 'name' | 'performance'); setCurrentPage(1); }} 
            className="appearance-none px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-500/50 text-textMain transition-all cursor-pointer text-sm font-medium pr-8"
          >
            <option value="performance" className="bg-surface text-textMain">By Performance</option>
            <option value="name" className="bg-surface text-textMain">By Name</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {currentMembers.length > 0 ? currentMembers.map((member, index) => {
             const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
             const isExpanded = expandedRow === member.memberId;
             
             const getLevel = (score: number) => {
                if (score >= 500) return { label: 'Advanced', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' };
                if (score >= 200) return { label: 'Intermediate', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' };
                if (score >= 50) return { label: 'Beginner', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' };
                return { label: 'Novice', color: 'text-textMuted', bg: 'bg-border/50' };
             };
             const level = getLevel(member.totalSolved);

             return (
              <div key={member.memberId} className="border-b border-border last:border-0 hover:bg-border/30 transition-colors">
                <div className="p-4 grid grid-cols-12 gap-4 items-center">
                   
                   {/* Column 1: Identity */}
                   <div className="col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-background border border-border flex items-center justify-center shadow-inner">
                         {member.isTeamLead ? <Crown className="w-5 h-5 text-yellow-500" /> : <User className="w-5 h-5 text-brand-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2">
                           <h3 className="font-bold text-textMain text-base truncate">{member.memberName}</h3>
                           <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-widest ${level.bg} ${level.color}`}>{level.label}</span>
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-textMuted font-mono">Rank {rank}</span>
                           <span className="w-1 h-1 rounded-full bg-border"></span>
                           <span className="text-xs text-brand-500 font-bold">{member.totalSolved} pts</span>
                         </div>
                      </div>
                   </div>

                   {/* Column 2: Context */}
                   <div className="col-span-3">
                      <div className="text-sm font-semibold text-textMain flex items-center gap-1.5 truncate">
                         {member.teamId || "N/A Team"}
                      </div>
                      <div className="text-xs text-textMuted mt-1 flex items-center gap-2">
                         <span className="truncate">{member.sectionId} • {member.deptId}</span>
                      </div>
                   </div>

                   {/* Column 3: Performance Metrics */}
                   <div className="col-span-4">
                      <div className="grid grid-cols-4 gap-1 text-center font-mono">
                         <div className="bg-background border border-border rounded py-1">
                            <div className="text-[#FFA500] text-sm font-bold">{member.leetcodeTotal || 0}</div>
                            <div className="text-[9px] uppercase tracking-wider text-textMuted">LC</div>
                         </div>
                         <div className="bg-background border border-border rounded py-1">
                            <div className="text-[#00D4AA] text-sm font-bold">{member.skillrackTotal || 0}</div>
                            <div className="text-[9px] uppercase tracking-wider text-textMuted">SR</div>
                         </div>
                         <div className="bg-background border border-border rounded py-1">
                            <div className="text-[#D4957A] text-sm font-bold">{member.codechefTotal || 0}</div>
                            <div className="text-[9px] uppercase tracking-wider text-textMuted">CC</div>
                         </div>
                         <div className="bg-background border border-border rounded py-1">
                            <div className="text-[#00EA64] text-sm font-bold">{member.hackerrankTotal || 0}</div>
                            <div className="text-[9px] uppercase tracking-wider text-textMuted">HR</div>
                         </div>
                      </div>
                   </div>

                   {/* Column 4: Actions */}
                   <div className="col-span-1 flex items-center justify-end">
                      <button onClick={() => toggleExpand(member.memberId)} className="p-2 text-textMuted hover:text-textMain bg-background hover:bg-border/50 rounded-lg transition-colors border border-transparent hover:border-border">
                         {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                   </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="bg-background border-t border-border p-4 animate-fade-in flex flex-col md:flex-row gap-6 shadow-inner">
                     <div className="flex-1">
                        <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Recent Trajectory</h4>
                        <div className="flex gap-4">
                           <div className="bg-surface border border-border p-3 rounded-lg min-w-[120px] shadow-sm">
                              <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">24h Growth</div>
                              <div className={`text-xl font-mono font-bold ${member.totalDailyIncrease > 0 ? 'text-green-500' : 'text-textMuted'}`}>
                                 {member.totalDailyIncrease > 0 ? '+' : ''}{member.totalDailyIncrease}
                              </div>
                           </div>
                           <div className="bg-surface border border-border p-3 rounded-lg flex-1 shadow-sm">
                              <div className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">Leadership</div>
                              <div className="text-sm font-medium text-textMain mt-1">
                                 {member.isTeamLead ? (
                                    <span className="text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5"><Crown className="w-3 h-3"/> Active Team Lead</span>
                                 ) : (
                                    <span>Assigned Lead: <span className="text-brand-600 dark:text-brand-400">{member.assignedTeamLead || "None"}</span></span>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="shrink-0 flex items-end">
                        <Link to={`/individual/${member.memberId}`} className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-lg border border-brand-400/30 transition-colors font-bold text-sm shadow-md">
                           <Eye className="w-4 h-4" /> Open Full AI Profile
                        </Link>
                     </div>
                  </div>
                )}
              </div>
             );
          }) : (
             <div className="p-16 text-center text-textMuted">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No members found for this query.</p>
             </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border bg-background flex items-center justify-between">
           <div className="text-xs text-textMuted font-mono">
             Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
           </div>
           <div className="flex gap-2">
              <button 
                 disabled={currentPage === 1} 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 className="px-3 py-1 bg-surface border border-border rounded text-sm text-textMain disabled:opacity-30 hover:bg-border/50 transition-colors"
                >
                Prev
              </button>
              <div className="flex gap-1">
                 {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${currentPage === pageNum ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface border border-border text-textMuted hover:bg-border/50 hover:text-textMain'}`}
                      >
                        {pageNum}
                      </button>
                    )
                 })}
              </div>
              <button 
                 disabled={currentPage === totalPages} 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 className="px-3 py-1 bg-surface border border-border rounded text-sm text-textMain disabled:opacity-30 hover:bg-border/50 transition-colors"
                >
                Next
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MemberTable;
