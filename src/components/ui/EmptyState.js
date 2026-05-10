import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const EmptyState = ({ icon, title, description, action, className }) => {
  return (
    <div className={cn('mx-auto max-w-2xl rounded-2xl border border-white/15 bg-black/35 p-6 text-center backdrop-blur-md mobile:p-8', className)}>
      {icon ? <div className="mx-auto mb-3 inline-flex text-4xl text-rv-gold/80">{icon}</div> : null}
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-200 mobile:text-base">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string
};

export default EmptyState;
