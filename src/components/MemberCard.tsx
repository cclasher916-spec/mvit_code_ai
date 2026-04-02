import React from 'react';
import { Link } from 'react-router-dom';
import { DailyTotal } from '../types';
import Card from './ui/Card';
import { User, Trophy, Eye, TrendingUp, Crown } from 'lucide-react';
import Button from './ui/Button';

interface MemberCardProps {
  member: DailyTotal;
  rank?: number;
  showTeamInfo?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, rank, showTeamInfo = true }) => {
  if (!member) return null;

  const performanceLevel =
    (member.totalSolved || 0) >= 500 ? 'high' :
      member.totalSolved >= 200 ? 'medium' :
        member.totalSolved >= 50 ? 'low' : 'minimal';

  const performanceConfig = {
    high: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    medium: { bg: 'bg-brand-500/10', border: 'border-brand-500/30', text: 'text-brand-400' },
    low: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500' },
    minimal: { bg: 'bg-white/5', border: 'border-border/60', text: 'text-textMuted' }
  } as const;

  const perf = performanceConfig[performanceLevel];
  const dailyTrend = member.totalDailyIncrease >= 0 ? 'positive' : 'negative';

  return (
    <Card hover className={`border bg-surface ${perf.border} transition-all duration-300 group overflow-hidden`}>
      <Link to={`/individual/${member.memberId}`} className="block relative p-5 sm:p-6">
        {/* Team lead golden glow/highlight */}
        {member.isTeamLead && (
          <div className="absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60"></div>
        )}

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center w-full min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-inner border border-white/10 shrink-0 ${member.isTeamLead ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-500' : 'bg-white/5 text-textMuted group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors'
              }`}>
              {member.isTeamLead ? (
                <Crown className="h-6 w-6" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <h3 className="text-base sm:text-lg font-bold text-white truncate transition-colors group-hover:text-brand-400">{member.memberName}</h3>
                {member.isTeamLead && (
                  <span className="inline-flex items-center justify-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Lead
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 gap-2 flex-wrap">
                {rank && (
                  <span className={`px-2 py-0.5 rounded border inline-flex items-center text-[10px] font-bold uppercase tracking-wider ${rank <= 3 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40' : 'bg-white/5 text-textMuted border-border/50'}`}>
                    {rank === 1 && <Trophy className="w-3 h-3 mr-1 text-yellow-400" />}
                    Rank #{rank}
                  </span>
                )}
                {!member.isTeamLead && member.assignedTeamLead && (
                  <span className="text-[10px] sm:text-xs text-brand-400/80 truncate font-medium">Under: {member.assignedTeamLead}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {showTeamInfo && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] font-semibold">
              {member.teamId}
            </span>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] font-semibold">
              {member.sectionId}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface/50 border border-border rounded-xl p-3 text-center transition-colors group-hover:border-brand-500/20">
            <div className="text-xl sm:text-2xl font-display font-bold text-white">{member.totalSolved}</div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-textMuted uppercase tracking-wider mt-1">Total Solved</div>
          </div>
          <div className="bg-surface/50 border border-border rounded-xl p-3 text-center transition-colors group-hover:border-brand-500/20 relative overflow-hidden">
            {member.totalDailyIncrease > 0 && <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-full blur-xl pointer-none"></div>}
            <div className={`text-xl sm:text-2xl font-display font-bold flex items-center justify-center gap-1 ${member.totalDailyIncrease > 0 ? 'text-green-400' : 'text-textMuted'}`}>
              {member.totalDailyIncrease > 0 && '+'}{member.totalDailyIncrease}
            </div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-textMuted uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <TrendingUp className={`w-3 h-3 ${dailyTrend === 'positive' ? 'text-green-500' : 'text-textMuted'}`} /> Daily
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-white/5 rounded-xl p-2.5 border border-border/50 text-center text-xs">
          <div className="flex flex-col items-center justify-center">
            <div className="font-bold text-white">{member.leetcodeTotal}</div>
            <div className="text-textMuted text-[9px] uppercase font-semibold">LC</div>
          </div>
          <div className="flex flex-col items-center justify-center border-l border-border/50 sm:border-l sm:border-border/50">
            <div className="font-bold text-white">{member.skillrackTotal}</div>
            <div className="text-textMuted text-[9px] uppercase font-semibold">SR</div>
          </div>
          <div className="flex flex-col items-center justify-center border-t border-border/50 pt-1 sm:pt-0 sm:border-t-0 sm:border-l">
            <div className="font-bold text-white">{member.codechefTotal}</div>
            <div className="text-textMuted text-[9px] uppercase font-semibold">CC</div>
          </div>
          <div className="flex flex-col items-center justify-center border-l border-border/50 border-t border-border/50 pt-1 sm:pt-0 sm:border-t-0">
            <div className="font-bold text-white">{member.hackerrankTotal}</div>
            <div className="text-textMuted text-[9px] uppercase font-semibold">HR</div>
          </div>
        </div>

        <div className="w-full flex items-center justify-center bg-white/5 border border-border hover:bg-white/10 rounded-xl py-2 text-xs font-bold text-white transition-colors">
          <Eye className="mr-2 h-4 w-4" />
          View Complete Profile
        </div>
      </Link>
    </Card>

  );
};

export default MemberCard;