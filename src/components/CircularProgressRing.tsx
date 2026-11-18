import React from 'react';

interface CircularProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  centerPrimary: string;
  centerSecondary?: string;
  ariaLabel: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  value,
  max,
  size = 104,
  strokeWidth = 9,
  color = '#EA580C',
  trackColor = '#F5F0EB',
  centerPrimary,
  centerSecondary,
  ariaLabel,
}) => {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(1, Math.max(0, value / safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className="font-mono-tabular text-base font-bold text-[#1C1917] leading-none">
          {centerPrimary}
        </span>
        {centerSecondary && (
          <span className="font-mono-tabular text-[11px] font-medium text-[#78716C] mt-1 leading-none">
            {centerSecondary}
          </span>
        )}
      </div>
    </div>
  );
};
