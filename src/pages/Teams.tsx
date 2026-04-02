import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { getTeamStats } from '../utils/dataProcessing';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { Users, ChevronRight, Building2, Search, Eye, Filter, Crown, Target, Trophy } from 'lucide-react';

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { data: allData, hierarchy, loading: globalLoading } = useData();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showOnlyLeaderTeams, setShowOnlyLeaderTeams] = useState(false);

  useEffect(() => {
    if (globalLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [globalLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading teams data...</span>
      </div>
    );
  }

  const allTeams: Array<{
    id: string; name: string; deptId: string; deptName: string; sectionId: string; sectionName: string; description: string; stats: ReturnType<typeof getTeamStats>; teamLeadName?: string; baseTeamName?: string;
  }> = [];

  Object.entries(hierarchy).forEach(([deptId, dept]) => {
    Object.entries(dept.sections).forEach(([sectionId, section]) => {
      Object.entries(section.teams).forEach(([teamId, team]) => {
        const teamData = allData.filter(d => d.deptId === deptId && d.sectionId === sectionId && d.teamId === teamId);
        const stats = getTeamStats(teamData);
        allTeams.push({
          id: teamId,
          name: team.name,
          deptId,
          deptName: dept.name,
          sectionId,
          sectionName: section.name,
          description: team.description,
          stats,
          teamLeadName: team.teamLeadName,
          baseTeamName: team.baseTeamName
        });
      });
    });
  });

  const filteredTeams = allTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.teamLeadName && team.teamLeadName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = !selectedDept || team.deptId === selectedDept;
    const matchesSection = !selectedSection || team.sectionId === selectedSection;
    const matchesLeaderFilter = !showOnlyLeaderTeams || team.teamLeadName;
    return matchesSearch && matchesDept && matchesSection && matchesLeaderFilter;
  });

  const sortedTeams = filteredTeams.sort((a, b) => b.stats.totalProblems - a.stats.totalProblems);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Teams</span>
      </nav>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-white/20 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">👥 Team Directory</h1>
        <p className="text-sm md:text-base text-gray-400">Browse and manage all teams across your organization</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {allTeams.length} Total Teams
          </span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {Object.keys(hierarchy).length} Departments
          </span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            {Object.values(hierarchy).reduce((sum, dept) => sum + Object.keys(dept.sections).length, 0)} Sections
          </span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {allTeams.filter(t => t.teamLeadName).length} Teams with Leaders
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Search className="mr-2 h-5 w-5" />Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-brand-400">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textMuted" />
                <input type="text" placeholder="Search by team, department, leader..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full px-3 py-2 bg-white/5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-white placeholder-textMuted transition-all font-medium" />
              </div>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-brand-400"><Filter className="h-3.5 w-3.5 mr-2" />Department</label>
              <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedSection(''); }} className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-white transition-all cursor-pointer">
                <option value="" className="bg-surface text-white">All Departments</option>
                {Object.entries(hierarchy).map(([deptId, dept]) => (<option key={deptId} value={deptId} className="bg-surface text-white">{dept.name}</option>))}
              </select>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-brand-400"><Filter className="h-3.5 w-3.5 mr-2" />Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-white transition-all cursor-pointer" disabled={!selectedDept}>
                <option value="" className="bg-surface text-white">All Sections</option>
                {selectedDept && Object.entries(hierarchy[selectedDept]?.sections || {}).map(([sectionId, section]) => (<option key={sectionId} value={sectionId} className="bg-surface text-white">{section.name}</option>))}
              </select>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2 flex items-center transition-colors group-focus-within:text-brand-400"><Crown className="h-3.5 w-3.5 mr-2" />Filter</label>
              <label className="flex items-center mt-2 cursor-pointer group-hover:text-brand-400 transition-colors">
                <input type="checkbox" checked={showOnlyLeaderTeams} onChange={(e) => setShowOnlyLeaderTeams(e.target.checked)} className="mr-2 rounded border-border bg-white/5 text-brand-500 focus:ring-brand-500/50" />
                <span className="text-sm font-medium text-textMuted group-hover:text-white transition-colors">Teams with Leaders only</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTeams.map((team, index) => {
          const performanceLevel = team.stats.totalProblems >= 1000 ? 'high' : team.stats.totalProblems >= 500 ? 'medium' : team.stats.totalProblems >= 100 ? 'low' : 'minimal';

          const performanceConfig = {
            high: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
            medium: { bg: 'bg-brand-500/10', border: 'border-brand-500/30', text: 'text-brand-400', badge: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
            low: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', badge: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
            minimal: { bg: 'bg-white/5', border: 'border-border/60', text: 'text-textMuted', badge: 'bg-white/10 text-textMuted border-white/20' }
          } as const;

          const perf = performanceConfig[performanceLevel];

          return (
            <Card key={`${team.deptId}-${team.sectionId}-${team.id}`} hover className={`border bg-surface ${perf.border} transition-all duration-300 group`}>
              <div className="relative">
                {/* Team lead golden glow/highlight */}
                {team.teamLeadName && (
                  <div className="absolute inset-x-0 -top-3 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                )}
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center w-full">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-inner border border-white/10 shrink-0 ${team.teamLeadName ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-500' : 'bg-white/5 text-textMuted group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors'
                        }`}>
                        {team.teamLeadName ? <Crown className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-bold text-white truncate transition-colors group-hover:text-brand-400">{team.baseTeamName || team.name}</h3>
                        <div className="flex items-center mt-1 w-full flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded border inline-block ${perf.badge} font-bold uppercase tracking-wider`}>
                            #{index + 1}
                          </span>
                          {team.teamLeadName && (
                            <div className="flex items-center px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 max-w-[150px] shrink flex-1">
                              <Crown className="h-3.5 w-3.5 mr-1 shrink-0" />
                              <span className="font-semibold truncate">Lead: {team.teamLeadName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-2">
                    <div className="flex items-center text-xs text-textMuted"><Building2 className="h-3.5 w-3.5 mr-2 text-brand-400" /> <span className="truncate">{team.deptName} › {team.sectionName}</span></div>
                    {team.description && (<p className="text-sm text-textMuted line-clamp-2 leading-relaxed bg-white/5 p-2.5 rounded-lg border border-border/50">{team.description}</p>)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-surface/50 border border-border rounded-xl p-3 text-center transition-colors group-hover:border-brand-500/20">
                      <div className="text-xl font-display font-bold text-white">{team.stats.totalProblems.toLocaleString()}</div>
                      <div className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mt-1">Total Problems</div>
                    </div>
                    <div className="bg-surface/50 border border-border rounded-xl p-3 text-center transition-colors group-hover:border-brand-500/20">
                      <div className="text-xl font-display font-bold text-white">{team.stats.avgPerMember}</div>
                      <div className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mt-1">Avg / Member</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6 pt-5 border-t border-border/60">
                    <div>
                      <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> Top Dev
                      </div>
                      <div className="text-sm font-bold text-brand-400 truncate max-w-[180px]">{team.stats.topPerformer || "None"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                        Score <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      </div>
                      <div className="text-sm font-bold text-white">{team.stats.topPerformerScore}</div>
                    </div>
                  </div>

                  <Button onClick={() => navigate(`/team/${team.deptId}/${team.sectionId}/${team.id}`)} className="w-full flex items-center justify-center p-3 md:p-2" size="sm" variant="secondary">
                    <Eye className="mr-2 h-4 w-4" /> View Full Team Info
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2 border-border/60">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <Search className="h-10 w-10 text-textMuted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No teams found</h3>
          <p className="text-textMuted max-w-md mx-auto">We couldn't find any teams matching your current search criteria or filters. Try adjusting them to see more results.</p>
          <Button variant="secondary" className="mt-6" onClick={() => { setSearchTerm(''); setSelectedDept(''); setSelectedSection(''); setShowOnlyLeaderTeams(false); }}>Clear Filters</Button>
        </div>
      )}
    </div>
  );
};

export default Teams;