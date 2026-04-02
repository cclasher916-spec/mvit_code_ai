import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DailyTotal } from '../types';
import { createLeaderboard } from '../utils/dataProcessing';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LeaderboardTable from '../components/Tables/LeaderboardTable';
import HierarchySelector from '../components/Navigation/HierarchySelector';
import { Trophy, Medal, Award, Crown, ChevronRight, Users, Target } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { data: globalData, hierarchy, loading: globalLoading } = useData();
  const [data, setData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewLevel, setViewLevel] = useState<'global' | 'department' | 'section' | 'team'>('global');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);

  useEffect(() => {
    if (globalLoading) {
      setLoading(true);
      return;
    }

    // Client-side filtering instead of refetching from Firebase
    let filteredData = globalData;

    if (viewLevel === 'department' && selectedDept) {
      filteredData = globalData.filter((d: any) => d.deptId === selectedDept);
    } else if (viewLevel === 'section' && selectedDept && selectedSection) {
      filteredData = globalData.filter((d: any) => d.deptId === selectedDept && d.sectionId === selectedSection);
    } else if (viewLevel === 'team' && selectedDept && selectedSection && selectedTeam) {
      filteredData = globalData.filter((d: any) => d.deptId === selectedDept && d.sectionId === selectedSection && d.teamId === selectedTeam);
    }

    setData(filteredData);
    setLoading(false);
  }, [globalData, globalLoading, viewLevel, selectedDept, selectedSection, selectedTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading leaderboard...</span>
      </div>
    );
  }

  let leaderboard = createLeaderboard(data);
  if (showOnlyLeaders) leaderboard = leaderboard.filter(e => e.isTeamLead);
  const topPerformers = leaderboard.slice(0, 3);

  const getLevelTitle = () => {
    switch (viewLevel) {
      case 'team':
        return selectedTeam ? `Team: ${selectedTeam}` : 'Select Team';
      case 'section':
        return selectedSection ? `Section: ${selectedSection}` : 'Select Section';
      case 'department':
        return selectedDept ? `Department: ${selectedDept}` : 'Select Department';
      default:
        return showOnlyLeaders ? 'Team Leaders Leaderboard' : 'Global Leaderboard';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <nav className="flex items-center space-x-2 text-sm text-textMuted bg-surface/50 w-fit px-4 py-2 rounded-full border border-border">
        <Link to="/" className="hover:text-brand-400 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-textMain flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-purple"></div> Leaderboard
        </span>
      </nav>

      {/* Hero Section */}
      <div className="glass-card rounded-2xl p-5 md:p-8 relative overflow-hidden group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-brand-500/10 opacity-50"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2 tracking-tight">Global Leaderboard 🏆</h1>
          <p className="text-textMuted max-w-xl mx-auto md:mx-0">Celebrating excellence in coding across all levels. Challenge yourself and climb the ranks.</p>
        </div>
      </div>

      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-accent-purple/30">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-accent-purple/10 mr-3">
              <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            Leaderboard Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">View Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-border/50 p-1 rounded-xl bg-surface/30">
                  {(['global', 'department', 'section', 'team'] as const).map((level) => (
                    <button key={level} onClick={() => setViewLevel(level)} className={`px-3 py-2 text-sm rounded-lg transition-all capitalize font-medium ${viewLevel === level ? 'bg-gradient-hero text-white shadow-lg shadow-brand-500/20' : 'text-textMuted hover:text-white hover:bg-white/5'}`}>{level === 'global' ? 'All' : level}</button>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-xl p-4 flex items-center justify-between border-brand-500/20 bg-brand-500/5">
                <div className="flex items-center">
                  <div className="p-2 bg-brand-500/20 rounded-lg mr-3">
                    <Crown className="h-5 w-5 text-brand-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Leaders Only</span>
                    <span className="text-xs text-textMuted hidden sm:block">Filter to show only team leads</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={showOnlyLeaders} onChange={(e) => setShowOnlyLeaders(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-textMuted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-hero shadow-inner"></div>
                </label>
              </div>
            </div>
            <div>
              <HierarchySelector hierarchy={hierarchy} selectedDept={selectedDept} selectedSection={selectedSection} selectedTeam={selectedTeam} onDepartmentChange={(deptId) => { setSelectedDept(deptId); setSelectedSection(''); setSelectedTeam(''); setViewLevel('department'); }} onSectionChange={(sectionId) => { setSelectedSection(sectionId); setSelectedTeam(''); setViewLevel('section'); }} onTeamChange={(teamId) => { setSelectedTeam(teamId); setViewLevel('team'); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center p-6 glass-card rounded-xl border-border/50">
        <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{getLevelTitle()}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <p className="text-textMuted font-medium">{leaderboard.length} participants competing</p>
        </div>
      </div>

      {topPerformers.length >= 3 && (
        <div className="glass-card rounded-2xl relative overflow-hidden mt-6 md:mt-12 mb-4 md:mb-8 border border-yellow-500/20">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none"></div>
          <div className="p-4 md:p-6 border-b border-border/50 text-center">
            <h3 className="text-2xl font-display font-bold text-white flex items-center justify-center gap-3">
              <span className="text-2xl">🏆</span> Hall of Fame <span className="text-2xl">🏆</span>
            </h3>
          </div>
          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 max-w-4xl mx-auto podium-container">

              {/* Rank 2 - Silver */}
              <div className="text-center w-full md:w-1/3 order-2 md:order-1 flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-[0_0_30px_rgba(148,163,184,0.3)] border-4 border-surface ring-2 ring-slate-400/50 z-10 transition-transform hover:scale-110 duration-300">
                  <Medal className="h-10 w-10 md:h-12 md:w-12 text-white" />
                </div>
                <div className="glass-card border-t-4 border-t-slate-400 rounded-xl p-5 w-full relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-500/10 to-transparent"></div>
                  <div className="text-3xl font-display font-black text-slate-300 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">#2</div>
                  <Link to={`/individual/${topPerformers[1].memberId}`} className="font-bold text-white truncate text-lg block hover:text-brand-400 transition-colors">{topPerformers[1].memberName}</Link>
                  {viewLevel !== 'team' && <Link to={`/team/${topPerformers[1].deptId}/${topPerformers[1].sectionId}/${topPerformers[1].teamId}`} className="text-xs text-textMuted truncate mt-1 block hover:text-brand-400 transition-colors">{topPerformers[1].teamId}</Link>}
                  <div className="text-xl font-bold text-slate-300 mt-3 pt-3 border-t border-white/10">{topPerformers[1].totalSolved.toLocaleString()}</div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider mt-1">Problems</div>
                </div>
              </div>

              {/* Rank 1 - Gold */}
              <div className="text-center w-full md:w-1/3 order-1 md:order-2 flex flex-col items-center transform -translate-y-4 md:-translate-y-8 relative z-20">
                <div className="absolute -top-12 opacity-50 w-full flex justify-center pointer-events-none">
                  <div className="w-32 h-32 bg-yellow-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
                </div>
                <div className="w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-[0_0_40px_rgba(234,179,8,0.5)] border-4 border-surface ring-4 ring-yellow-500/50 relative transition-transform hover:scale-110 duration-300">
                  <Crown className="h-14 w-14 md:h-16 md:w-16 text-white drop-shadow-md" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-surface rounded-full flex items-center justify-center border-2 border-yellow-500">
                    <span className="text-yellow-500 font-bold text-xl leading-none pt-1">🥇</span>
                  </div>
                </div>
                <div className="glass-card border-t-4 border-t-yellow-500 rounded-xl p-6 w-full relative overflow-hidden shadow-2xl shadow-yellow-500/10 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent"></div>
                  <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-2 drop-shadow-sm group-hover:scale-110 transition-transform">#1</div>
                  <Link to={`/individual/${topPerformers[0].memberId}`} className="font-bold text-white text-xl truncate block hover:text-yellow-400 transition-colors uppercase">{topPerformers[0].memberName}</Link>
                  {viewLevel !== 'team' && <Link to={`/team/${topPerformers[0].deptId}/${topPerformers[0].sectionId}/${topPerformers[0].teamId}`} className="text-sm text-yellow-200/80 truncate mt-1 font-medium block hover:text-yellow-400 transition-colors">{topPerformers[0].teamId}</Link>}
                  <div className="text-3xl font-black text-yellow-400 mt-4 pt-4 border-t border-yellow-500/20 drop-shadow-md">{topPerformers[0].totalSolved.toLocaleString()}</div>
                  <div className="text-xs text-yellow-500/80 uppercase tracking-wider mt-1 font-bold">Total Problems</div>
                </div>
              </div>

              {/* Rank 3 - Bronze */}
              <div className="text-center w-full md:w-1/3 order-3 flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-[0_0_30px_rgba(217,119,6,0.3)] border-4 border-surface ring-2 ring-amber-700/50 z-10 transition-transform hover:scale-110 duration-300">
                  <Award className="h-10 w-10 md:h-12 md:w-12 text-white" />
                </div>
                <div className="glass-card border-t-4 border-t-amber-700 rounded-xl p-5 w-full relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-700/10 to-transparent"></div>
                  <div className="text-3xl font-display font-black text-amber-600 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">#3</div>
                  <Link to={`/individual/${topPerformers[2].memberId}`} className="font-bold text-white truncate text-lg block hover:text-amber-400 transition-colors">{topPerformers[2].memberName}</Link>
                  {viewLevel !== 'team' && <Link to={`/team/${topPerformers[2].deptId}/${topPerformers[2].sectionId}/${topPerformers[2].teamId}`} className="text-xs text-textMuted truncate mt-1 block hover:text-amber-400 transition-colors">{topPerformers[2].teamId}</Link>}

                  <div className="text-xl font-bold text-amber-500 mt-3 pt-3 border-t border-white/10">{topPerformers[2].totalSolved.toLocaleString()}</div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider mt-1">Problems</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card hover className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mr-4"><Users className="h-6 w-6 text-blue-400" /></div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-textMuted mb-1">Total Participants</p>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{leaderboard.length}</p>
            </div>
          </div>
        </Card>
        <Card hover className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mr-4"><Target className="h-6 w-6 text-green-400" /></div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-textMuted mb-1">Total Problems</p>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{leaderboard.reduce((sum, entry) => sum + entry.totalSolved, 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card hover className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mr-4"><Crown className="h-6 w-6 text-purple-400" /></div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-textMuted mb-1">Team Leaders</p>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{leaderboard.filter(e => e.isTeamLead).length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5" />Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardTable data={leaderboard} showTeamColumn={viewLevel !== 'team'} />
        </CardContent>
      </Card>

      {leaderboard.length === 0 && (
        <Card><CardContent className="text-center py-12"><Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3><p className="text-gray-600">No performance data found for the selected scope.</p></CardContent></Card>
      )}
    </div>
  );
};

export default Leaderboard;
