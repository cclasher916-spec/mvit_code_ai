import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DailyTotal } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { User, Calendar, Target, ChevronRight, Award, TrendingUp, Bot, Clock, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/apiConfig';

const IndividualDashboard: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const { data: globalData, loading: globalLoading } = useData();
  const [memberData, setMemberData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<DailyTotal | null>(null);
  const [agentTasks, setAgentTasks] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Phase 2: Lightweight Test Mode
  const [testMode, setTestMode] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [testTimeLeft, setTestTimeLeft] = useState(30 * 60);

  useEffect(() => {
    let timer: any;
    if (testMode && testTimeLeft > 0) {
      timer = setInterval(() => {
        setTestTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testMode, testTimeLeft]);

  const startTest = async () => {
    try {
      const normalize = (str: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const targetName = normalize(memberInfo?.memberName || "");
      const res = await fetch(`${API_BASE_URL}/student/${targetName}/start_test`);
      if (res.ok) {
        const d = await res.json();
        setTestData(d.data);
        setTestTimeLeft(d.data.duration_minutes * 60);
        setTestMode(true);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    if (!memberInfo) return;
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/all_tasks`);
        if (res.ok && isMounted) {
          const data = await res.json();
          
          // Cross-platform normalization to ensure Google Sheet names ('Agilesh.S') match Firebase ('Agilesh S')
          const normalize = (str: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          const targetName = normalize(memberInfo.memberName);

          const userTasks = (data.tasks || []).filter((t: any) => normalize(t.member_name) === targetName);
          
          // Deduplicate the tasks so users don't see the exact same problem multiply assigned by the AI bot
          const uniqueTasks = [];
          const seenDesc = new Set();
          for (const ut of userTasks) {
              const uniqueKey = `${ut.description}-${ut.difficulty}`;
              if (!seenDesc.has(uniqueKey)) {
                  uniqueTasks.push(ut);
                  seenDesc.add(uniqueKey);
              }
          }
          
          setAgentTasks(uniqueTasks);
        }
      } catch (err) {
        console.error("Error fetching agent tasks via API", err);
      }
      
      try {
         const normalize = (str: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
         const targetName = normalize(memberInfo.memberName);
         const aRes = await fetch(`${API_BASE_URL}/student/${targetName}/analysis`);
         if (aRes.ok && isMounted) {
            const aData = await aRes.json();
            setAnalysis(aData.data);
         }
      } catch (err) {
         console.error("Error fetching analysis", err);
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Poll every 30 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [memberInfo]);

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

      {/* Test Mode Card */}
      {!testMode ? (
        <Card hover className="bg-gradient-to-r from-red-500/10 to-transparent border-red-500/20 mb-8 group overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform group-hover:scale-110 duration-500">
             <Target className="w-48 h-48 text-red-500" />
          </div>
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">Benchmark Test Mode</h3>
              <p className="text-sm text-textMuted mt-1 max-w-lg">Start a controlled evaluation session to demonstrate your skills. The system will assign 2 tasks dynamically.</p>
            </div>
            <button onClick={startTest} className="mt-4 md:mt-0 px-6 py-2 bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-white font-bold rounded-lg transition-colors border border-red-400 flex items-center gap-2">
              Start Evaluation <ChevronRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-500 border-2 bg-surface shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <Target className="w-64 h-64 text-red-500 animate-pulse-slow" />
          </div>
          <CardHeader className="bg-red-500/10 border-b border-red-500/20">
             <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
                <span className="animate-pulse">🔴</span> ACTIVE EVALUATION SESSION
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative z-10">
             <div className="flex flex-col md:flex-row items-start justify-between gap-8">
               <div className="flex-1 w-full space-y-4">
                 <p className="text-white font-medium">Solve the following assigned tasks. The system is monitoring your session parameters.</p>
                 {testData?.problems?.map((p: any, i: number) => (
                   <div key={i} className="p-4 bg-black/30 border border-white/10 rounded-lg shadow-inner">
                     <span className={`px-2 py-1 text-xs font-semibold rounded mb-3 inline-block ${p.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-400'}`}>{p.difficulty} Task</span>
                     <p className="font-mono text-sm text-blue-400 break-all border-l-2 border-blue-500/50 pl-3"><a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.url}</a></p>
                     <p className="mt-2 text-xs text-textMuted flex items-center gap-1"><span className="text-gray-400 uppercase tracking-wider">Platform:</span> {p.platform}</p>
                   </div>
                 ))}
               </div>
               <div className="w-full md:w-64 text-center shrink-0 flex flex-col items-center">
                 <div className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2">Time Remaining</div>
                 <div className="text-6xl font-mono font-black text-white bg-black/50 p-6 rounded-xl border border-red-500/30 font-display shadow-inner w-full flex justify-center">
                   {Math.floor(testTimeLeft / 60).toString().padStart(2, '0')}:{(testTimeLeft % 60).toString().padStart(2, '0')}
                 </div>
                 <button onClick={() => setTestMode(false)} className="mt-6 w-full py-3 bg-red-500 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2">
                   Submit Results <CheckCircle className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </CardContent>
        </Card>
      )}

      {/* AI Mentor Engine Card */}
      {analysis && (
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Bot className="w-48 h-48 text-indigo-400" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
             <div className="bg-surface/80 border border-border/50 p-6 rounded-xl shrink-0 text-center min-w-[150px]">
                <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2">Performance Score</div>
                <div className="text-5xl font-black text-white">{analysis.performance_score || 0}</div>
                <div className="text-xs text-textMuted mt-2 font-mono bg-black/30 p-1 rounded">Score v1</div>
                {analysis.weekly_delta_msg && (
                  <div className={`text-xs font-bold mt-2 px-2 py-1 rounded inline-block whitespace-nowrap ${analysis.weekly_delta_msg.startsWith('+') ? 'bg-green-500/20 text-green-400' : analysis.weekly_delta_msg.startsWith('-') ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {analysis.weekly_delta_msg}
                  </div>
                )}
             </div>
             
             <div className="flex-1 w-full space-y-4">
                {analysis.level_change_msg && (
                   <div className="px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-bold flex items-center gap-2 animate-bounce-slow shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      <TrendingUp className="w-5 h-5" /> {analysis.level_change_msg}
                   </div>
                )}
                <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Bot className="text-indigo-400 h-6 w-6"/> AI Mentor Assessment</h3>
                <div className="space-y-3 font-mono text-sm">
                   {analysis.mentor_feedback ? (
                       analysis.mentor_feedback.split('\n').map((line: string, i: number) => {
                           if (!line.trim()) return null;
                           let labelColor = "text-indigo-400";
                           if (line.startsWith("Observation:")) labelColor = "text-blue-400";
                           else if (line.startsWith("Issue:")) labelColor = "text-yellow-400";
                           else if (line.startsWith("Recommendation:")) labelColor = "text-green-400";
                           
                           const parts = line.split(":");
                           if (parts.length < 2) return <div key={i} className="text-gray-300">{line}</div>;
                           
                           return (
                               <div key={i} className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col md:flex-row gap-2 md:items-start">
                                  <span className={`font-bold ${labelColor} shrink-0 w-32`}>{parts[0]}:</span>
                                  <span className="text-gray-300">{parts.slice(1).join(":")}</span>
                               </div>
                           )
                       })
                   ) : (
                       <div className="text-gray-400 italic">No structured feedback generated yet.</div>
                   )}
                </div>
                
                {analysis.flags && analysis.flags.length > 0 && (
                   <div className="flex gap-2 mt-4">
                     {analysis.flags.map((f: string) => (
                         <span key={f} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full uppercase tracking-wider font-bold">Flag: {f.replace('_', ' ')}</span>
                     ))}
                   </div>
                )}

                {/* Phase 3: Skill & Topic Accountability Progression */}
                {analysis.skill_breakdown && Object.keys(analysis.skill_breakdown).length > 0 && (
                   <div className="mt-6 pt-6 border-t border-white/10 w-full">
                     <div className="flex flex-col md:flex-row gap-6">
                       <div className="flex-1">
                         <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-3">Topic Strengths Map</h4>
                         <div className="flex flex-wrap gap-2">
                            {Object.entries(analysis.skill_breakdown).map(([topic, strength]: [string, any]) => (
                              <div key={topic} className="px-3 py-1.5 bg-black/40 border border-white/5 rounded-md text-xs font-medium flex items-center gap-2">
                                <span className="text-gray-300">{topic}</span>
                                <span className={`font-bold uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded ${strength === 'Strong' ? 'bg-green-500/20 text-green-400' : strength === 'Moderate' ? 'bg-blue-500/20 text-blue-400' : strength === 'Emerging' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>{strength}</span>
                              </div>
                            ))}
                         </div>
                       </div>
                       <div className="shrink-0">
                          <div className="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-3">AI Intervention Loop Record</div>
                          <div className="text-xs font-mono text-white bg-black/50 p-3 rounded-lg border border-white/5">
                            {analysis.task_analytics || "No tasks recorded."}
                          </div>
                       </div>
                     </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

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
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">7-Day Consistency</p>
              <p className="text-xl font-display font-bold text-white mt-1">{analysis?.consistency_label || "No Data"}</p>
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
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Behavioral Integrity</p>
              <p className="text-3xl font-display font-bold text-white mt-1">{analysis?.integrity_score || 100}%</p>
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

      <Card hover className="border-border/50">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-400" /> AI Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {agentTasks.length === 0 ? (
             <p className="text-textMuted text-sm">No tasks assigned by the AI Agent yet.</p>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {agentTasks.map(task => {
                 const renderDescription = (text: string) => {
                     if (!text) return null;
                     const urlRegex = /(https?:\/\/[^\s]+)/g;
                     const parts = text.split(urlRegex);
                     return parts.map((part, i) => {
                         if (part.match(urlRegex)) {
                             return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/30 underline-offset-2 break-all" onClick={(e) => e.stopPropagation()}>{part}</a>;
                         }
                         return part;
                     });
                 };

                 return (
                 <div key={task.id} className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative overflow-hidden group">
                   <div className="flex justify-between items-start mb-3">
                     <span className={`px-2 py-1 text-xs font-semibold rounded ${task.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : task.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-400'}`}>{task.difficulty || 'Task'}</span>
                     <span className="text-xs text-textMuted font-mono">
                         {task.assigned_at?.split(' ')[0] || "Just now"}
                     </span>
                   </div>
                   <p className="text-sm text-white font-medium mb-4 line-clamp-3 leading-relaxed" title={task.description}>
                     {renderDescription(task.description)}
                   </p>
                   
                   <div className="flex items-center gap-2 text-xs font-semibold mb-3">
                     {task.status === 'completed' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/20">
                          <CheckCircle className="h-3 w-3" /> COMPLETED
                        </span>
                     ) : task.status === 'failed' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/20">
                          <Clock className="h-3 w-3" /> FAILED
                        </span>
                     ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/20">
                          <Clock className="h-3 w-3 animate-pulse" /> IN PROGRESS
                        </span>
                     )}
                     <span className="text-textMuted ml-auto text-[10px] uppercase tracking-wider bg-black/30 px-2 py-1 rounded">Assigned by AutoAgent</span>
                   </div>

                   {/* Verification Log rendering for users to see AI actions */}
                   {task.verification_log && (
                     <div className="mt-2 text-[10px] font-mono p-2 bg-black/40 rounded border border-white/5 text-emerald-400/80 leading-relaxed">
                       {task.verification_log}
                     </div>
                   )}
                 </div>
                 );
               })}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualDashboard;
