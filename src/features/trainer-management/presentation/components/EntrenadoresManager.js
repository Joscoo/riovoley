// src/features/trainer-management/presentation/components/EntrenadoresManager.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  FaCheckCircle,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaUserTie,
  FaUsers,
} from 'react-icons/fa';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';
import useEntrenadoresManager from '../hooks/useEntrenadoresManager';
import DeleteEntrenadorConfirmModal from './shared/DeleteEntrenadorConfirmModal';

const EntrenadoresManager = ({ user }) => {
  const {
    loading,
    showModal,
    editingEntrenador,
    filters,
    setFilters,
    resetFilters,
    formData,
    setFormData,
    message,
    pendingCredentials,
    deleteDialog,
    filteredEntrenadores,
    openModal,
    closeModal,
    handleSubmit,
    copyPendingCredentials,
    closeCredentialsCard,
    requestDelete,
    cancelDelete,
    confirmDelete,
    formatDate,
    formatDateTime,
  } = useEntrenadoresManager();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Entrenadores"
        subtitle="Administra el equipo tecnico, actualiza datos y registra nuevos perfiles."
        icon={<FaUserTie />}
        actions={
          <Button className="w-full mobile:w-auto" onClick={() => openModal()}>
            <FaPlus className="mr-2" /> Nuevo Entrenador
          </Button>
        }
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

      {pendingCredentials ? (
        <Card className="mb-4 border-l-4 border-rv-gold/70 bg-black/20 p-4 text-slate-200">
          <div className="mb-3">
            <p className="font-semibold text-white">Entrenador creado exitosamente.</p>
            <p>{pendingCredentials.canLogin ? 'Login verificado: puede iniciar sesion de inmediato.' : 'Puede requerir confirmacion de email.'}</p>
          </div>
          <div className="grid gap-2 rounded-xl border border-rv-gold/20 bg-slate-950/50 p-4 text-sm text-slate-100">
            <p><strong>Email:</strong> {pendingCredentials.email}</p>
            <p><strong>{'Contrasena temporal:'}</strong> {pendingCredentials.password}</p>
            <p>
              <strong>URL de ingreso:</strong>{' '}
              <a href={pendingCredentials.loginUrl} className="text-rv-gold underline" target="_blank" rel="noreferrer">
                {pendingCredentials.loginUrl}
              </a>
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 mobile:flex-row mobile:justify-end">
            <Button className="w-full mobile:w-auto" onClick={copyPendingCredentials}>
              Copiar credenciales
            </Button>
            <Button variant="secondary" className="w-full mobile:w-auto" onClick={closeCredentialsCard}>
              Cerrar
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-5 mobile:items-end">
          <Field label="Buscar entrenadores">
            <input
              id="trainer-management-search"
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Nombre, apellido o email"
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
          </Field>

          <Field label="Estado">
            <select
              id="trainer-management-status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </Field>

          <Field label="Ordenar por">
            <select
              id="trainer-management-sort-by"
              value={filters.sortBy}
              onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            >
              <option value="apellido">Apellido</option>
              <option value="nombre">Nombre</option>
              <option value="email">Email</option>
              <option value="created_at">Fecha de registro</option>
            </select>
          </Field>

          <Field label="Direccion">
            <select
              id="trainer-management-sort-order"
              value={filters.sortOrder}
              onChange={(event) => setFilters((current) => ({ ...current, sortOrder: event.target.value }))}
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button id="trainer-management-clear-filters" type="button" variant="secondary" className="w-full" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>

          <div className="inline-flex min-h-12 items-center rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100">
            {filteredEntrenadores.length} entrenador{filteredEntrenadores.length === 1 ? '' : 'es'}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando entrenadores...</p>
          </div>
        </Card>
      ) : filteredEntrenadores.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title={filters.search || filters.status !== 'all' ? 'No se encontraron entrenadores' : 'No hay entrenadores registrados'}
          description={
            filters.search || filters.status !== 'all'
              ? 'Prueba con otro termino de busqueda para ubicar al entrenador.'
              : 'Crea el primer entrenador para empezar a gestionar el equipo.'
          }
          action={
            !filters.search && filters.status === 'all' ? (
              <Button onClick={() => openModal()}>
                <FaPlus className="mr-2" /> Crear Entrenador
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {filteredEntrenadores.map((entrenador) => (
            <Card key={entrenador.id} className="flex h-full flex-col gap-4">
              <div className="border-b border-white/10 pb-3">
                <p className="text-lg font-bold text-white">
                  {entrenador.nombre} {entrenador.apellido}
                </p>
                <p className="mt-1 break-all text-sm text-slate-300">{entrenador.email}</p>
              </div>

              <dl className="space-y-2 text-sm text-slate-200">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Telefono</dt>
                  <dd className="break-words">{entrenador.telefono || 'N/A'}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Nacimiento</dt>
                  <dd>{formatDate(entrenador.fecha_nacimiento)}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Ultimo login</dt>
                  <dd>{formatDateTime(entrenador.last_login)}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Registro</dt>
                  <dd>{formatDate(entrenador.created_at)}</dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => openModal(entrenador)}
                  aria-label={`Editar entrenador ${entrenador.nombre} ${entrenador.apellido}`}
                >
                  <FaEdit className="mr-2" /> Editar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => requestDelete(entrenador.id)}
                  aria-label={`Eliminar entrenador ${entrenador.nombre} ${entrenador.apellido}`}
                >
                  <FaTrash className="mr-2" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <Card
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white mobile:text-xl">
                {editingEntrenador ? (
                  <>
                    <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Editar Entrenador</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Nuevo Entrenador</span>
                  </>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal de entrenador">
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 mobile:grid-cols-2">
                <Field label="Nombre *">
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>

                <Field label="Apellido *">
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(event) => setFormData((prev) => ({ ...prev, apellido: event.target.value }))}
                    required
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>
              </div>

              <Field
                label="Email *"
                hint={
                  editingEntrenador
                    ? 'El email no puede ser modificado.'
                    : 'Se generara una contrasena temporal automaticamente.'
                }
              >
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  disabled={Boolean(editingEntrenador)}
                  className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>

              <div className="grid gap-4 mobile:grid-cols-2">
                <Field label="Telefono">
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(event) => setFormData((prev) => ({ ...prev, telefono: event.target.value }))}
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>

                <Field label="Fecha de Nacimiento">
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(event) => setFormData((prev) => ({ ...prev, fecha_nacimiento: event.target.value }))}
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
                <Button type="button" variant="secondary" onClick={closeModal} className="w-full mobile:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full mobile:w-auto">
                  {editingEntrenador ? (
                    <>
                      <FaSave className="mr-2" /> Actualizar
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" /> Registrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <DeleteEntrenadorConfirmModal
        open={deleteDialog.open}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

EntrenadoresManager.propTypes = {
  user: PropTypes.object.isRequired,
};

export default EntrenadoresManager;

