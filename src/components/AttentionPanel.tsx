import React, { useMemo } from 'react';
import { AlertTriangle, Rocket, Activity, CheckCircle } from 'lucide-react';

interface AttentionPanelProps {
  departments: any[]; // Expects DepartmentComparison structure
}

const AttentionPanel: React.FC<AttentionPanelProps> = ({ departments }) => {
  // Logic strictly mapped to Department executive view
  const insights = useMemo(() => {
    // 1. RISK: Highest Priority - Avg < 300
    const risk = [...departments]
      .filter((d) => d.avgPerMember < 300)
      .sort((a, b) => a.avgPerMember - b.avgPerMember)
      .slice(0, 3);

    // 2. IMBALANCE: Strategic Issue - high internal variance
    const imbalance = [...departments]
      .filter((d) => d.isImbalanced === true)
      .sort((a, b) => b.performanceSpread - a.performanceSpread) // Largest gap first
      .slice(0, 3);

    // 3. GROWTH: Positive Insight
    const growth = [...departments]
      .filter((d) => d.trend > 0)
      .sort((a, b) => b.trend - a.trend) // Highest trend first
      .slice(0, 3);

    return { risk, imbalance, growth };
  }, [departments]);

  if (insights.risk.length === 0 && insights.imbalance.length === 0 && insights.growth.length === 0) {
    return (
       <div className="bg-surface border border-brand-500/20 rounded-2xl p-8 text-center shadow-soft animate-fade-in flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 border border-brand-500/30 shadow-[0_0_25px_rgba(14,165,233,0.2)]">
            <CheckCircle className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="text-xl font-black text-textMain tracking-tight mb-1">Framework Stabilized</h3>
          <p className="text-sm font-bold text-textMuted uppercase tracking-widest">No critical issues across departments 🚀</p>
       </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in relative z-10 w-full overflow-hidden shrink-0">
      
      {/* priority 1: RISK ZONE */}
      <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 relative group overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.05)] h-full">
         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform -z-10">
           <AlertTriangle className="w-32 h-32 text-red-500" />
         </div>
         <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
           <AlertTriangle className="w-4 h-4" /> Systemic Risk (Avg &lt; 300)
         </h3>
         <div className="space-y-3 relative z-10">
           {insights.risk.length > 0 ? insights.risk.map(d => (
              <div key={d.deptId} className="flex justify-between items-center bg-red-950/20 px-4 py-3 rounded-xl border border-red-500/20 hover:bg-red-950/40 transition-colors">
                  <div>
                     <p className="font-bold text-sm text-textMain mb-0.5">{d.deptName}</p>
                     <p className="text-[10px] uppercase font-bold text-red-500/80 tracking-widest">Isolated Hazard</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-mono font-black text-red-400">{d.avgPerMember} avg</p>
                  </div>
              </div>
           )) : <p className="text-xs font-medium italic text-textMuted/50 border border-dashed border-border p-3 text-center rounded-xl">0 Operational Risks detected.</p>}
         </div>
      </div>

      {/* priority 2: IMBALANCE ZONE */}
      <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-6 relative group overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)] h-full">
         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform -z-10">
           <Activity className="w-32 h-32 text-amber-500" />
         </div>
         <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
           <Activity className="w-4 h-4" /> Inequality Detected
         </h3>
         <div className="space-y-3 relative z-10">
           {insights.imbalance.length > 0 ? insights.imbalance.map(d => (
              <div key={d.deptId} className="flex justify-between items-center bg-amber-950/20 px-4 py-3 rounded-xl border border-amber-500/20 hover:bg-amber-950/40 transition-colors">
                  <div>
                     <p className="font-bold text-sm text-textMain mb-0.5">{d.deptName}</p>
                     <p className="text-[10px] uppercase font-bold text-amber-500/80 tracking-widest">Large Internal Gap</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-mono font-black text-amber-400">Δ {d.performanceSpread} pts</p>
                  </div>
              </div>
           )) : <p className="text-xs font-medium italic text-textMuted/50 border border-dashed border-border p-3 text-center rounded-xl">0 Squad Inequalities detected.</p>}
         </div>
      </div>

      {/* priority 3: GROWTH ZONE */}
      <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-6 relative group overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.05)] h-full">
         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform group-hover:-translate-x-4 -z-10">
           <Rocket className="w-32 h-32 text-green-500" />
         </div>
         <h3 className="text-xs font-black text-green-500 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
           <Rocket className="w-4 h-4" /> Trajectory Vanguard
         </h3>
         <div className="space-y-3 relative z-10">
           {insights.growth.length > 0 ? insights.growth.map(d => (
              <div key={d.deptId} className="flex justify-between items-center bg-green-950/20 px-4 py-3 rounded-xl border border-green-500/20 hover:bg-green-950/40 transition-colors">
                  <div>
                     <p className="font-bold text-sm text-textMain mb-0.5">{d.deptName}</p>
                     <p className="text-[10px] uppercase font-bold text-green-500/80 tracking-widest">Operational Scaling</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-mono font-black text-green-400">+{d.trend} today</p>
                  </div>
              </div>
           )) : <p className="text-xs font-medium italic text-textMuted/50 border border-dashed border-border p-3 text-center rounded-xl">0 Upward Trajectories mapped.</p>}
         </div>
      </div>
      
    </div>
  );
};

export default AttentionPanel;
