import React from 'react';

interface TelemetryArcGaugeProps {
  label: string;
  value: string;
  unit: string;
  percent: number;
  onClick?: () => void;
}

export const TelemetryArcGauge: React.FC<TelemetryArcGaugeProps> = ({
  label,
  value,
  unit,
  percent,
  onClick,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270 degree gauge arc
  const totalArcLen = circumference * arcFraction;
  const dashOffset = totalArcLen * (1 - clamped / 100);
  const gradId = `hawaii-arc-${label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center p-1.5 bg-[#141417]/85 border border-[#2A2A2E] hover:border-[#00B4D8] transition-colors cursor-pointer cyber-chamfer-sm min-w-[66px]"
    >
      <div className="relative w-[52px] h-[52px] flex items-center justify-center">
        <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 56 56">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0077B6" />
              <stop offset="50%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="#2A2A2E"
            strokeWidth="4"
            strokeDasharray={`${totalArcLen} ${circumference}`}
            strokeLinecap="butt"
          />
          {/* Active Hawaiian Blue Gradient Arc */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="4"
            strokeDasharray={`${totalArcLen} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="font-rajdhani font-bold text-[15px] leading-none text-white tabular-nums">
            {value}
          </span>
          <span className="font-jetbrains text-[8px] text-[#8E8E93] mt-0.5">{unit}</span>
        </div>
      </div>
      <span className="font-jetbrains text-[8px] tracking-widest uppercase text-[#8E8E93] group-hover:text-[#00E5FF] mt-0.5">
        {label}
      </span>
    </button>
  );
};
