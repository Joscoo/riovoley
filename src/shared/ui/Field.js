import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const Field = ({ label, icon, hint, children, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.8px] text-rv-gold/95">
        {icon ? <span className="text-white/90">{icon}</span> : null}
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-300">{hint}</p> : null}
    </div>
  );
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
  hint: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Field;
