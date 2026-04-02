import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  BarChart3,
  Trophy,
  Settings,
  X,
  Home,
  GitBranch,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { useData } from '../../contexts/DataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { data } = useData();

  const { totalTeams, totalMembers } = useMemo(() => {
    return {
      totalTeams: new Set(data.map(d => d.teamId)).size,
      totalMembers: new Set(data.map(d => d.memberId)).size
    };
  }, [data]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'All Departments', href: '/all-departments', icon: Building2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Repositories', href: '/repositories', icon: GitBranch },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 w-64 h-full bg-surface/95 backdrop-blur-xl border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-textMain text-lg tracking-tight">Autonomous Core</h1>
              <p className="text-xs text-brand-400 font-medium tracking-wide uppercase">Skill Platform</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-textMuted hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 relative z-10">
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-4 px-2">Navigation</div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-textMuted hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400 rounded-r-full" />
                  )}
                  <Icon className={cn("mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110", isActive ? "text-brand-400" : "")} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Organization Info Glass Card */}
        <div className="absolute bottom-6 left-4 right-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5 relative overflow-hidden group border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
            <h3 className="text-sm font-semibold text-textMain mb-3 relative z-10 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              System Status
            </h3>
            <div className="space-y-3 text-xs text-slate-300 relative z-10">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                <span>Total Teams:</span>
                <span className="font-medium text-white">{totalTeams}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                <span>Active Members:</span>
                <span className="font-medium text-white">{totalMembers}</span>
              </div>
            </div>
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;