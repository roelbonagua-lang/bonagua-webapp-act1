import React from 'react';

interface WelHoopLogoProps {
  size?: 'sm' | 'md' | 'lg';
  darkSurface?: boolean;
}

export const WelHoopLogo: React.FC<WelHoopLogoProps> = ({
  size = 'md',
  darkSurface = false,
}) => {
  const boxClass =
    size === 'lg' ? 'w-12 h-12 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const iconSize = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div
        className={`${boxClass} bg-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-950/25 shrink-0`}
        aria-hidden="true"
      >
        {/* Minimalist Basketball + Pulse/Leaf emblem */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="14" cy="14" r="10.5" stroke="currentColor" strokeWidth="2.1" />
          <path
            d="M6.2 7.5C9.5 10.2 9.5 17.8 6.2 20.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M21.8 7.5C18.5 10.2 18.5 17.8 21.8 20.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          {/* Vitality pulse / leaf curve across center seam */}
          <path
            d="M4.2 14H9.6L11.7 10.2L15.1 17.8L17.4 14H23.8"
            stroke="#FFF7ED"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <span
          className={`font-display font-extrabold tracking-tight block ${
            size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'
          } ${darkSurface ? 'text-white' : 'text-[#1C1917]'}`}
        >
          WelHoop
        </span>
      </div>
    </div>
  );
};
