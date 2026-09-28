import React from 'react';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../Const/Display';

export const StatCard = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon,
  accentColor = COLORS.primary,
}) => {
  return (
    <div
      className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between"
      style={{
        boxShadow: SHADOWS.card,
      }}
    >
      {/* Subtle top accent gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p
            className="font-medium tracking-wide uppercase"
            style={{
              color: COLORS.textSecondary,
              fontSize: FONT_SIZES.xs,
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-bold text-white tracking-tight"
              style={{
                fontSize: FONT_SIZES['3xl'],
                fontWeight: FONT_WEIGHTS.bold,
              }}
            >
              {value}
            </span>
          </div>
        </div>

        {/* Icon container */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
        <span
          className="text-xs"
          style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs }}
        >
          {subtitle}
        </span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
