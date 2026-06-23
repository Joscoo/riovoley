import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const SectionHeader = ({ title, subtitle, icon, actions, className, centered = false, guideId, actionsGuideId }) => {
  return (
    <div
      data-guide-id={guideId}
      className={cn(
        'mb-4 flex flex-col gap-3 mobile:mb-5 mobile:flex-row mobile:flex-wrap mobile:items-start mobile:justify-between',
        centered && 'justify-center text-center',
        className
      )}
    >
      <div className={cn('min-w-0', centered && 'max-w-3xl')}>
        <h2 className="text-lg font-black tracking-tight text-white mobile:text-2xl">
          {icon ? <span className="mr-2 inline-flex align-middle text-rv-gold">{icon}</span> : null}
          <span className="align-middle">{title}</span>
        </h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-[13px] leading-5 text-slate-200 mobile:text-base mobile:leading-6">{subtitle}</p> : null}
      </div>
      {actions ? <div className="w-full shrink-0 mobile:w-auto" data-guide-id={actionsGuideId}>{actions}</div> : null}
    </div>
  );
};

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
  centered: PropTypes.bool,
  guideId: PropTypes.string,
  actionsGuideId: PropTypes.string,
};

export default SectionHeader;
