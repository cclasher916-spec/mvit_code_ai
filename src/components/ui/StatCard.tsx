import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  colorTheme?: 'blue' | 'green' | 'purple' | 'amber' | 'brand';
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  colorTheme = 'brand',
  highlight = false 
}) => {
  const themeStyles = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40 glow-blue',
    green: 'text-green-500 bg-green-500/10 border-green-500/20 group-hover:border-green-500/40 glow-green',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40 glow-purple',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40 glow-amber',
    brand: 'text-brand-500 bg-brand-500/10 border-brand-500/20 group-hover:border-brand-500/40 glow-brand',
  };

  const selectedTheme = themeStyles[colorTheme];

  return (
    <div className={`bg-surface border ${highlight ? 'border-brand-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'border-border'} rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
      {/* Decorative Blur */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${selectedTheme.split(' ')[0].replace('text-', 'bg-')}`}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl border ${selectedTheme} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-textMuted'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}
            {trendLabel && <span className="text-[10px] text-textMuted/70 uppercase ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h4 className="text-3xl font-black text-textMain tracking-tight mb-1 truncate">{value}</h4>
        <p className="text-xs font-bold text-textMuted uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
