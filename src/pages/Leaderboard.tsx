import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DailyTotal } from '../types';
import { createLeaderboard } from '../utils/dataProcessing';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LeaderboardTable from '../components/Tables/LeaderboardTable';
import HierarchySelector from '../components/Navigation/HierarchySelector';
import { Trophy, Medal, Award, Crown, ChevronRight, Users, TrendingUp } from 'lucide-react';

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

    try {
      if (viewLevel === 'department' && selectedDept) {
        filteredData = globalData.filter((d: any) => 
          String(d.deptId || '').toLowerCase() === selectedDept.toLowerCase()
        );
      } else if (viewLevel === 'section' && selectedDept && selectedSection) {
        filteredData = globalData.filter((d: any) => 
          String(d.deptId || '').toLowerCase() === selectedDept.toLowerCase() && 
          String(d.sectionId || '').toLowerCase() === selectedSection.toLowerCase()
        );
      } else if (viewLevel === 'team' && selectedDept && selectedSection && selectedTeam) {
        filteredData = globalData.filter((d: any) => 
          String(d.deptId || '').toLowerCase() === selectedDept.toLowerCase() && 
          String(d.sectionId || '').toLowerCase() === selectedSection.toLowerCase() && 
          String(d.teamId || '').toLowerCase() === selectedTeam.toLowerCase()
        );
      }
    } catch (err) {
      console.error("Filter failed", err);
      filteredData = [];
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
           {/* Rank 2 - Silver */}
           <div className="order-2 md:order-1 bg-surface border border-border rounded-[2rem] p-8 text-center relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl border-t-slate-400">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Medal className="w-24 h-24 text-slate-400" />
              </div>
              <div className="w-20 h-20 bg-slate-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                 <span className="text-3xl font-black text-slate-400">🥈</span>
              </div>
              <div className="text-4xl font-black text-slate-400 mb-2 opacity-50">#2</div>
              <Link to={`/individual/${topPerformers[1].memberId}`} className="text-xl font-bold text-textMain hover:text-brand-500 mb-1 block transition-colors">{topPerformers[1].memberName}</Link>
              <div className="text-xs text-textMuted uppercase font-black tracking-widest mb-4">{topPerformers[1].teamId}</div>
              <div className="text-3xl font-black text-textMain mb-1">{topPerformers[1].totalSolved}</div>
              <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest">Total Problems</div>
           </div>

           {/* Rank 1 - Gold */}
           <div className="order-1 md:order-2 bg-gradient-to-br from-brand-600/20 via-surface to-background border-2 border-yellow-500/50 rounded-[2.5rem] p-10 text-center relative overflow-hidden group hover:-translate-y-3 transition-all duration-500 shadow-2xl scale-105 z-10">
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent"></div>
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Crown className="w-32 h-32 text-yellow-500" />
              </div>
              <div className="w-24 h-24 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(234,179,8,0.3)] -rotate-3 group-hover:rotate-0 transition-transform">
                 <span className="text-4xl font-black text-yellow-500">🥇</span>
              </div>
              <div className="text-5xl font-black text-yellow-500 mb-3 drop-shadow-sm">#1</div>
              <Link to={`/individual/${topPerformers[0].memberId}`} className="text-2xl font-black text-textMain hover:text-brand-500 mb-1 block transition-colors uppercase tracking-tight">{topPerformers[0].memberName}</Link>
              <div className="text-sm text-yellow-500/80 uppercase font-black tracking-widest mb-6">{topPerformers[0].teamId}</div>
              <div className="text-4xl font-black text-textMain mb-1">{topPerformers[0].totalSolved}</div>
              <div className="text-[11px] text-textMuted uppercase font-black tracking-widest">Master Score</div>
           </div>

           {/* Rank 3 - Bronze */}
           <div className="order-3 bg-surface border border-border rounded-[2rem] p-8 text-center relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl border-t-amber-600">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Award className="w-24 h-24 text-amber-600" />
              </div>
              <div className="w-20 h-20 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg -rotate-3 group-hover:rotate-0 transition-transform">
                 <span className="text-3xl font-black text-amber-600">🥉</span>
              </div>
              <div className="text-4xl font-black text-amber-600 mb-2 opacity-50">#3</div>
              <Link to={`/individual/${topPerformers[2].memberId}`} className="text-xl font-bold text-textMain hover:text-brand-500 mb-1 block transition-colors">{topPerformers[2].memberName}</Link>
              <div className="text-xs text-textMuted uppercase font-black tracking-widest mb-4">{topPerformers[2].teamId}</div>
              <div className="text-3xl font-black text-textMain mb-1">{topPerformers[2].totalSolved}</div>
              <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest">Total Problems</div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Performance Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable data={leaderboard} showTeamColumn={viewLevel !== 'team'} />
            </CardContent>
          </Card>
        </div>

        {/* Movers Section */}
        <div className="space-y-6">
           <div className="bg-surface border border-border rounded-[2rem] p-8 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <TrendingUp className="w-24 h-24 text-green-500" />
              </div>
              <h3 className="text-lg font-black text-textMain uppercase tracking-widest flex items-center gap-2 mb-6">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 Fastest Risers
              </h3>
              <div className="space-y-4">
                 {leaderboard.filter(m => (m.totalDailyIncrease || 0) > 10).slice(0, 5).map((m) => (
                    <div key={m.memberId} className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border/50 group hover:border-green-500/30 transition-all">
                       <div className="flex items-center gap-3">
                          <div className="text-xs font-black text-green-500">+{m.totalDailyIncrease}</div>
                          <div>
                             <Link to={`/individual/${m.memberId}`} className="text-sm font-bold text-textMain hover:text-brand-500 transition-colors">{m.memberName}</Link>
                             <div className="text-[10px] text-textMuted uppercase font-bold">{m.deptId}</div>
                          </div>
                       </div>
                       <div className="text-green-500 text-sm font-black">↑</div>
                    </div>
                 ))}
                 {leaderboard.filter(m => (m.totalDailyIncrease || 0) > 10).length === 0 && (
                    <div className="text-center py-8 text-textMuted text-xs font-bold uppercase tracking-widest">Awaiting daily updates...</div>
                 )}
              </div>
           </div>

           {/* Quick Stats Summary */}
           <div className="grid grid-cols-1 gap-4">
              <div className="bg-surface border border-border rounded-[2rem] p-6 flex items-center gap-4 group hover:border-brand-500/30 transition-all">
                 <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand-500" />
                 </div>
                 <div>
                    <div className="text-2xl font-black text-textMain">{leaderboard.length}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold">Total Competing</div>
                 </div>
              </div>
              <div className="bg-surface border border-border rounded-[2rem] p-6 flex items-center gap-4 group hover:border-amber-500/30 transition-all">
                 <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-amber-500" />
                 </div>
                 <div>
                    <div className="text-2xl font-black text-textMain">{leaderboard.filter(e => e.isTeamLead).length}</div>
                    <div className="text-[10px] text-textMuted uppercase font-bold">Team Leaders</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {leaderboard.length === 0 && (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-textMuted opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No data found for this scope</h3>
            <p className="text-textMuted max-w-sm mx-auto mb-8">We couldn't find any performance records matching your current filters. Try selecting a different department or view level.</p>
            <button 
              onClick={() => {
                setViewLevel('global');
                setSelectedDept('');
                setSelectedSection('');
                setSelectedTeam('');
              }}
              className="px-6 py-2.5 bg-gradient-hero text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform"
            >
              Reset to Global View
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leaderboard;
