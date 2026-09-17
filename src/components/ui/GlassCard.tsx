import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  }[padding];

  return (
    <div
      className={`glass-card rounded-xl border border-slate-200/90 shadow-sm ${
        hoverEffect ? 'glass-card-hover' : ''
      } ${paddingClasses} ${className}`}
    >
      {children}
    </div>
  );
};
