import React from 'react';
import { useData } from '../contexts/DataContext';
import MemberTable from '../components/MemberTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Database, Search, Filter } from 'lucide-react';

const StudentData: React.FC = () => {
  const { data, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-textMuted font-medium uppercase tracking-widest text-xs">Loading Intelligence Data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* 🚀 HEADER SECTION */}
      <div className="bg-gradient-to-br from-surface to-transparent rounded-[2.5rem] p-8 md:p-12 border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 px-4 py-1.5 rounded-full border border-brand-500/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Database className="w-3 h-3" /> Raw Intelligence Data
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-textMain tracking-tighter mb-3 leading-tight">
              Student <span className="text-transparent bg-clip-text bg-gradient-hero">Nexus</span>
            </h1>
            <p className="text-sm md:text-base text-textMuted max-w-xl font-medium leading-relaxed">
              Complete performance records and placement readiness metrics for all active members. Filter, search, and analyze individual growth trajectories.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-3">
             <div className="bg-surface/50 backdrop-blur-md border border-border px-6 py-4 rounded-3xl flex flex-col items-center min-w-[120px]">
                <span className="text-2xl font-black text-white">{data.length}</span>
                <span className="text-[10px] font-black text-textMuted uppercase tracking-widest mt-1">Total Records</span>
             </div>
             <div className="bg-surface/50 backdrop-blur-md border border-border px-6 py-4 rounded-3xl flex flex-col items-center min-w-[120px]">
                <span className="text-2xl font-black text-green-400 font-display">Live</span>
                <span className="text-[10px] font-black text-textMuted uppercase tracking-widest mt-1">Sync Status</span>
             </div>
          </div>
        </div>
      </div>

      {/* 🧬 DATA EXPLORER PANEL */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-textMain tracking-tight flex items-center gap-3">
              <Filter className="w-5 h-5 text-brand-500" /> Data Explorer
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-textMuted uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-border">
              <Search className="w-3 h-3 text-brand-400" /> Auto-Sync Active
            </div>
        </div>
        
        <div className="glass-card rounded-[2rem] border-none shadow-2xl relative overflow-hidden group hover:border-brand-500/20 transition-all duration-500">
           {/* Glow Effect */}
           <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
           
           <div className="p-1 md:p-4 relative z-10">
              <MemberTable data={data} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentData;
