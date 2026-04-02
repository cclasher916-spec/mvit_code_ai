import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DailyTotal } from '../types';
import { getTeamStats, createTeamComparison } from '../utils/dataProcessing';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HierarchySelector from '../components/Navigation/HierarchySelector';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Trophy, Target, ChevronRight, Award } from 'lucide-react';
import { getLatestByMember } from '../utils/dataProcessing';

const Analytics: React.FC = () => {
  const { data: globalData, hierarchy, loading: globalLoading } = useData();
  const [data, setData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewLevel, setViewLevel] = useState<'organization' | 'department' | 'section' | 'team'>('organization');

  useEffect(() => {
    if (globalLoading) {
      setLoading(true);
      return;
    }

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
        <span className="ml-3 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  // Prepare chart data
  const latest = getLatestByMember(data);
  const teamComparison = createTeamComparison(data);
  const stats = getTeamStats(data);

  // Platform distribution data
  const platformData = [
    { name: 'LeetCode', value: latest.reduce((sum, m) => sum + m.leetcodeTotal, 0), color: '#FFA500' },
    { name: 'SkillRack', value: latest.reduce((sum, m) => sum + m.skillrackTotal, 0), color: '#00D4AA' },
    { name: 'CodeChef', value: latest.reduce((sum, m) => sum + m.codechefTotal, 0), color: '#D4957A' },
    { name: 'HackerRank', value: latest.reduce((sum, m) => sum + m.hackerrankTotal, 0), color: '#00EA64' },
  ];

  // Performance trends (mock data - you can implement actual trend calculation)
  const trendData = teamComparison.slice(0, 10).map(team => ({
    name: team.teamName,
    total: team.totalSolved,
    average: team.avgPerMember,
    members: team.members
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-textMuted bg-surface/50 w-fit px-4 py-2 rounded-full border border-border">
        <Link to="/" className="hover:text-brand-400 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-textMain flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-pink"></div> Analytics
        </span>
      </nav>

      {/* Hero Section */}
      <div className="glass-card rounded-2xl p-5 md:p-8 relative overflow-hidden group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-accent-pink/10 opacity-50"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2 tracking-tight">
            📊 Performance Analytics
          </h1>
          <p className="text-textMuted max-w-xl">
            Deep insights and trends across your coding performance ecosystem. Discover platform preferences, performance growth, and strategic areas for improvement.
          </p>
        </div>
      </div>

      {/* View Level Selector */}
      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-accent-pink/30">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-accent-pink/10 mr-3">
              <svg className="w-5 h-5 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            Analysis Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">View Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-border/50 p-1 rounded-xl bg-surface/30">
                  {(['organization', 'department', 'section', 'team'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setViewLevel(level)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all capitalize font-medium ${viewLevel === level
                        ? 'bg-gradient-hero text-white shadow-lg shadow-brand-500/20'
                        : 'text-textMuted hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {level === 'organization' ? 'All' : level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <HierarchySelector
                hierarchy={hierarchy}
                selectedDept={selectedDept}
                selectedSection={selectedSection}
                selectedTeam={selectedTeam}
                onDepartmentChange={(deptId) => {
                  setSelectedDept(deptId);
                  setSelectedSection('');
                  setSelectedTeam('');
                  setViewLevel('department');
                }}
                onSectionChange={(sectionId) => {
                  setSelectedSection(sectionId);
                  setSelectedTeam('');
                  setViewLevel('section');
                }}
                onTeamChange={(teamId) => {
                  setSelectedTeam(teamId);
                  setViewLevel('team');
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card hover className="bg-gradient-to-br from-brand-600/10 to-transparent border-brand-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 md:p-4 rounded-xl bg-brand-500/20 shadow-inner border border-brand-500/30">
              <Users className="h-6 w-6 md:h-7 md:w-7 text-brand-400" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Active Members</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{stats.totalMembers}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 md:p-4 rounded-xl bg-green-500/20 shadow-inner border border-green-500/30">
              <Target className="h-6 w-6 md:h-7 md:w-7 text-green-400" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Total Problems</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{stats.totalProblems.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-accent-purple/10 to-transparent border-accent-purple/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 md:p-4 rounded-xl bg-accent-purple/20 shadow-inner border border-accent-purple/30">
              <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-accent-purple" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Average Score</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{stats.avgPerMember}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-4 md:p-6 relative z-10">
            <div className="p-3 md:p-4 rounded-xl bg-yellow-500/20 shadow-inner border border-yellow-500/30">
              <Trophy className="h-6 w-6 md:h-7 md:w-7 text-yellow-500" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Top Score</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-3xl font-display font-bold text-white leading-none">{stats.topPerformerScore}</p>
              </div>
              <p className="text-xs text-yellow-500/80 font-medium truncate max-w-[120px] mt-1 pr-2">{stats.topPerformer}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Performance Chart */}
        <Card hover className="border-border/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg">Team Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="total" fill="url(#colorTotal)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="average" fill="url(#colorAverage)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card hover className="border-border/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-64 md:h-80 w-full flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.05)"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-white">{stats.totalProblems.toLocaleString()}</span>
                <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {platformData.map(platform => (
                <div key={platform.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                  <span className="text-sm font-medium text-textMuted">{platform.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card hover className="border-border/50">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg">Performance Trends Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff' }} />
                <Line type="monotone" dataKey="average" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 text-brand-400 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all">
            <Target className="w-6 h-6" />
          </div>
          <div className="text-3xl font-display font-bold text-white mb-1">
            {Math.round(stats.totalProblems / Math.max(stats.totalMembers, 1))}
          </div>
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider">Problems / Member</div>
        </div>

        <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 group-hover:bg-green-500/20 transition-all">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-xl font-display font-bold text-white mb-1 truncate max-w-full px-2 mt-2 h-8 flex items-center">
            {platformData.reduce((max, p) => p.value > max.value ? p : max).name}
          </div>
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider">Top Platform</div>
        </div>

        <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center mb-4 text-accent-purple group-hover:scale-110 group-hover:bg-accent-purple/20 transition-all">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-3xl font-display font-bold text-white mb-1">
            {teamComparison.length}
          </div>
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider">Active Teams</div>
        </div>

        <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-3xl font-display font-bold text-white mb-1">
            {latest.filter(m => m.totalSolved > 0).length}
          </div>
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider">Contributing Members</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;