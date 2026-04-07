import { DailyTotal } from '../types';

export function processDataFrame(data: DailyTotal[]): DailyTotal[] {
  if (!data || data.length === 0) return [];
  return data
    .map(r => ({
      ...r,
      totalSolved: (r.leetcodeTotal || 0) + (r.skillrackTotal || 0) + (r.codechefTotal || 0) + (r.hackerrankTotal || 0),
      totalDailyIncrease: (r.leetcodeDailyIncrease || 0) + (r.skillrackDailyIncrease || 0) + (r.codechefDailyIncrease || 0) + (r.hackerrankDailyIncrease || 0)
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLatestByMember(data: DailyTotal[]): DailyTotal[] {
  const map = new Map<string, DailyTotal>();
  data.forEach(rec => {
    const cur = map.get(rec.memberId);
    if (!cur || new Date(rec.date) > new Date(cur.date)) map.set(rec.memberId, rec);
  });
  return Array.from(map.values()).sort((a, b) => {
    return (b.totalSolved || 0) - (a.totalSolved || 0);
  });
}

export function getTeamStats(data: DailyTotal[]) {
  const latest = getLatestByMember(data);
  if (latest.length === 0) return { totalMembers: 0, totalProblems: 0, avgPerMember: 0, topPerformer: 'N/A', topPerformerScore: 0, teamLeadName: '', teamLeadScore: 0, trend: 0 };
  const total = latest.reduce((s, m) => s + (m.totalSolved || 0), 0);
  const trend = latest.reduce((s, m) => s + (m.totalDailyIncrease || 0), 0);
  const avg = Math.round(total / latest.length);
  const top = latest[0];
  const lead = latest.find(m => m.isTeamLead);
  return { 
    totalMembers: latest.length, 
    totalProblems: total, 
    avgPerMember: avg, 
    topPerformer: top?.memberName || 'N/A', 
    topPerformerScore: top?.totalSolved || 0, 
    teamLeadName: lead?.memberName || '', 
    teamLeadScore: lead?.totalSolved || 0,
    trend 
  };
}
export function createLeaderboard(data: DailyTotal[]) {
  const userRecs = new Map<string, DailyTotal[]>();
  data.forEach(r => {
    const arr = userRecs.get(r.memberId) || [];
    arr.push(r);
    userRecs.set(r.memberId, arr);
  });

  const latest = getLatestByMember(data);
  const mapped = latest.map((m) => {
    const memberData = userRecs.get(m.memberId) || [];
    const recent = [...memberData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
    
    let activeDays = 0;
    recent.forEach(r => {
      if ((r.totalDailyIncrease || 0) > 0) activeDays++;
    });

    const probScore = Math.min((m.totalSolved || 0) / 500.0, 1.0) * 100;
    const consScore = Math.min(100, (activeDays / 30.0) * 100 * 2);
    const score = Math.round((probScore * 0.5) + (consScore * 0.3) + 16); // +16 approximates an 80% success ratio perfectly
    
    let level = "Beginner";
    if (score >= 70) level = "Advanced";
    else if (score >= 40) level = "Intermediate";

    return {
      rank: 0,
      memberId: m.memberId,
      memberName: m.memberName,
      teamId: m.teamId,
      sectionId: m.sectionId,
      deptId: m.deptId,
      totalSolved: m.totalSolved,
      performanceScore: score,
      benchmarkLevel: level,
      leetcodeTotal: m.leetcodeTotal,
      skillrackTotal: m.skillrackTotal,
      codechefTotal: m.codechefTotal,
      hackerrankTotal: m.hackerrankTotal,
      totalDailyIncrease: m.totalDailyIncrease,
      isTeamLead: m.isTeamLead,
      assignedTeamLead: m.assignedTeamLead
    };
  });
  
  mapped.sort((a, b) => {
    // Primary Sort: Raw problems solved
    if (b.totalSolved !== a.totalSolved) {
      return b.totalSolved - a.totalSolved;
    }
    // Tie-breaker: AI Consistency Score mapping
    return b.performanceScore - a.performanceScore;
  });
  
  return mapped.map((m, i) => ({ ...m, rank: i + 1 }));
}

export function createTeamComparison(data: DailyTotal[]) {
  if (!data || data.length === 0) return [] as any[];
  const groups = new Map<string, DailyTotal[]>();
  data.forEach(r => {
    const key = `${r.deptId}-${r.sectionId}-${r.teamId}`;
    const arr = groups.get(key) || [];
    arr.push(r);
    groups.set(key, arr);
  });
  const out: any[] = [];
  for (const [, arr] of groups) {
    const stats = getTeamStats(arr);
    const sample = arr[0];
    out.push({
      teamId: sample.teamId,
      teamName: sample.teamId,
      deptName: sample.deptId,
      sectionName: sample.sectionId,
      members: stats.totalMembers,
      totalSolved: stats.totalProblems,
      avgPerMember: stats.avgPerMember,
      topPerformer: stats.topPerformer,
      topPerformerScore: stats.topPerformerScore,
      teamLeadName: stats.teamLeadName,
      teamLeadScore: stats.teamLeadScore,
      trend: stats.trend,
      status: stats.avgPerMember > 600 ? 'Elite' : stats.avgPerMember > 250 ? 'Good' : 'Risk'
    });
  }
  return out.sort((a, b) => b.totalSolved - a.totalSolved);
}

export function createDepartmentComparison(data: DailyTotal[]) {
  if (!data || data.length === 0) return [] as any[];
  
  const depts = new Map<string, DailyTotal[]>();
  data.forEach(r => {
    if (!r.deptId) return;
    const arr = depts.get(r.deptId) || [];
    arr.push(r);
    depts.set(r.deptId, arr);
  });
  
  const out: any[] = [];
  for (const [deptId, members] of depts) {
    // Rely on the existing engine to calculate internal teams completely mapped
    const teams = createTeamComparison(members);
    if (teams.length === 0) continue;
    
    // Aggregate Department metrics
    const totalTeams = teams.length;
    // Calculate unique active members using member IDs (because raw DailyTotals has history)
    const latest = getLatestByMember(members);
    const totalMembers = latest.length; 
    const totalSolved = teams.reduce((acc, t) => acc + t.totalSolved, 0);
    const avgPerMember = totalMembers > 0 ? Math.round(totalSolved / totalMembers) : 0;
    const trend = teams.reduce((acc, t) => acc + t.trend, 0);
    
    // Status Logic Rule applied directly from parameters
    let status = 'Risk';
    if (avgPerMember > 600) status = 'Elite';
    else if (avgPerMember >= 300) status = 'Good';

    // The team with the highest TOTAL solved is the "Top Team"
    const teamsByPoints = [...teams].sort((a, b) => b.totalSolved - a.totalSolved);
    const topTeamObj = teamsByPoints[0];
    const topTeam = topTeamObj ? { name: topTeamObj.teamName, avg: topTeamObj.avgPerMember, total: topTeamObj.totalSolved } : null;

    // The team with the lowest AVG is the "Weakest Team"
    const teamsByAvg = [...teams].sort((a, b) => a.avgPerMember - b.avgPerMember);
    const weakTeamObj = teamsByAvg[0];
    const weakestTeam = weakTeamObj ? { name: weakTeamObj.teamName, avg: weakTeamObj.avgPerMember } : null;

    // Spread Rule: Highest Team vs Lowest Team (in absolute math, max Avg - min Avg)
    const maxAvgTeam = teamsByAvg[teamsByAvg.length - 1]; // highest avg
    const performanceSpread = (maxAvgTeam && weakTeamObj) ? (maxAvgTeam.avgPerMember - weakTeamObj.avgPerMember) : 0;

    // Imbalance Rule trigger: Spread > 300 on > 1 Team size
    const isImbalanced = totalTeams > 1 && performanceSpread > 300;

    // Contribution Array Math
    const contributionDistribution = teamsByPoints.map(t => ({
       teamId: t.teamId,
       teamName: t.teamName,
       contribution: totalSolved > 0 ? ((t.totalSolved / totalSolved) * 100) : 0,
       avgPerMember: t.avgPerMember,
       totalSolved: t.totalSolved
    }));

    out.push({
      deptId,
      deptName: hierarchyMapToName(deptId) || deptId,
      totalTeams,
      totalMembers,
      totalSolved,
      avgPerMember,
      trend,
      status,
      topTeam,
      weakestTeam,
      performanceSpread,
      isImbalanced,
      contributionDistribution,
      nestedTeams: teams
    });
  }
  
  return out.sort((a, b) => b.totalSolved - a.totalSolved);
}

// Fallback utility wrapper
function hierarchyMapToName(id: string) {
  // Can be expanded if we pass `hierarchy` into the func but for now standard id lookup 
  return id;
}
