import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBell,
  FaBullhorn,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
  FaTrophy,
} from 'react-icons/fa';
import { notificationsService } from '../../notificationsService';
import { cn } from '../../../../lib/cn';
import { Button, StatusBadge } from '../../../../shared/ui';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'mensualidades', label: 'Mensualidades' },
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'gamificacion', label: 'Gamificacion' },
];

const CATEGORY_LABELS = {
  mensualidades: 'Mensualidades',
  anuncios: 'Anuncios',
  gamificacion: 'Gamificacion',
  general: 'General',
};

const CATEGORY_THEME = {
  mensualidades: 'border-amber-300/35 bg-amber-500/12 text-amber-100',
  anuncios: 'border-sky-300/35 bg-sky-500/12 text-sky-100',
  gamificacion: 'border-fuchsia-300/35 bg-fuchsia-500/12 text-fuchsia-100',
  general: 'border-slate-300/30 bg-slate-500/12 text-slate-100',
};

const NOTIFICATION_SURFACE = {
  danger: {
    item: 'border-red-400/40 bg-[linear-gradient(135deg,_rgba(127,29,29,0.42),_rgba(15,23,42,0.92)_62%)]',
    rail: 'bg-red-400',
    icon: 'text-red-200',
  },
  warning: {
    item: 'border-amber-300/35 bg-[linear-gradient(135deg,_rgba(120,53,15,0.34),_rgba(15,23,42,0.92)_62%)]',
    rail: 'bg-amber-300',
    icon: 'text-amber-200',
  },
  info: {
    item: 'border-cyan-300/35 bg-[linear-gradient(135deg,_rgba(8,47,73,0.36),_rgba(15,23,42,0.92)_62%)]',
    rail: 'bg-cyan-300',
    icon: 'text-cyan-200',
  },
};

