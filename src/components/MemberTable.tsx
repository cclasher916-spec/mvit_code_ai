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

      <div className="w-full overflow-hidden">
        {/* Helper for performance level labeling */}
        {(() => {
          const getLevel = (score: number) => {
            if (score >= 500) return { label: 'Advanced', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' };
            if (score >= 200) return { label: 'Intermediate', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10' };
            if (score >= 50) return { label: 'Beginner', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' };
            return { label: 'Novice', color: 'text-textMuted', bg: 'bg-border/50' };
          };
          
          return (
            <>
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden lg:block overflow-x-auto">
          <div className="min-w-full">
            {currentMembers.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-background/50 text-[11px] uppercase tracking-widest font-black text-textMuted border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Identity & Rank</th>
                    <th className="px-6 py-4">Squad / Dept</th>
                    <th className="px-4 py-4 text-center">Platform Stats</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {currentMembers.map((member, index) => {
                    const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    const isExpanded = expandedRow === member.memberId;
                    const level = getLevel(member.totalSolved);
                    
                    return (
                      <React.Fragment key={member.memberId}>
                        <tr className="hover:bg-border/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 shrink-0 rounded-lg bg-background border border-border flex items-center justify-center shadow-inner group-hover:border-brand-500/30 transition-colors">
                                 {member.isTeamLead ? <Crown className="w-5 h-5 text-yellow-500" /> : <User className="w-5 h-5 text-brand-500" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                   <Link to={`/individual/${member.memberId}`} className="font-bold text-textMain text-sm truncate hover:text-brand-500 transition-colors">
                                      {member.memberName}
                                   </Link>
                                   <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-widest ${level.bg} ${level.color}`}>{level.label}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                   <span className="text-textMuted font-mono">Rank #{rank}</span>
                                   <span className="w-1 h-1 rounded-full bg-border"></span>
                                   <span className="text-brand-500 font-bold">{member.totalSolved} pts</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-textMain truncate">{member.teamId || "N/A Team"}</div>
                            <div className="text-[10px] text-textMuted mt-0.5 truncate">{member.sectionId} • {member.deptId}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-1.5 font-mono">
                               {[
                                 { label: 'LC', val: member.leetcodeTotal, color: 'text-[#FFA500]' },
                                 { label: 'SR', val: member.skillrackTotal, color: 'text-[#00D4AA]' },
                                 { label: 'CC', val: member.codechefTotal, color: 'text-[#D4957A]' },
                                 { label: 'HR', val: member.hackerrankTotal, color: 'text-[#00EA64]' }
                               ].map(p => (
                                 <div key={p.label} className="bg-background/50 border border-border/50 rounded-md px-2 py-1 min-w-[45px] text-center">
                                    <div className={`${p.color} text-xs font-bold`}>{p.val || 0}</div>
                                    <div className="text-[8px] uppercase tracking-tighter text-textMuted">{p.label}</div>
                                 </div>
                               ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <Link to={`/individual/${member.memberId}`} className="p-2 text-textMuted hover:text-brand-500 hover:bg-brand-500/10 rounded-lg transition-all" title="View Profile">
                                  <Eye className="w-4 h-4" />
                               </Link>
                               <button onClick={() => toggleExpand(member.memberId)} className="p-2 text-textMuted hover:text-textMain bg-background border border-border rounded-lg transition-all">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                               </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={4} className="p-0 border-b border-border bg-background/30 overflow-hidden">
                               <div className="p-6 transition-all animate-in slide-in-from-top-1 duration-300">
                                  <div className="flex flex-col md:flex-row gap-8 items-start">
                                      <div className="flex-1 w-full">
                                         <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-4">Trajectory Analysis</h4>
                                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <div className="bg-surface border border-border/50 p-4 rounded-xl shadow-sm">
                                               <div className="text-[10px] text-textMuted uppercase font-black tracking-widest mb-1.5">24h Delta</div>
                                               <div className={`text-2xl font-mono font-black ${member.totalDailyIncrease > 0 ? 'text-green-500' : 'text-textMuted'}`}>
                                                  {member.totalDailyIncrease > 0 ? '+' : ''}{member.totalDailyIncrease}
                                               </div>
                                            </div>
                                            <div className="bg-surface border border-border/50 p-4 rounded-xl shadow-sm col-span-1 sm:col-span-2">
                                               <div className="text-[10px] text-textMuted uppercase font-black tracking-widest mb-1.5">Leadership Signature</div>
                                               <div className="text-sm font-bold text-textMain mt-1">
                                                  {member.isTeamLead ? (
                                                     <span className="text-yellow-500 flex items-center gap-2"><Crown className="w-4 h-4"/> Certified Organizational Team Lead</span>
                                                  ) : (
                                                     <span className="text-textMuted font-medium italic">Under Oversight of <span className="text-brand-500 not-italic font-black underline decoration-brand-500/30 underline-offset-4">{member.assignedTeamLead || "Pending Assignment"}</span></span>
                                                  )}
                                               </div>
                                            </div>
                                         </div>
                                      </div>
                                      <Link to={`/individual/${member.memberId}`} className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl font-black text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                         <Activity className="w-4 h-4" /> Full Diagnostic Report
                                      </Link>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>

        {/* Mobile List View - Visible only on Mobile */}
        <div className="lg:hidden divide-y divide-border/50">
          {currentMembers.length > 0 ? currentMembers.map((member, index) => {
            const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
            const isExpanded = expandedRow === member.memberId;
            const level = getLevel(member.totalSolved);
            
            return (
              <div key={member.memberId} className="p-4 hover:bg-border/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                       {member.isTeamLead ? <Crown className="w-5 h-5 text-yellow-500" /> : <User className="w-5 h-5 text-brand-500" />}
                    </div>
                    <div>
                      <Link to={`/individual/${member.memberId}`} className="font-extrabold text-textMain text-sm block leading-none mb-1">{member.memberName}</Link>
                      <span className="text-[10px] font-mono font-bold text-textMuted uppercase tracking-wider">Rank #{rank} • <span className="text-brand-500">{member.totalSolved}</span> pts</span>
                    </div>
                  </div>
                  <button onClick={() => toggleExpand(member.memberId)} className="p-2 text-textMuted bg-background border border-border rounded-lg">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-sm tracking-[0.15em] border ${level.bg} ${level.color} border-current/10`}>{level.label}</span>
                  <span className="text-[10px] font-bold text-textMuted/70 border border-border/50 px-2 py-0.5 rounded-sm truncate max-w-[150px]">{member.teamId || "No Team"}</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: 'LC', val: member.leetcodeTotal, color: 'text-[#FFA500]' },
                        { label: 'SR', val: member.skillrackTotal, color: 'text-[#00D4AA]' },
                        { label: 'CC', val: member.codechefTotal, color: 'text-[#D4957A]' },
                        { label: 'HR', val: member.hackerrankTotal, color: 'text-[#00EA64]' }
                      ].map(p => (
                        <div key={p.label} className="bg-background border border-border rounded-lg p-2 text-center">
                           <div className={`${p.color} text-sm font-bold`}>{p.val || 0}</div>
                           <div className="text-[9px] uppercase font-bold text-textMuted">{p.label}</div>
                        </div>
                      ))}
                    </div>
                    <Link to={`/individual/${member.memberId}`} className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-brand-500/20">
                      <Eye className="w-3.5 h-3.5" /> Full Statistics
                    </Link>
                  </div>
                )}
              </div>
            );
          }) : null}
        </div>

        {currentMembers.length === 0 && (
          <div className="p-20 text-center text-textMuted">
             <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="font-bold uppercase tracking-widest text-xs">No personnel matched query</p>
          </div>
        )}
            </>
          );
        })()}
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
