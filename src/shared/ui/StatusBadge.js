import React from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', {
  variants: {
    tone: {
      neutral: 'bg-white/15 text-white',
      success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35',
      warning: 'bg-amber-500/20 text-amber-200 border border-amber-300/35',
      danger: 'bg-red-500/20 text-red-200 border border-red-300/35',
      info: 'bg-sky-500/20 text-sky-200 border border-sky-300/35'
    }
  },
  defaultVariants: {
    tone: 'neutral'
  }
});

const StatusBadge = ({ children, tone = 'neutral', className, ...props }) => {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
};

StatusBadge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info']),
  className: PropTypes.string
};

export default StatusBadge;
