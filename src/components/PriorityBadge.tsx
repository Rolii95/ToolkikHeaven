// Priority Badge Component for Order Cards
import React from 'react';

interface PriorityBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, size = 'md' }) => {
  const getPriorityConfig = (level: number) => {
    switch (level) {
      case 1: return { 
        label: '🔴 URGENT', 
        className: 'bg-red-100 text-red-800 border-red-200',
        pulse: true 
      };
      case 2: return { 
        label: '🟠 HIGH', 
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        pulse: false 
      };
      case 3: return { 
        label: '🟡 NORMAL', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        pulse: false 
      };
      case 4: return { 
        label: '🔵 LOW', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        pulse: false 
      };
      case 5: return { 
        label: '⚪ LOWEST', 
        className: 'bg-gray-50 text-gray-600 border-gray-100',
        pulse: false 
      };
      default: return { 
        label: '🟡 NORMAL', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        pulse: false 
      };
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const config = getPriorityConfig(level);

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium border
        ${config.className} 
        ${sizeClasses[size]}
        ${config.pulse ? 'animate-pulse' : ''}
      `}
    >
      {config.label}
    </span>
  );
};

export default PriorityBadge;