import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { createDepartmentComparison } from '../utils/dataProcessing';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/ui/StatCard';
import AttentionPanel from '../components/AttentionPanel';
import DepartmentTable from '../components/DepartmentTable';
import DepartmentDrawer from '../components/DepartmentDrawer';
import DepartmentCard from '../components/DepartmentCard';

import { Building2, ChevronRight, Users, Trophy, RefreshCcw, Search, SlidersHorizontal, LayoutGrid } from 'lucide-react';

const AllDepartments: React.FC = () => {
  const { data, loading: globalLoading, refreshData } = useData();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer State mapped to clicked Department from either the Table or Intelligence Grid
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);

  useEffect(() => {
    if (globalLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [globalLoading]);

  const handleSync = async () => {
    setSyncing(true);
    await refreshData();
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-textMuted font-bold uppercase tracking-widest text-xs">Aggregating Organizational Telemetrics...</span>
        </div>
      </div>
    );
  }

  // Engine Level 1: Backend Parsing (Extract macro-level Departments)
  const fullComparison = createDepartmentComparison(data);
  
  // Engine Level 2: Frontend Data Filtration (Search limits)
  const filteredDepartments = fullComparison.filter(dept => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      // Search maps deeply tracking nested teams as well, allowing global search from Macro level
      const matchesNestedTeam = dept.nestedTeams?.some((t: any) => t.teamName.toLowerCase().includes(lowerQ));
      return (
         dept.deptName.toLowerCase().includes(lowerQ) || matchesNestedTeam
      );
  });

  // Engine Level 3: Realtime Executive Metrics Calculation (GLOBAL ORG)
  const totalDepartments = filteredDepartments.length;
  const totalTeamsGlobally = filteredDepartments.reduce((acc, d) => acc + d.totalTeams, 0);
  const activeMembersAggregated = filteredDepartments.reduce((acc, d) => acc + d.totalMembers, 0);
  
  // Best department based on avg performance calculation strictly
  const topDepartmentString = [...filteredDepartments].sort((a,b) => b.avgPerMember - a.avgPerMember)[0]?.deptName || 'Loading Pipeline';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative pb-16">
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* 🧭 TOP NAV + CONTEXT BAR  */}
      <nav className="flex flex-col md:flex-row items-center justify-between bg-surface w-full p-4 rounded-2xl border border-border shadow-soft gap-4">
        <div className="flex items-center space-x-2 text-sm text-textMuted w-full md:w-auto overflow-x-auto no-scrollbar">
            <Link to="/" className="hover:text-textMain hover:bg-border/50 px-3 py-1.5 rounded transition-all font-bold shrink-0">Dashboard</Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="font-black text-textMain flex items-center gap-2 px-3 py-1.5 bg-background border border-border/50 rounded shadow-sm shrink-0">
                <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(14,165,233,1)]"></div> 
                All Departments 
            </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none group-focus-within:text-brand-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search orgs or squads..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 text-textMain transition-all text-sm font-bold placeholder-textMuted/50 outline-none shadow-inner" 
               />
            </div>
            
            <button className="p-2 bg-background border border-border rounded-xl hover:bg-border/50 hover:text-textMain text-textMuted transition-colors group relative" title="Advanced Filters">
                <SlidersHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
        </div>
      </nav>

      {/* HEADER OVERVIEW MAP */}
      <div className="px-2 text-center md:text-left">
         <h1 className="text-2xl md:text-4xl font-black text-textMain tracking-tight">Department Intelligence</h1>
         <p className="text-textMuted mt-2 max-w-2xl font-medium text-xs md:text-sm mx-auto md:mx-0">Real-time organizational structural velocities, dominance matrices, and macro-level risk factors.</p>
      </div>

      {/* 📊 EXECUTIVE OVERVIEW ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Framework Hubs" 
            value={totalDepartments} 
            icon={Building2} 
            colorTheme="brand" 
        />
        <StatCard 
            title="Total Active Squads" 
            value={totalTeamsGlobally} 
            icon={LayoutGrid} 
            colorTheme="blue" 
        />
        <StatCard 
            title="Active Org Roster" 
            value={activeMembersAggregated} 
            icon={Users} 
            colorTheme="purple" 
        />
        <StatCard 
            title="Vanguard Department" 
            value={topDepartmentString} 
            icon={Trophy} 
            colorTheme="amber" 
            highlight={true}
        />
      </div>

      {/* 🧬 DEPARTMENT INTELLIGENCE GRID (Cards replacing standard lists) */}
      <div className="mt-8 px-2 space-y-4">
         <h2 className="text-lg font-black text-textMain uppercase tracking-widest flex items-center gap-2">
            Regional Hub Vectors
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredDepartments.map(dept => (
                <DepartmentCard key={dept.deptId} department={dept} onClick={() => setSelectedDepartment(dept)} />
             ))}
         </div>
      </div>

      {/* 🚨 ATTENTION ZONE (AI Insights running directly over nested distributions) */}
      <AttentionPanel departments={filteredDepartments} />

      {/* 📋 SMART DEPARTMENT TABLE */}
      <div className="mt-8 relative z-20">
         <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-lg font-black text-textMain uppercase tracking-widest flex items-center gap-2">
                Organizational Hierarchy <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 text-[10px] rounded border border-brand-500/20">{totalDepartments} Nodes</span>
            </h2>
         </div>
         <DepartmentTable data={filteredDepartments} onRowClick={(dept) => setSelectedDepartment(dept)} />
      </div>

      {/* 📂 DEEP DIVE MODAL/DRAWER */}
      <DepartmentDrawer isOpen={!!selectedDepartment} onClose={() => setSelectedDepartment(null)} department={selectedDepartment} />

    </div>
  );
};

export default AllDepartments;
