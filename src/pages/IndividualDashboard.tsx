import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DailyTotal } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { User, Calendar, Target, ChevronRight, Award, TrendingUp } from 'lucide-react';

const IndividualDashboard: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const { data: globalData, loading: globalLoading } = useData();
  const [memberData, setMemberData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<DailyTotal | null>(null);

  useEffect(() => {
    if (globalLoading) {
      setLoading(true);
      return;
    }

    if (memberId && globalData) {
      const memberRecords = globalData.filter((record: any) => record.memberId === memberId || record.memberName === memberId);
      if (memberRecords.length > 0) {
        setMemberData(memberRecords);
        setMemberInfo(memberRecords[0]);
      }
    }
    setLoading(false);
  }, [globalData, globalLoading, memberId]);

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /><span className="ml-3 text-gray-600">Loading individual dashboard...</span></div>);
  }

  if (!memberInfo || memberData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card><CardContent className="text-center py-12"><User className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">Member not found</h3><p className="text-gray-600">No data available for member ID: {memberId}</p><Link to="/" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">Return to Dashboard</Link></CardContent></Card>
      </div>
    );
  }

  const sortedData = memberData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const chartData = sortedData.slice().reverse().map(record => ({ date: record.date, total: record.totalSolved, leetcode: record.leetcodeTotal, skillrack: record.skillrackTotal, codechef: record.codechefTotal, hackerrank: record.hackerrankTotal, daily: record.totalDailyIncrease }));

  const latest = sortedData[0];
  const oldest = sortedData[sortedData.length - 1];
  const totalGrowth = latest.totalSolved - (oldest?.totalSolved || 0);
  const avgDaily = memberData.length > 0 ? totalGrowth / memberData.length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <nav className="flex items-center space-x-2 text-sm text-textMuted bg-surface/50 w-fit px-4 py-2 rounded-full border border-border">
        <Link to="/" className="hover:text-brand-400 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-textMain flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500"></div> {memberInfo.memberName}
        </span>
      </nav>

      <div className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-white/5 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r gap-6 from-brand-500/10 to-accent-purple/10 opacity-50"></div>
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 tracking-tight">
              👤 {memberInfo.memberName}
            </h1>
            <p className="text-textMuted text-lg max-w-xl">Individual Performance Dashboard</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-surface border border-border rounded-lg text-sm font-semibold text-white">{memberInfo.teamId}</span>
              <span className="px-3 py-1 bg-surface border border-border rounded-lg text-sm font-semibold text-white">{memberInfo.sectionId}</span>
              <span className="px-3 py-1 bg-surface border border-border rounded-lg text-sm font-semibold text-white">{memberInfo.deptId}</span>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              {latest.leetcodeUrl && (
                <a href={latest.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFA500]/10 border border-[#FFA500]/20 rounded-lg text-sm font-medium text-[#FFA500] hover:bg-[#FFA500]/20 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#FFA500]"></span> LeetCode
                </a>
              )}
              {latest.skillrackUrl && (
                <a href={latest.skillrackUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00D4AA]/10 border border-[#00D4AA]/20 rounded-lg text-sm font-medium text-[#00D4AA] hover:bg-[#00D4AA]/20 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#00D4AA]"></span> SkillRack
                </a>
              )}
              {latest.codechefUrl && (
                <a href={latest.codechefUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4957A]/10 border border-[#D4957A]/20 rounded-lg text-sm font-medium text-[#D4957A] hover:bg-[#D4957A]/20 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#D4957A]"></span> CodeChef
                </a>
              )}
              {latest.hackerrankUrl && (
                <a href={latest.hackerrankUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00EA64]/10 border border-[#00EA64]/20 rounded-lg text-sm font-medium text-[#00EA64] hover:bg-[#00EA64]/20 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#00EA64]"></span> HackerRank
                </a>
              )}
              {latest.githubUrl && (
                <a href={latest.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-400/10 border border-gray-400/20 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-400/20 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> GitHub
                </a>
              )}
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl border-white/5 text-right flex flex-col items-end shrink-0 min-w-[200px]">
            <div className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">Total Problems Solved</div>
            <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-hero drop-shadow-sm">{latest.totalSolved}</div>
            {totalGrowth > 0 && (<div className="text-green-400 text-sm font-semibold mt-2 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20"><TrendingUp className="w-4 h-4" /> +{totalGrowth} growth</div>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card hover className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-6 relative z-10">
            <div className="p-4 rounded-xl bg-blue-500/20 shadow-inner border border-blue-500/30">
              <Target className="h-7 w-7 text-blue-400" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Current Total</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{latest.totalSolved}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-6 relative z-10">
            <div className="p-4 rounded-xl bg-green-500/20 shadow-inner border border-green-500/30">
              <TrendingUp className="h-7 w-7 text-green-400" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Total Growth</p>
              <p className="text-3xl font-display font-bold text-white mt-1">+{totalGrowth}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-6 relative z-10">
            <div className="p-4 rounded-xl bg-purple-500/20 shadow-inner border border-purple-500/30">
              <Calendar className="h-7 w-7 text-purple-400" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Avg Daily</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{avgDaily.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="flex items-center p-6 relative z-10">
            <div className="p-4 rounded-xl bg-amber-500/20 shadow-inner border border-amber-500/30">
              <Award className="h-7 w-7 text-amber-500" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Active Days</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{memberData.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card hover className="border-border/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg">Progress Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(date) => new Date(date).toLocaleDateString()} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#fff' }} labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} name="Total Problems" dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card hover className="border-border/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Platforms', leetcode: latest.leetcodeTotal, skillrack: latest.skillrackTotal, codechef: latest.codechefTotal, hackerrank: latest.hackerrankTotal }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="leetcode" fill="#FFA500" name="LeetCode" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="skillrack" fill="#00D4AA" name="SkillRack" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="codechef" fill="#D4957A" name="CodeChef" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hackerrank" fill="#00EA64" name="HackerRank" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card hover className="border-border/50">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {memberData.slice().reverse().slice(0, 10).map((record, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface/50 border border-border/50 rounded-xl hover:bg-white/5 transition-colors gap-4">
                <div className="flex items-center">
                  <div className="p-3 bg-brand-500/10 rounded-lg mr-4 border border-brand-500/20 text-brand-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{record.date}</div>
                    <div className="text-sm font-medium text-textMuted mt-0.5 flex items-center gap-1">
                      Total: <span className="text-white">{record.totalSolved}</span>
                      {record.totalDailyIncrease > 0 && <span className="text-green-400 ml-1">(+{record.totalDailyIncrease})</span>}
                    </div>
                  </div>
                </div>
                <div className="sm:text-right flex flex-wrap gap-2 sm:gap-0 sm:block">
                  <div className="flex items-center gap-3 text-xs font-medium text-textMuted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#FFA500]"></span> 
                      {record.leetcodeUrl ? (
                         <a href={record.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">LC: {record.leetcodeTotal}</a>
                      ) : (
                         `LC: ${record.leetcodeTotal}`
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00D4AA]"></span> 
                      {record.skillrackUrl ? (
                         <a href={record.skillrackUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">SR: {record.skillrackTotal}</a>
                      ) : (
                         `SR: ${record.skillrackTotal}`
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4957A]"></span> 
                      {record.codechefUrl ? (
                         <a href={record.codechefUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">CC: {record.codechefTotal}</a>
                      ) : (
                         `CC: ${record.codechefTotal}`
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00EA64]"></span> 
                      {record.hackerrankUrl ? (
                         <a href={record.hackerrankUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">HR: {record.hackerrankTotal}</a>
                      ) : (
                         `HR: ${record.hackerrankTotal}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualDashboard;
