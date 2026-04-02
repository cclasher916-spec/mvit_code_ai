import React from 'react';

interface PerformanceBarProps {
  value: number;       // The actual average (e.g., 720)
  maxValue?: number;   // The dynamic max scaling index (defaults to 800 per blueprint)
  className?: string;  // Explicit overrides
}

const PerformanceBar: React.FC<PerformanceBarProps> = ({ 
  value, 
  maxValue = 800,
  className = ''
}) => {
  // Clamp value defensively just incase avg overflows
  const clampedValue = Math.min(Math.max(0, value), maxValue);
  const percentage = (clampedValue / maxValue) * 100;

  // Render logic mapping exact UI instructions: High = strong color, Med = neutral, Low = warning
  let barColor = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'; // Elite high default
  let progressBgColor = 'bg-green-500/10';

  if (value < 250) {
    barColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'; // Risk
    progressBgColor = 'bg-red-500/10';
  } else if (value < 600) {
    barColor = 'bg-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]'; // Good (neutral/brand)
    progressBgColor = 'bg-brand-500/10';
  }

  return (
    <div className={`w-full min-w-[120px] max-w-[200px] flex items-center gap-3 ${className}`}>
      <span className="w-8 shrink-0 text-right font-mono font-bold text-xs text-textMain">{Math.round(value)}</span>
      
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${progressBgColor} border border-border/50`}>
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PerformanceBar;
