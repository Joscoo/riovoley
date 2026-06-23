// src/features/announcements/presentation/components/AnunciosManager.js
import React from 'react';
import PropTypes from 'prop-types';
import { FaBell, FaBellSlash, FaBullhorn, FaEdit, FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';
import useAnnouncementsManager from '../hooks/useAnnouncementsManager';
import AnnouncementDeleteConfirmModal from './shared/AnnouncementDeleteConfirmModal';

const PRIORITIES = [
  {
    value: 'low',
    label: 'Baja',
    borderClass: 'border-l-green-400',
    badgeClass: 'bg-green-400 text-slate-950',
  },
  {
    value: 'normal',
    label: 'Normal',
    borderClass: 'border-l-blue-400',
    badgeClass: 'bg-blue-400 text-slate-950',
  },
  {
    value: 'high',
    label: 'Alta',
    borderClass: 'border-l-orange-400',
    badgeClass: 'bg-orange-400 text-slate-950',
  },
  {
    value: 'urgent',
    label: 'Urgente',
    borderClass: 'border-l-red-400',
    badgeClass: 'bg-red-400 text-slate-950',
  },
];

const AUDIENCES = [
  { value: 'all', label: 'Todos' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'entrenadores', label: 'Entrenadores' },
  { value: 'administradores', label: 'Administradores' },
];

const AnunciosManager = ({ user }) => {
  const {
    anuncios,
    loading,
    showModal,
    editingAnuncio,
    filters,
    setFilters,
    formData,
    message,
    confirmDelete,
    helpers,
    handleOpenModal,
    handleCloseModal,
    handleInputChange,
    handleAudienceChange,
    handleSubmit,
    handleToggleActive,
    requestDelete,
    cancelDelete,
    confirmDeleteAnnouncement,
  } = useAnnouncementsManager({ user });

  const getPriorityInfo = (priority) => PRIORITIES.find((item) => item.value === priority) || PRIORITIES[1];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Anuncios"
        subtitle="Crea y administra anuncios para estudiantes, entrenadores y administradores."
        icon={<FaBullhorn />}
        actions={(
          <Button data-guide-id="announcements-new-button" onClick={() => handleOpenModal()} className="w-full mobile:w-auto">
            <FaPlus className="mr-2" /> Nuevo Anuncio
          </Button>
        )}
      />

      {message.text ? (
        <div
          className={cn(
            'mb-4 rounded-xl border px-4 py-3 text-sm font-semibold',
            message.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-red-400/40 bg-red-500/15 text-red-200'
          )}
        >
          {message.text}
        </div>
      ) : null}

      <Card className="mb-5" padding="sm">
        <div className="grid gap-3 tablet:grid-cols-4">
          <input
            type="text"
            placeholder="Buscar por titulo o contenido..."
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            className="h-12 rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 tablet:col-span-2"
          />

          <select
            value={filters.priority}
            onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
            className="h-12 rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
          >
            <option value="">Todas las prioridades</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          <select
            value={filters.is_active}
            onChange={(event) => setFilters({ ...filters, is_active: event.target.value })}
            className="h-12 rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
          >
            <option value="all">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rv-gold/20 border-t-rv-gold" />
          <p className="text-slate-200">Cargando anuncios...</p>
        </Card>
      ) : anuncios.length === 0 ? (
        <EmptyState
          icon={<FaBullhorn />}
          title="No hay anuncios para mostrar"
          description="Crea el primer anuncio para comenzar la comunicacion con el club."
          action={<Button onClick={() => handleOpenModal()}>Crear primer anuncio</Button>}
        />
      ) : (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {anuncios.map((anuncio) => {
            const priorityInfo = getPriorityInfo(anuncio.priority);
            const expired = helpers.isExpired(anuncio.expires_at);

            return (
              <Card
                key={anuncio.id}
                className={cn(
                  'flex h-full flex-col gap-3 border-l-4',
                  priorityInfo.borderClass,
                  !anuncio.is_active && 'opacity-65',
                  expired && 'border-red-400/60'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide',
                        priorityInfo.badgeClass
                      )}
                    >
                      {priorityInfo.label}
                    </span>
                    {!anuncio.is_active ? (
                      <span className="rounded-full border border-slate-300/40 bg-slate-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-300">
                        Inactivo
                      </span>
                    ) : null}
                    {expired ? (
                      <span className="rounded-full border border-red-300/45 bg-red-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-200">
                        Expirado
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-rv-gold/25 bg-black/25 text-rv-gold transition-all duration-200 hover:bg-rv-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                      onClick={() => handleToggleActive(anuncio)}
                      title={anuncio.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {anuncio.is_active ? <FaBellSlash /> : <FaBell />}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-rv-gold/25 bg-black/25 text-rv-gold transition-all duration-200 hover:bg-rv-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                      onClick={() => handleOpenModal(anuncio)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-red-400/35 bg-red-500/10 text-red-200 transition-all duration-200 hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80"
                      onClick={() => requestDelete(anuncio.id)}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold leading-tight text-white">{anuncio.title}</h3>
                <p className="line-clamp-5 flex-1 text-sm leading-relaxed text-slate-200">{anuncio.content}</p>

                <div className="space-y-2 border-t border-rv-gold/15 pt-3 text-xs text-slate-300">
                  <p className="inline-flex items-center"><FaUser className="mr-1.5" /> {anuncio.creator_name || 'Usuario'}</p>
                  <p>Creado: {helpers.formatDate(anuncio.created_at)}</p>
                  {anuncio.expires_at ? <p>Expira: {helpers.formatDate(anuncio.expires_at)}</p> : null}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {anuncio.target_audience?.map((audience) => (
                      <span key={audience} className="rounded-md border border-sky-300/35 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
                        {AUDIENCES.find((item) => item.value === audience)?.label || audience}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal ? (
        <div
          className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm mobile:items-center mobile:p-4"
          onClick={handleCloseModal}
        >
          <Card
            className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border-rv-gold/30 bg-rv-panel mobile:rounded-2xl"
            padding="none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rv-gold/20 bg-rv-dark/95 px-4 py-3 backdrop-blur-md mobile:px-6 mobile:py-4">
              <h2 className="text-lg font-black text-white mobile:text-xl">{editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-red-300/35 bg-red-500/10 text-red-200 transition-all duration-200 hover:rotate-90 hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 mobile:px-6 mobile:py-5">
              <Field label="Titulo *">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Titulo del anuncio"
                  required
                  maxLength="255"
                  className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                />
              </Field>

              <Field label="Contenido *">
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Describe el anuncio..."
                  required
                  rows="6"
                  className="w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2.5 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                />
              </Field>

              <Field label="Prioridad">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Audiencia Objetivo">
                <div className="grid gap-2 mobile:grid-cols-2">
                  {AUDIENCES.map((audience) => (
                    <label
                      key={audience.value}
                      className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-lg border border-rv-gold/20 bg-white/5 px-3 py-2.5 text-sm text-slate-100 transition-all duration-200 hover:bg-rv-gold/10"
                    >
                      <input
                        type="checkbox"
                        checked={formData.target_audience.includes(audience.value)}
                        onChange={() => handleAudienceChange(audience.value)}
                        className="h-4 w-4 accent-yellow-400"
                      />
                      <span>{audience.label}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Fecha de Expiracion (opcional)">
                <input
                  type="date"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 rv-dark-date-input"
                />
              </Field>

              <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-lg border border-rv-gold/20 bg-white/5 px-3 py-2.5 text-sm text-slate-100">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span>Anuncio activo</span>
              </label>

              <div className="grid gap-3 border-t border-rv-gold/15 pt-4 mobile:grid-cols-2">
                <Button type="button" variant="secondary" className="w-full" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="w-full">
                  {editingAnuncio ? 'Actualizar' : 'Crear'} Anuncio
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <AnnouncementDeleteConfirmModal
        open={confirmDelete.open}
        onCancel={cancelDelete}
        onConfirm={confirmDeleteAnnouncement}
      />
    </div>
  );
};

AnunciosManager.propTypes = {
  user: PropTypes.object.isRequired,
};

export default AnunciosManager;

