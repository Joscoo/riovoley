import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const SectionHeader = ({ title, subtitle, icon, actions, className, centered = false }) => {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-start justify-between gap-3 mobile:mb-6',
        centered && 'justify-center text-center',
        className
      )}
    >
      <div className={cn('min-w-0', centered && 'max-w-3xl')}>
        <h2 className="text-xl font-black tracking-tight text-white mobile:text-2xl">
          {icon ? <span className="mr-2 inline-flex align-middle text-rv-gold">{icon}</span> : null}
          <span className="align-middle">{title}</span>
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-200 mobile:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
};

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
  centered: PropTypes.bool
};

export default SectionHeader;
