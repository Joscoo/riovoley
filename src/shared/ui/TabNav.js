import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

/**
 * TabNav — horizontal tab navigation with gold accent indicator, icons, and smooth transitions.
 *
 * Each tab item: { id, label, icon, helper, badge }
 */
const TabNav = ({ items, activeId, onChange, className }) => {
  return (
    <div className={cn('grid gap-3', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((tab) => {
        const isActive = activeId === tab.id;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            data-guide-id={tab.guideId}
            onClick={() => onChange(tab.id)}
            className={cn(
              'group relative rounded-[26px] border px-4 py-4 text-left transition-all duration-300',
              isActive
                ? 'border-rv-gold/40 bg-[linear-gradient(135deg,rgba(249,178,51,0.14),rgba(46,49,146,0.12)_60%,rgba(15,23,42,0.36))] shadow-[0_18px_50px_rgba(2,6,23,0.24)]'
                : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] hover:border-rv-gold/20 hover:bg-white/[0.04]'
            )}
          >
            {/* Active indicator bar */}
            <div
              className={cn(
                'absolute left-4 top-0 h-[3px] rounded-b-full transition-all duration-300',
                isActive
                  ? 'w-10 bg-rv-gold shadow-[0_2px_12px_rgba(255,215,0,0.5)]'
                  : 'w-0 bg-transparent'
              )}
            />

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border text-lg transition-all duration-300',
                  isActive
                    ? 'border-rv-gold/30 bg-rv-gold/15 text-rv-gold shadow-[0_4px_12px_rgba(255,215,0,0.15)]'
                    : 'border-white/10 bg-white/[0.05] text-slate-300 group-hover:text-rv-gold/80'
                )}
              >
                {TabIcon ? <TabIcon /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-base font-black transition-colors duration-200',
                      isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    )}
                  >
                    {tab.label}
                  </p>
                  {tab.badge != null ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-rv-gold/20 px-2 py-0.5 text-[10px] font-bold text-rv-gold">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                {tab.helper ? (
                  <p className="mt-1.5 text-sm leading-5 text-slate-400">{tab.helper}</p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

TabNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      helper: PropTypes.string,
      badge: PropTypes.node,
      guideId: PropTypes.string,
    })
  ).isRequired,
  activeId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default TabNav;
