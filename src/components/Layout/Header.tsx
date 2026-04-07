import React from 'react';
import { Menu, Search, User, Sun, Moon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { setTheme, actualTheme } = useTheme();
  const { searchTerm: query, setSearchTerm: setQuery, results: members } = useSearch('members');
  const { setSearchTerm: setTeamQuery, results: teams } = useSearch('teams');

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Sync queries
  React.useEffect(() => {
    setTeamQuery(query);
  }, [query, setTeamQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="glass-card border-none border-b border-border sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
        {/* Left section - Mobile menu button & Search Trigger */}
        <div className="flex items-center flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-2 text-textMuted hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Search bar */}
          <div className="hidden md:flex relative group">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-textMuted group-focus-within:text-brand-400 transition-colors" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources, teams or members..."
                className="w-72 md:w-96 pl-10 pr-4 py-2 bg-surface/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 text-white placeholder-textMuted transition-all duration-200"
              />
              {query && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="h-4 w-4 rounded-full border-t-2 border-brand-400 animate-spin"></div>
                </div>
              )}
            </div>

            {/* Desktop Search Results Dropdown */}
            {(members.length > 0 || teams.length > 0) && query && (
              <div className="absolute top-12 left-0 w-full bg-surface/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-border max-h-[400px] overflow-y-auto z-50 animate-fade-in divide-y divide-white/5">
                {teams.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                      <span className="w-1 h-3 bg-brand-400 rounded-full"></span> Teams
                    </div>
                    {teams.map(team => (
                      <div
                        key={team.id}
                        className="px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer flex items-center transition-colors group"
                        onClick={() => handleNavigate(`/team/${team.deptId}/${team.sectionId}/${team.id}`)}
                      >
                        <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-colors">
                          <span className="text-sm font-medium text-textMuted group-hover:text-brand-400">T</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">{team.name}</div>
                          <div className="text-xs text-textMuted truncate">{team.deptId} › {team.sectionId}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {members.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-semibold text-accent-purple uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                      <span className="w-1 h-3 bg-accent-purple rounded-full"></span> Members
                    </div>
                    {members.map(member => (
                      <div
                        key={member.memberId || Math.random().toString()}
                        className="px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer flex items-center transition-colors group"
                        onClick={() => handleNavigate(`/individual/${member.memberId}`)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-inner">
                          <span className="text-xs font-bold text-white">{(member.memberName || 'U').substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-accent-purple transition-colors">{member.memberName || 'Unknown Member'}</div>
                          <div className="text-xs text-textMuted">{member.teamId || "No Team Provided"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden text-textMuted hover:text-white"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            title="Force Data Sync"
            className="text-textMuted hover:text-white hover:bg-white/10 hidden sm:flex"
          >
            <span className="flex items-center text-xs font-medium gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Sync</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-textMuted hover:text-white hover:bg-white/10 rounded-full h-10 w-10 p-0 flex items-center justify-center"
            onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Profile */}
          <button
            className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-full pr-1 md:pr-3 transition-colors"
            onClick={() => navigate('/settings')}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center shadow-lg border border-white/20">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white hidden md:block">Profile</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-surface flex flex-col items-stretch animate-fade-in md:hidden">
          <div className="flex items-center px-4 py-3 border-b border-border gap-3 bg-surface/95 backdrop-blur-md">
            <Search className="h-4 w-4 text-brand-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources, teams..."
              enterKeyHint="search"
              className="flex-1 bg-transparent border-none text-white focus:ring-0 text-base"
            />
            <Button variant="ghost" size="sm" onClick={() => setIsSearchOpen(false)} className="h-8 w-8 p-0">
              <X className="h-5 w-5 text-textMuted" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 bg-background/50 safe-area-bottom pb-20">
            {teams.length === 0 && members.length === 0 && query && (
               <div className="p-8 text-center text-textMuted">No results found for "{query}"</div>
            )}
            {teams.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] uppercase font-black tracking-widest text-brand-400 mb-2 px-3 flex items-center gap-2">
                   <span className="w-1 h-3 bg-brand-400 rounded-full"></span> Teams
                </div>
                {teams.map(team => (
                  <button 
                    key={team.id} 
                    type="button"
                    className="w-full text-left px-3 py-2.5 mb-1 hover:bg-white/5 rounded-lg flex items-center transition-colors active:bg-brand-500/10 group" 
                    onClick={() => handleNavigate(`/team/${team.deptId}/${team.sectionId}/${team.id}`)}
                  >
                    <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center mr-3 shrink-0 group-active:border-brand-500/30">
                      <span className="text-sm font-medium text-textMuted">T</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{team.name}</div>
                      <div className="text-[10px] text-textMuted uppercase font-bold">{team.deptId} › {team.sectionId}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {members.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] uppercase font-black tracking-widest text-accent-purple mb-2 px-3 flex items-center gap-2">
                   <span className="w-1 h-3 bg-accent-purple rounded-full"></span> Members
                </div>
                {members.map(member => (
                  <button 
                    key={member.memberId} 
                    type="button"
                    className="w-full text-left px-3 py-2.5 mb-1 hover:bg-white/5 rounded-lg flex items-center transition-colors active:bg-brand-500/10 group" 
                    onClick={() => handleNavigate(`/individual/${member.memberId}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shrink-0 shadow-inner">
                      <span className="text-[11px] font-bold text-white">{(member.memberName || 'U').substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{member.memberName}</div>
                      <div className="text-[10px] text-textMuted uppercase font-bold">{member.teamId}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;