import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../lib/cn';
import { FaBars, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

const normalizeRoleToken = (value = '') => value.toString().trim().toLowerCase();

const resolveVariantFromRole = (roleValue = '') => {
  const normalizedRole = normalizeRoleToken(roleValue);

  if (['administrador', 'admin'].includes(normalizedRole)) return 'admin';
  if (normalizedRole === 'entrenador') return 'trainer';
  if (['estudiante', 'usuario'].includes(normalizedRole)) return 'student';
  return null;
};

const RoleSidebar = ({
  variant = 'admin',
  title,
  roleLabel,
  badgeLabel,
  avatarIcon,
  menuItems,
  activeSection,
  onSectionChange,
  showDescriptions = true,
  className,
  as = 'nav'
}) => {
  const WrapperTag = as;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const variantStyles = {
    admin: {
      badge: 'from-red-600 to-red-700 shadow-[0_6px_18px_rgba(220,53,69,0.35)]',
      active: 'border-red-400/60 bg-gradient-to-br from-red-600/25 to-red-500/15 text-white shadow-[0_6px_18px_rgba(220,53,69,0.28)]',
      activeDescription: 'text-red-200/90',
      roleLabel: 'text-red-200/85'
    },
    trainer: {
      badge: 'from-orange-500 to-orange-600 shadow-[0_6px_18px_rgba(253,126,20,0.35)]',
      active: 'border-orange-400/60 bg-gradient-to-br from-orange-500/25 to-orange-400/15 text-white shadow-[0_6px_18px_rgba(253,126,20,0.28)]',
      activeDescription: 'text-orange-100/90',
      roleLabel: 'text-orange-100/85'
    },
    student: {
      badge: 'from-blue-600 to-blue-700 shadow-[0_6px_18px_rgba(0,123,255,0.35)]',
      active: 'border-blue-400/60 bg-gradient-to-br from-blue-600/25 to-blue-500/15 text-white shadow-[0_6px_18px_rgba(0,123,255,0.28)]',
      activeDescription: 'text-blue-100/90',
      roleLabel: 'text-blue-100/85'
    }
  };

  const variantFromRole = resolveVariantFromRole(roleLabel) || resolveVariantFromRole(badgeLabel);
  const effectiveVariant = variantFromRole || variant;
  const styles = variantStyles[effectiveVariant] || variantStyles.admin;
  const shouldShowBadge = normalizeRoleToken(roleLabel) !== normalizeRoleToken(badgeLabel);

  const handleSectionChange = (sectionId) => {
    onSectionChange(sectionId);
    setIsMobileOpen(false);
  };

  const renderSidebarContent = (collapsed = false) => (
    <>
      <div
        className={cn(
          'mb-2 flex flex-col items-center gap-3 border-b border-rv-gold/20 px-4 pb-4 text-center desktop:mb-8 desktop:gap-3 desktop:px-6 desktop:pb-6',
          collapsed && 'desktop:justify-center'
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-rv-gold/40 bg-gradient-to-br from-rv-gold/20 to-amber-500/30 text-xl text-white shadow-[0_4px_15px_rgba(255,215,0,0.25)] desktop:h-20 desktop:w-20 desktop:text-3xl">
          {avatarIcon}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 desktop:flex-none">
            <h3 className="m-0 truncate text-base font-semibold text-white desktop:truncate-none desktop:text-[1.3rem]">
              {title}
            </h3>
            <p className={cn('m-0 mt-0.5 text-xs uppercase tracking-[1px] desktop:mt-2 desktop:text-sm', styles.roleLabel)}>
              {roleLabel}
            </p>
          </div>
        )}
        {!collapsed && shouldShowBadge && (
          <span className={cn('inline-flex rounded-full bg-gradient-to-br px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white', styles.badge)}>
            {badgeLabel}
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col items-stretch gap-2 px-1 desktop:gap-2 desktop:px-4',
          collapsed && 'desktop:items-center desktop:px-3'
        )}
      >
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              className={cn(
                'group inline-flex w-full min-h-[48px] items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-left text-sm font-medium text-white/80 transition-all duration-200',
                'hover:border-rv-gold/35 hover:bg-rv-gold/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
                'desktop:w-full desktop:gap-3 desktop:px-4 desktop:py-3',
                collapsed && 'desktop:w-[60px] desktop:justify-center desktop:px-0',
                isActive && styles.active
              )}
              onClick={() => handleSectionChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base desktop:h-12 desktop:w-12 desktop:text-[1.3rem]">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold desktop:text-base">{item.label}</span>
                  {showDescriptions && item.description && (
                    <span className={cn('hidden text-xs text-white/60 desktop:block', isActive && styles.activeDescription)}>
                      {item.description}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="rv-performance-sidebar fixed left-3 top-[62px] z-[1001] flex h-11 w-11 items-center justify-center rounded-full border border-rv-gold/40 bg-rv-dark/85 text-rv-gold shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 mobile:top-[72px] desktop:hidden"
        aria-label="Abrir menu lateral"
        aria-expanded={isMobileOpen}
      >
        <FaBars />
      </button>

      <div
        className={cn(
          'rv-performance-sidebar fixed bottom-0 left-0 right-0 top-[56px] z-[1002] bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 mobile:top-[65px] desktop:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen ? 'true' : undefined}
        inert={!isMobileOpen ? '' : undefined}
      >
        <WrapperTag
          className={cn(
            'rv-performance-sidebar absolute bottom-0 left-0 top-0 h-full w-[92vw] max-w-[340px] overflow-y-auto border-r-2 border-rv-gold/20 bg-rv-dark/95 px-2 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-[14px] transition-transform duration-300',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          onClick={(event) => event.stopPropagation()}
          aria-label="Navegacion del panel"
        >
          <div className="mb-3 flex items-center justify-end px-1">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-rv-gold/30 bg-rv-gold/10 text-rv-gold transition-all duration-200 hover:bg-rv-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
              aria-label="Cerrar menu lateral"
            >
              <FaTimes />
            </button>
          </div>
          {renderSidebarContent(false)}
        </WrapperTag>
      </div>

      <div
        className={cn(
          'hidden desktop:block',
          isCollapsed
            ? 'desktop:w-[92px] desktop:min-w-[92px] desktop:max-w-[92px]'
            : 'desktop:w-[var(--rv-sidebar-width-desktop)] desktop:min-w-[240px] desktop:max-w-[280px]'
        )}
        aria-hidden="true"
      />

      <WrapperTag
        className={cn(
          'hidden desktop:fixed desktop:left-0 desktop:top-[70px] desktop:z-40 desktop:flex desktop:flex-col desktop:border-r-2 desktop:border-rv-gold/20 desktop:bg-black/25 desktop:py-8 desktop:h-[calc(100vh-70px)] desktop:overflow-y-auto rv-sidebar-scrollbar',
          isCollapsed
            ? 'desktop:w-[92px] desktop:min-w-[92px] desktop:max-w-[92px]'
            : 'desktop:w-[var(--rv-sidebar-width-desktop)] desktop:min-w-[240px] desktop:max-w-[280px]',
          className
        )}
        aria-label="Navegacion del panel"
      >
        <div className={cn('mb-2 flex px-3', isCollapsed ? 'justify-center' : 'justify-end')}>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-rv-gold/30 bg-rv-gold/10 text-rv-gold transition-all duration-200 hover:bg-rv-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 desktop:flex"
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        {renderSidebarContent(isCollapsed)}
      </WrapperTag>
    </>
  );
};

RoleSidebar.propTypes = {
  variant: PropTypes.oneOf(['admin', 'trainer', 'student']),
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
  className: PropTypes.string,
  as: PropTypes.oneOf(['nav', 'aside'])
};

export default RoleSidebar;
