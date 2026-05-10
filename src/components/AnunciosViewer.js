// src/components/AnunciosViewer.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaBullhorn, FaClock, FaExclamationCircle, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { announcementsService } from '../features/announcements';
import { calcularDiferenciaDias, getEcuadorDate, getEcuadorDateTime } from '../utils/dateUtils';
import { cn } from '../lib/cn';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';

const PRIORITIES = [
  {
    value: 'low',
    label: 'Baja',
    icon: <FaExclamationCircle />,
    borderClass: 'border-l-green-400',
    activeFilterClass: 'border-green-400 bg-green-500/20 text-green-100',
    iconClass: 'text-green-300'
  },
  {
    value: 'normal',
    label: 'Normal',
    icon: <FaBullhorn />,
    borderClass: 'border-l-blue-400',
    activeFilterClass: 'border-blue-400 bg-blue-500/20 text-blue-100',
    iconClass: 'text-blue-300'
  },
  {
    value: 'high',
    label: 'Alta',
    icon: <FaExclamationCircle />,
    borderClass: 'border-l-orange-400',
    activeFilterClass: 'border-orange-400 bg-orange-500/20 text-orange-100',
    iconClass: 'text-orange-300'
  },
  {
    value: 'urgent',
    label: 'Urgente',
    icon: <FaExclamationTriangle />,
    borderClass: 'border-l-red-400',
    activeFilterClass: 'border-red-400 bg-red-500/20 text-red-100',
    iconClass: 'text-red-300'
  }
];

const AnunciosViewer = ({ userRole = 'all', limit = null, showFilters = false }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    loadAnuncios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, selectedPriority]);

  const loadAnuncios = async () => {
    setLoading(true);
    try {
      const data = await announcementsService.loadViewerAnnouncements({
        userRole,
        selectedPriority,
        limit
      });
      setAnuncios(data || []);
    } catch (error) {
      console.error('Error al cargar anuncios:', error);
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityInfo = (priority) => PRIORITIES.find((item) => item.value === priority) || PRIORITIES[1];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const now = getEcuadorDate();
    const diffDays = calcularDiferenciaDias(dateString, now);

    if (diffDays < 0) return '';
    if (diffDays === 0) return 'Expira hoy';
    if (diffDays === 1) return 'Expira manana';
    if (diffDays <= 7) return `Expira en ${diffDays} dias`;

    const date = new Date(dateString);
    return `Valido hasta ${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  };

  const formatCreatedDate = (dateString) => {
    const date = new Date(dateString);
    const now = getEcuadorDateTime();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} dias`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rv-gold/25 border-t-rv-gold" />
        <p className="text-sm text-slate-200 mobile:text-base">Cargando anuncios...</p>
      </Card>
    );
  }

  return (
    <div className="w-full">
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-rv-gold/20 bg-white/5 p-3 backdrop-blur-md mobile:p-4">
          <button
            type="button"
            className={cn(
              'inline-flex min-h-[48px] items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-rv-gold/40 hover:bg-rv-gold/15',
              selectedPriority === 'all' && 'border-rv-gold/50 bg-rv-gold/25 text-white'
            )}
            onClick={() => setSelectedPriority('all')}
          >
            Todos
          </button>
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              type="button"
              className={cn(
                'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/10',
                selectedPriority === priority.value ? priority.activeFilterClass : 'border-transparent'
              )}
              onClick={() => setSelectedPriority(priority.value)}
            >
              <span className={cn('text-base', priority.iconClass)}>{priority.icon}</span>
              {priority.label}
            </button>
          ))}
        </div>
      )}

      {anuncios.length === 0 ? (
        <EmptyState
          icon={<FaBullhorn />}
          title="No hay anuncios disponibles"
          description={
            selectedPriority !== 'all'
              ? `No hay anuncios de prioridad ${PRIORITIES.find((item) => item.value === selectedPriority)?.label.toLowerCase()} en este momento.`
              : 'No hay anuncios en este momento.'
          }
        />
      ) : (
        <div className="grid gap-4 tablet:grid-cols-2">
          {anuncios.map((anuncio) => {
            const priorityInfo = getPriorityInfo(anuncio.priority);
            const expirationText = formatDate(anuncio.expires_at);

            return (
              <Card
                key={anuncio.id}
                className={cn('flex h-full flex-col gap-3 border-l-4', priorityInfo.borderClass)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <span className={cn('text-lg', priorityInfo.iconClass)}>
                      {priorityInfo.icon}
                    </span>
                    <span className={cn('text-xs font-black uppercase tracking-wide', priorityInfo.iconClass)}>
                      {priorityInfo.label}
                    </span>
                  </div>
                  {expirationText ? (
                    <span className="inline-flex items-center rounded-md border border-orange-300/50 bg-orange-500/15 px-2 py-1 text-[11px] font-semibold text-orange-200">
                      <FaClock className="mr-1" />
                      {expirationText}
                    </span>
                  ) : null}
                </div>

                <h3 className="text-lg font-bold leading-tight text-white">{anuncio.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-slate-200">{anuncio.content}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rv-gold/20 pt-3 text-xs">
                  <span className="inline-flex items-center text-rv-gold">
                    <FaUser className="mr-1" /> {anuncio.creator_name || 'Riovoley'}
                  </span>
                  <span className="text-slate-400">{formatCreatedDate(anuncio.created_at)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

AnunciosViewer.propTypes = {
  userRole: PropTypes.oneOf(['all', 'estudiantes', 'entrenadores', 'administradores']),
  limit: PropTypes.number,
  showFilters: PropTypes.bool
};

export default AnunciosViewer;
