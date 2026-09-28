import React from 'react';
import { COLORS, FONT_SIZES } from '../Const/Display';

export const SeverityBadge = ({ severity = 'low' }) => {
  const sevKey = severity.toLowerCase();
  const config = COLORS.severity[sevKey] || COLORS.severity.low;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium tracking-wide uppercase"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: FONT_SIZES.xs,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};

export const StatusBadge = ({ status = 'queued' }) => {
  const statKey = status.toLowerCase();
  const config = COLORS.status[statKey] || COLORS.status.queued;
  const isRunning = statKey === 'running';

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: FONT_SIZES.xs,
      }}
    >
      <span
        className={`w-2 h-2 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};

export const TechBadge = ({ label, variant = 'blue' }) => {
  const isPurple = variant === 'purple';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono"
      style={{
        backgroundColor: isPurple ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
        color: isPurple ? '#c084fc' : '#60a5fa',
        border: `1px solid ${isPurple ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
      }}
    >
      {label}
    </span>
  );
};

export default {
  SeverityBadge,
  StatusBadge,
  TechBadge,
};
