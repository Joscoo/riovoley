import React from 'react';
import PropTypes from 'prop-types';
import RoleSidebar from './RoleSidebar';
import { cn } from '../../../lib/cn';

const RolePanelLayout = ({
  variant,
  title,
  roleLabel,
  badgeLabel,
  avatarIcon,
  menuItems,
  activeSection,
  onSectionChange,
  showDescriptions = true,
  topBar,
  children,
  contentClassName,
  as = 'nav'
}) => {
  return (
    <div className="min-h-[100dvh] w-full bg-rv-panel text-white">
      <div className="flex min-h-[100dvh] w-full">
        <RoleSidebar
          as={as}
          variant={variant}
          title={title}
          roleLabel={roleLabel}
          badgeLabel={badgeLabel}
          avatarIcon={avatarIcon}
          menuItems={menuItems}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          showDescriptions={showDescriptions}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topBar ? (
            <header className="border-b border-rv-gold/20 bg-black/30 px-3 py-3 backdrop-blur-md mobile:px-4 tablet:px-5 desktop:px-8 desktop:py-5">
              {topBar}
            </header>
          ) : null}

          <div
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 mobile:px-3 tablet:px-4 tablet:py-4 desktop:px-7 desktop:py-6',
              contentClassName
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

RolePanelLayout.propTypes = {
  variant: PropTypes.oneOf(['admin', 'trainer', 'student']).isRequired,
  title: PropTypes.string.isRequired,
  roleLabel: PropTypes.string.isRequired,
  badgeLabel: PropTypes.string.isRequired,
  avatarIcon: PropTypes.node.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  activeSection: PropTypes.string.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  showDescriptions: PropTypes.bool,
  topBar: PropTypes.node,
  children: PropTypes.node.isRequired,
  contentClassName: PropTypes.string,
  as: PropTypes.oneOf(['nav', 'aside'])
};

export default RolePanelLayout;
