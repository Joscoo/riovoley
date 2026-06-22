import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const accentMap = {
  cyan: {
    label: 'text-cyan-200',
    icon: 'bg-cyan-400/12 text-cyan-300',
    border: 'border-cyan-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(6,182,212,0.09),rgba(8,47,73,0.16))]',
  },
  emerald: {
    label: 'text-emerald-200',
    icon: 'bg-emerald-400/12 text-emerald-300',
    border: 'border-emerald-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(16,185,129,0.09),rgba(6,78,59,0.16))]',
  },
  rose: {
    label: 'text-rose-200',
    icon: 'bg-rose-400/12 text-rose-300',
    border: 'border-rose-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(244,63,94,0.09),rgba(127,29,29,0.16))]',
  },
  violet: {
    label: 'text-violet-200',
    icon: 'bg-violet-400/12 text-violet-300',
    border: 'border-violet-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(139,92,246,0.09),rgba(76,29,149,0.16))]',
  },
  amber: {
    label: 'text-amber-200',
    icon: 'bg-amber-400/12 text-amber-300',
    border: 'border-amber-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(120,53,15,0.16))]',
  },
  gold: {
    label: 'text-rv-gold',
    icon: 'bg-rv-gold/12 text-rv-gold',
    border: 'border-rv-gold/20',
    bg: 'bg-[linear-gradient(180deg,rgba(255,215,0,0.09),rgba(120,90,0,0.16))]',
  },
  sky: {
    label: 'text-sky-200',
    icon: 'bg-sky-400/12 text-sky-300',
    border: 'border-sky-400/20',
    bg: 'bg-[linear-gradient(180deg,rgba(56,189,248,0.09),rgba(7,89,133,0.16))]',
  },
  slate: {
    label: 'text-slate-300',
    icon: 'bg-white/[0.06] text-slate-200',
    border: 'border-white/12',
    bg: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]',
  },
};

/**
 * KpiTile — a unified metric tile for KPIs, stats, and financial indicators.
 *
 * Supports two visual modes:
 * - `compact` (default): label + value, minimal footprint
 * - `spotlight`: larger tile with icon, detail text, and accent background
 */
const KpiTile = ({
  label,
  value,
  detail,
  icon,
  accent = 'slate',
  variant = 'compact',
  className,
}) => {
  const colors = accentMap[accent] || accentMap.slate;

  if (variant === 'spotlight') {
    return (
      <div
        className={cn(
          'flex h-full items-start justify-between gap-4 rounded-[24px] border p-4',
          colors.border,
          colors.bg,
          className
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              'text-[11px] font-bold uppercase tracking-[0.18em]',
              colors.label
            )}
          >
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
          {detail ? (
            <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              'inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl',
              colors.icon
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    );
  }

  // compact variant
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        colors.border,
        colors.bg,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'text-[11px] font-bold uppercase tracking-[0.16em]',
              colors.label
            )}
          >
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {detail ? (
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl',
              colors.icon
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
};

KpiTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  detail: PropTypes.string,
  icon: PropTypes.node,
  accent: PropTypes.oneOf(Object.keys(accentMap)),
  variant: PropTypes.oneOf(['compact', 'spotlight']),
  className: PropTypes.string,
};

export default KpiTile;
