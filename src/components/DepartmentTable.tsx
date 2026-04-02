import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, TrendingUp } from 'lucide-react';
import PerformanceBar from './ui/PerformanceBar'; // Ensure explicit component reusability mapping

interface DepartmentTableProps {
  data: any[]; // Accepts structured DepartmentComparison layout array
  onRowClick: (dept: any) => void; 
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({ data, onRowClick }) => {
  const [sortField, setSortField] = useState<string>('avgPerMember');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Track explicitly which departments are expanded to show internal squad hierarchies
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'totalSolved' || field === 'avgPerMember' || field === 'trend' ? 'desc' : 'asc');
    }
  };

  const toggleExpand = (deptId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid triggering the drawer click event natively
    setExpandedRows((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
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
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
      <table className="min-w-full divide-y divide-border text-sm">
        
        {/* Table Headings */}
        <thead className="bg-background">
          <tr>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider w-12 shrink-0"></th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('deptName')}>
               <div className="flex items-center gap-1">Department <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider cursor-pointer group hidden md:table-cell" onClick={() => handleSort('totalTeams')}>
               <div className="flex justify-center items-center gap-1">Teams <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider cursor-pointer group hidden md:table-cell" onClick={() => handleSort('totalMembers')}>
               <div className="flex justify-center items-center gap-1">Members <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-right font-bold text-textMuted uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('totalSolved')}>
               <div className="flex justify-end items-center gap-1">Total Solved <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('avgPerMember')}>
               <div className="flex items-center gap-1">Average <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider cursor-pointer group hidden lg:table-cell" onClick={() => handleSort('trend')}>
               <div className="flex items-center justify-center gap-1">Trend <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span></div>
            </th>
            <th className="px-6 py-4 text-center font-bold text-textMuted uppercase tracking-wider hidden sm:table-cell">Status</th>
            <th className="px-6 py-4 text-left font-bold text-textMuted uppercase tracking-wider hidden xl:table-cell">Top Squad</th>
          </tr>
        </thead>
        
        {/* Render Recursions */}
        <tbody className="divide-y divide-border font-medium">
          {sortedData.map((dept, index) => {
            const isExpanded = expandedRows[dept.deptId];
            const isRank1 = index === 0 && sortField === 'avgPerMember' && sortDirection === 'desc';

            let StatusBadge = <span className="text-xs px-2 py-1 rounded bg-border text-textMuted">N/A</span>;
            if (dept.status === 'Elite') StatusBadge = <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm">🔥 Elite</span>;
            if (dept.status === 'Good') StatusBadge = <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm">⚡ Good</span>;
            if (dept.status === 'Risk') StatusBadge = <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm">⚠️ Risk</span>;

            return (
               <React.Fragment key={dept.deptId}>
                  {/* Master Department Row */}
                  <tr 
                     className={`hover:bg-border/30 transition-all cursor-pointer group ${isRank1 ? 'bg-brand-500/5 shadow-inner' : ''}`}
                     onClick={() => onRowClick(dept)}
                  >
                     {/* Expansion Trigger */}
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                           onClick={(e) => toggleExpand(dept.deptId, e)}
                           className="p-1 rounded-md hover:bg-border transition-colors text-textMuted hover:text-textMain border border-transparent hover:border-border"
                           title="Expand Teams"
                        >
                           {isExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                        </button>
                     </td>

                     {/* Department Name */}
                     <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-base text-textMain group-hover:text-brand-500 transition-colors flex items-center gap-2">
                           {dept.deptName}
                           {isRank1 && <span className="flex items-center text-[9px] uppercase tracking-widest bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">🥇 Rank 1</span>}
                        </div>
                     </td>

                     <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-textMain hidden md:table-cell">{dept.totalTeams}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-center text-textMuted hidden md:table-cell">{dept.totalMembers}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-black text-brand-500 text-base">{dept.totalSolved.toLocaleString()}</td>
                     
                     {/* Scale Progress Visualizations */}
                     <td className="px-6 py-4 whitespace-nowrap">
                        <PerformanceBar value={dept.avgPerMember} maxValue={800} />
                     </td>

                     {/* Trend Metrics */}
                     <td className="px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                        <div className={`flex items-center justify-center gap-1 font-mono font-bold ${dept.trend > 0 ? 'text-green-500' : 'text-textMuted'}`}>
                           {dept.trend > 0 ? <TrendingUp className="w-3.5 h-3.5"/> : ''}
                           {dept.trend > 0 ? `+${dept.trend}` : '−'}
                        </div>
                     </td>

                     <td className="px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">{StatusBadge}</td>
                     
                     <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        {dept.topTeam ? (
                           <div className="text-xs font-bold text-textMain truncate max-w-[140px] flex items-center gap-1.5" title={dept.topTeam.name}>
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0"/> {dept.topTeam.name}
                           </div>
                        ) : <span className="text-textMuted">—</span>}
                     </td>
                  </tr>

                  {/* Sub-Rows Nested Expansion Panel */}
                  {isExpanded && dept.nestedTeams?.length > 0 && (
                     <tr>
                        <td colSpan={9} className="px-0 py-0">
                           <div className="bg-background border-y border-border px-8 lg:px-24 py-6 shadow-inner animate-fade-in relative">
                              {/* Draw structural side-tree connecting line */}
                              <div className="absolute top-0 bottom-0 left-[3rem] lg:left-[5rem] border-l-2 border-border/70 z-0"></div>
                              
                              <h4 className="text-[10px] text-textMuted font-bold uppercase tracking-widest flex items-center gap-2 mb-4 relative z-10 pl-6">
                                 <div className="w-2 h-[2px] bg-border/70 -ml-8"></div>
                                 Squad Deployment ({dept.totalTeams})
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ml-2 relative z-10">
                                 {dept.nestedTeams.sort((a: any, b: any) => b.totalSolved - a.totalSolved).map((t: any) => (
                                    <div key={t.teamName} className="flex justify-between items-center p-3 rounded-xl border border-border/50 bg-surface shadow-sm hover:border-border transition-colors">
                                       <div className="min-w-0 flex-1 pr-3">
                                          <div className="text-sm font-bold text-textMain truncate mb-0.5">{t.teamName}</div>
                                          <div className="text-[10px] text-textMuted font-bold uppercase">{t.sectionName} Squad</div>
                                       </div>
                                       <div className="text-right shrink-0">
                                          <div className="text-xs font-mono font-black text-brand-500">{t.totalSolved}</div>
                                          <div className="text-[10px] font-mono text-textMuted">{t.avgPerMember} avg</div>
                                       </div>
                                    </div>
                                 ))}
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
    </div>
  );
};

export default DepartmentTable;