const NotificationBell = ({ userRole, userId }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionKey, setActionKey] = useState('');
  const dropdownRef = useRef(null);
  const normalizedRole = userRole?.toLowerCase();
  const canViewNotifications = normalizedRole === 'administrador' || normalizedRole === 'entrenador';

  useEffect(() => {
    if (!canViewNotifications) return;
    cargarNotificaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewNotifications, userId, userRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const cargarNotificaciones = async () => {
    setLoading(true);
    try {
      const todasNotificaciones = await notificationsService.loadBellNotifications({ userRole, userId });
      setNotificaciones(todasNotificaciones);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!canViewNotifications) return;
    setIsOpen((currentValue) => !currentValue);
    if (!isOpen) {
      cargarNotificaciones();
    }
  };

  const getIcono = (notificacion) => {
    if (notificacion.tipo_notificacion === 'anuncio') {
      return <FaBullhorn />;
    }
    if (notificacion.tipo_notificacion === 'gamificacion') {
      return <FaTrophy />;
    }
    switch (notificacion.tipo) {
      case 'danger':
        return <FaExclamationTriangle />;
      case 'warning':
        return <FaBell />;
      case 'info':
        return <FaInfoCircle />;
      default:
        return <FaBell />;
    }
  };

  const totalNotificaciones = notificaciones.length;
  const totalUnread = notificaciones.filter((notification) => !notification.isRead).length;
  const filteredNotifications = selectedCategory === 'all'
    ? notificaciones
    : notificaciones.filter((notification) => notification.category === selectedCategory);

  const patchNotification = (notificationId, updater) => {
    setNotificaciones((currentNotifications) => currentNotifications.map((notification) => (
      notification.id === notificationId ? updater(notification) : notification
    )));
  };

  const removeNotification = (notificationId) => {
    setNotificaciones((currentNotifications) => currentNotifications.filter((notification) => notification.id !== notificationId));
  };

  const handleMarkAsRead = async (notification) => {
    if (!userId || notification.isRead) return;

    setActionKey(`read-${notification.id}`);
    try {
      await notificationsService.markBellNotificationRead({
        userId,
        notificationId: notification.id,
        category: notification.category,
      });
      patchNotification(notification.id, (currentNotification) => ({
        ...currentNotification,
        isRead: true,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marcando notificacion como leida:', error);
    } finally {
      setActionKey('');
    }
  };

  const handleDismiss = async (notification) => {
    if (!userId) return;

    setActionKey(`dismiss-${notification.id}`);
    try {
      await notificationsService.dismissBellNotification({
        userId,
        notificationId: notification.id,
        category: notification.category,
      });
      removeNotification(notification.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error eliminando notificacion:', error);
    } finally {
      setActionKey('');
    }
  };

  const handleMarkVisibleAsRead = async () => {
    const unreadVisible = filteredNotifications.filter((notification) => !notification.isRead);
    if (!userId || unreadVisible.length === 0) return;

    setActionKey('read-visible');
    try {
      await notificationsService.markBellNotificationsReadBulk({
        userId,
        notifications: unreadVisible,
      });
      setNotificaciones((currentNotifications) => currentNotifications.map((notification) => (
        unreadVisible.some((candidate) => candidate.id === notification.id)
          ? { ...notification, isRead: true }
          : notification
      )));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marcando notificaciones visibles como leidas:', error);
    } finally {
      setActionKey('');
    }
  };

  if (!canViewNotifications) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className="group relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-transparent p-2 text-white transition-all duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <FaBell className="text-xl transition-transform duration-200 group-hover:scale-110 group-hover:animate-[ring_0.5s_ease] tablet:text-[22px]" />
        {totalUnread > 0 ? (
          <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-600 px-1 py-0.5 text-center text-[9px] font-bold leading-none text-white shadow-md animate-[notif-pulse_2s_ease-in-out_infinite] tablet:min-w-[18px] tablet:px-1.5 tablet:text-[10px]">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-[5px] right-[5px] top-[56px] z-[1000] max-h-[calc(100vh-75px)] w-auto overflow-hidden rounded-2xl border border-rv-gold/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.985),rgba(2,6,23,0.98))] text-white shadow-[0_18px_60px_rgba(2,6,23,0.5),0_0_40px_rgba(255,215,0,0.08)] animate-[slide-down_0.25s_ease] mobile:left-2.5 mobile:right-2.5 mobile:top-[65px] tablet:absolute tablet:left-auto tablet:right-0 tablet:top-[calc(100%+8px)] tablet:max-h-[560px] tablet:w-[390px] desktop:w-[430px]">
          <div className="border-b border-rv-gold/15 bg-[linear-gradient(135deg,rgba(46,49,146,0.24),rgba(15,23,42,0.12)_58%,rgba(249,178,51,0.1))] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rv-gold">Centro rapido</p>
                <h4 className="m-0 text-base font-black text-white">Notificaciones</h4>
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 ? <StatusBadge tone="warning">{totalUnread} sin leer</StatusBadge> : null}
                {totalNotificaciones > 0 ? (
                  <span className="rounded-full border border-rv-gold/30 bg-rv-gold/15 px-2 py-1 text-xs font-semibold text-rv-gold">
                    {totalNotificaciones}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedCategory(filter.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition',
                    selectedCategory === filter.id
                      ? 'border-rv-gold/45 bg-rv-gold/16 text-rv-gold'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-rv-gold/30 hover:text-white'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                className="border-rv-gold/25 bg-white/8 text-slate-100 hover:bg-rv-gold/12"
                onClick={handleMarkVisibleAsRead}
                disabled={actionKey === 'read-visible' || filteredNotifications.every((notification) => notification.isRead)}
              >
                Marcar visibles como leidas
              </Button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-145px)] overflow-y-auto px-2 py-2 tablet:max-h-[400px]">
            {loading ? (
              <div className="p-10 text-center text-slate-300">Cargando...</div>
            ) : null}

            {!loading && filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
                <FaInfoCircle className="text-[40px] text-rv-gold/75" />
                <p className="m-0 text-sm">
                  {totalNotificaciones === 0 ? 'No hay notificaciones' : 'No hay notificaciones en esta categoria'}
                </p>
              </div>
            ) : null}

            {!loading && filteredNotifications.length > 0 ? (
              <ul className="m-0 list-none p-0">
                {filteredNotifications.map((notif) => {
                  const tone = NOTIFICATION_SURFACE[notif.tipo] || NOTIFICATION_SURFACE.info;
                  const categoryTheme = CATEGORY_THEME[notif.category] || CATEGORY_THEME.general;

                  return (
                    <li
                      key={notif.id}
                      className={cn(
                        'mb-2 overflow-hidden rounded-2xl border transition-all duration-150 last:mb-0 hover:-translate-y-0.5 hover:border-rv-gold/30',
                        tone.item,
                        notif.isRead ? 'opacity-80 saturate-[0.82]' : 'shadow-[0_12px_30px_rgba(2,6,23,0.22)]'
                      )}
                    >
                      <div className="flex gap-3 px-4 py-3.5">
                        <div className={cn('mt-0.5 h-10 w-1 self-stretch rounded-full', tone.rail)} />
                        <div className={cn('mt-0.5 shrink-0 text-xl', tone.icon)}>
                          {getIcono(notif)}
                        </div>

                        <div className="min-w-0 flex-1 text-slate-100">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-semibold leading-[1.45] text-white tablet:text-sm">{notif.mensaje}</p>
                                <StatusBadge tone={notif.isRead ? 'neutral' : 'info'} className={notif.isRead ? 'border-white/10 bg-white/10 text-slate-200' : ''}>
                                  {notif.isRead ? 'Leida' : 'Nueva'}
                                </StatusBadge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]', categoryTheme)}>
                                  {CATEGORY_LABELS[notif.category] || 'General'}
                                </span>
                                <span className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                                  {new Date(notif.fecha).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {!notif.isRead ? (
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-500/10 text-emerald-200 transition hover:border-emerald-300/50 hover:bg-emerald-500/18 hover:text-emerald-100"
                                  onClick={() => handleMarkAsRead(notif)}
                                  aria-label={`Marcar como leida ${notif.mensaje}`}
                                  disabled={actionKey === `read-${notif.id}`}
                                >
                                  <FaCheck />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 text-red-200 transition hover:border-red-300/50 hover:bg-red-500/18 hover:text-red-100"
                                onClick={() => handleDismiss(notif)}
                                aria-label={`Eliminar ${notif.mensaje}`}
                                disabled={actionKey === `dismiss-${notif.id}`}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>

                          {notif.descripcion ? (
                            <p className="my-2 text-xs leading-[1.4] text-slate-200 tablet:text-[13px]">{notif.descripcion}</p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

NotificationBell.propTypes = {
  userRole: PropTypes.string.isRequired,
  userId: PropTypes.string,
};

export default NotificationBell;
