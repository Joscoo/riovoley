// src/features/athletes/presentation/components/AtletasManager.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  FaBroom,
  FaEdit,
  FaEnvelope,
  FaPlus,
  FaTimes,
  FaTrash,
  FaUser,
  FaUsers,
  FaVolleyballBall,
} from 'react-icons/fa';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';
import ActionConfirmModal from './shared/ActionConfirmModal';
import ActionResultModal from './shared/ActionResultModal';
import { MIN_ATHLETE_AGE } from '../../../../utils/athleteValidation';
import { useAtletasManager } from '../hooks/useAtletasManager';

const CATEGORIAS = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_mujeres',
  'perfeccionamiento_hombres',
  'master_mujeres',
];

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const AtletasManager = ({ user }) => {
  const modalTitleId = 'atleta-modal-title';
  const birthDateHintId = 'fecha-nacimiento-hint';

  const {
    initialFocusRef,
    loading,
    showModal,
    editingAtleta,
    filters,
    setFilters,
    resetFilters,
    setCurrentPage,
    formData,
    setFormData,
    maxBirthDate,
    errorMessage,
    setErrorMessage,
    pendingCredentials,
    clearPendingCredentials,
    handleSendCredentials,
    filteredAtletas,
    paginatedAtletas,
    totalPages,
    visiblePage,
    openModal,
    closeModal,
    handleSubmit,
    requestDeleteAtleta,
    requestResendCredentials,
    requestCleanOrphanUsers,
    confirmDialog,
    closeConfirmDialog,
    confirmDialogAction,
    actionResult,
    closeActionResult,
    calculateAge,
    formatIngresoDate,
    formatCategoria,
  } = useAtletasManager({ categories: CATEGORIAS });

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Atletas"
        subtitle={`Administrar deportistas del club${user?.email ? ` - Sesion: ${user.email}` : ''}`}
        icon={<FaVolleyballBall />}
        actions={
          <div className="flex w-full flex-col gap-2 mobile:w-auto mobile:flex-row">
            <Button className="w-full mobile:w-auto" onClick={() => openModal()}>
              <FaPlus className="mr-2" /> Agregar Estudiante
            </Button>
            <Button variant="outline" className="w-full mobile:w-auto" onClick={requestCleanOrphanUsers}>
              <FaBroom className="mr-2" /> Limpiar DB
            </Button>
          </div>
        }
      />

      {errorMessage ? (
        <div className="fixed inset-x-0 top-4 z-[11000] mx-auto w-full max-w-3xl px-4">
          <div className="rounded-2xl border border-red-500/60 bg-red-600/95 px-5 py-4 text-sm text-white shadow-xl shadow-red-900/20 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Error</p>
                <p className="mt-1 whitespace-pre-line">{errorMessage}</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                onClick={() => setErrorMessage(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingCredentials ? (
        <Card className="mb-4 border-l-4 border-rv-gold/70 bg-black/20 p-4 text-slate-200">
          <div className="mb-3">
            <p className="font-semibold text-white">Estudiante creado exitosamente.</p>
            <p>{pendingCredentials.message}</p>
          </div>
          <div className="grid gap-2 rounded-xl border border-rv-gold/20 bg-slate-950/50 p-4 text-sm text-slate-100">
            <p>
              <strong>Email:</strong> {pendingCredentials.email}
            </p>
            <p>
              <strong>{'Contrase\u00f1a temporal:'}</strong> {pendingCredentials.password}
            </p>
            <p>
              <strong>URL de ingreso:</strong>{' '}
              <a href={pendingCredentials.loginUrl} className="text-rv-gold underline" target="_blank" rel="noreferrer">
                {pendingCredentials.loginUrl}
              </a>
            </p>
            <p className="text-slate-400">
              Importante: comparte estas credenciales de forma segura. Si deseas enviar el email ahora, haz clic en
              &nbsp;"Enviar credenciales por email".
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 mobile:flex-row mobile:justify-end">
            <Button className="w-full mobile:w-auto" onClick={handleSendCredentials}>
              Enviar credenciales por email
            </Button>
            <Button variant="secondary" className="w-full mobile:w-auto" onClick={clearPendingCredentials}>
              Cerrar
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-4 desktop:grid-cols-[minmax(260px,2fr)_repeat(3,minmax(180px,1fr))_auto]">
          <Field label="Busqueda">
            <input
              id="athlete-search"
              type="text"
              placeholder="Buscar por nombre, apellido, categoria o email..."
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Buscar atletas"
            />
          </Field>

          <Field label="Categoria">
            <select
              id="athlete-category-filter"
              value={filters.categoria}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoria: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas las categorias</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {formatCategoria(categoria)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ordenar por">
            <select
              id="athlete-sort-by"
              value={filters.sortBy}
              onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Ordenar por"
            >
              <option value="apellido">Ordenar por apellido</option>
              <option value="nombre">Ordenar por nombre</option>
              <option value="categoria">Ordenar por categoria</option>
              <option value="edad">Ordenar por edad</option>
              <option value="ingreso">Ordenar por fecha de ingreso</option>
            </select>
          </Field>

          <Field label="Direccion">
            <select
              id="athlete-sort-order"
              value={filters.sortOrder}
              onChange={(event) => setFilters((prev) => ({ ...prev, sortOrder: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Direccion de orden"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button id="athlete-clear-filters" type="button" variant="secondary" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <p className="mb-4 text-sm text-slate-200">
        Mostrando {paginatedAtletas.length} de {filteredAtletas.length} estudiantes.
      </p>

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando atletas...</p>
          </div>
        </Card>
      ) : filteredAtletas.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title="No hay estudiantes registrados"
          description="Agrega el primer atleta al club"
          action={
            <Button onClick={() => openModal()}>
              <FaPlus className="mr-2" /> Agregar Estudiante
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              {'P\u00e1gina'} {visiblePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
            >
              Siguiente
            </Button>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {paginatedAtletas.map((atleta) => (
              <Card key={atleta.id} variant="solid" className="flex h-full flex-col border border-rv-gold/30 text-slate-900">
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-bold leading-tight">{atleta.full_name}</h3>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="border-emerald-400/40 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25"
                      onClick={() => openModal(atleta)}
                      title="Editar"
                      aria-label={`Editar estudiante ${atleta.full_name}`}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="border-blue-400/40 bg-blue-500/15 text-blue-800 hover:bg-blue-500/25"
                      onClick={() => requestResendCredentials(atleta)}
                      title="Reenviar credenciales"
                      aria-label={`Reenviar credenciales a ${atleta.full_name}`}
                    >
                      <FaEnvelope />
                    </Button>
                    <Button
                      size="icon"
                      variant="danger"
                      onClick={() => requestDeleteAtleta(atleta)}
                      title="Eliminar"
                      aria-label={`Eliminar estudiante ${atleta.full_name}`}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>

                <dl className="grid gap-2 text-sm text-slate-700 mobile:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Categoria</dt>
                    <dd>
                      <span className="inline-flex rounded-md bg-amber-200 px-2 py-1 text-xs font-bold text-amber-950">
                        {formatCategoria(atleta.categoria)}
                      </span>
                    </dd>
                  </div>

                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Edad</dt>
                    <dd>{calculateAge(atleta.fecha_nacimiento)} anos</dd>
                  </div>

                  <div className="flex flex-col gap-1 mobile:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Email</dt>
                    <dd className="break-all">{atleta.email}</dd>
                  </div>

                  <div className="flex flex-col gap-1 mobile:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Telefono</dt>
                    <dd className="break-words">{atleta.telefono || '--'}</dd>
                  </div>
                </dl>

                <div className="mt-auto border-t border-slate-200 pt-3 text-center text-xs font-semibold text-slate-500">
                  Ingreso: {formatIngresoDate(atleta)}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              {'P\u00e1gina'} {visiblePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeModal}>
          <Card
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-rv-gold/25 pb-3">
              <h3 id={modalTitleId} className="text-lg font-bold text-white mobile:text-xl">
                {editingAtleta ? (
                  <>
                    <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Editar Estudiante</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Agregar Nuevo Estudiante</span>
                  </>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal">
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
                  <FaUser className="mr-2 inline align-middle" /> Informacion Personal del Usuario
                </h4>

                <div className="grid gap-4 mobile:grid-cols-2">
                  <Field label="Nombre *">
                    <input
                      ref={initialFocusRef}
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                      required
                      placeholder="Ingrese el nombre"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Apellido *">
                    <input
                      id="apellido"
                      type="text"
                      value={formData.apellido}
                      onChange={(event) => setFormData((prev) => ({ ...prev, apellido: event.target.value }))}
                      required
                      placeholder="Ingrese el apellido"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Email *">
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                      required
                      placeholder="ejemplo@email.com"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Telefono">
                    <input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(event) => setFormData((prev) => ({ ...prev, telefono: event.target.value }))}
                      placeholder="09xxxxxxxx"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field
                    label="Fecha de Nacimiento *"
                    hint={
                      <>
                        <p id={birthDateHintId}>Edad minima permitida: {MIN_ATHLETE_AGE} anos.</p>
                        {formData.fecha_nacimiento ? (
                          <p className="mt-1 font-semibold text-rv-gold">
                            Edad calculada: {calculateAge(formData.fecha_nacimiento)} anos.
                          </p>
                        ) : null}
                      </>
                    }
                    className="mobile:col-span-2"
                  >
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, fecha_nacimiento: event.target.value }))
                      }
                      max={maxBirthDate}
                      aria-describedby={birthDateHintId}
                      required
                      className={INPUT_BASE}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
                  <FaVolleyballBall className="mr-2 inline align-middle" /> Informacion Deportiva
                </h4>

                <Field label="Categoria *">
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(event) => setFormData((prev) => ({ ...prev, categoria: event.target.value }))}
                    required
                    className={INPUT_BASE}
                  >
                    <option value="">Seleccionar categoria</option>
                    {CATEGORIAS.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {formatCategoria(categoria)}
                      </option>
                    ))}
                  </select>
                </Field>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-rv-gold/20 pt-4 mobile:flex-row mobile:justify-end">
                <Button type="button" variant="secondary" onClick={closeModal} className="w-full mobile:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full mobile:w-auto">
                  {editingAtleta ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <ActionConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        tone={confirmDialog.tone}
        onConfirm={confirmDialogAction}
        onCancel={closeConfirmDialog}
      />

      <ActionResultModal
        isOpen={Boolean(actionResult)}
        title={actionResult?.title || 'Resultado'}
        message={actionResult?.message || ''}
        onClose={closeActionResult}
      />
    </div>
  );
};

AtletasManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
};

export default AtletasManager;

