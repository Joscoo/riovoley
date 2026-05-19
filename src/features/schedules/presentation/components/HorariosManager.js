// src/features/schedules/presentation/components/HorariosManager.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  FaCalendarAlt,
  FaCalendarWeek,
  FaClock,
  FaEdit,
  FaFilter,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';
import useHorariosManager from '../hooks/useHorariosManager';
import DeleteHorarioConfirmModal from './shared/DeleteHorarioConfirmModal';

const DAYS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miercoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sabado' },
  { value: 'domingo', label: 'Domingo' },
];

const CATEGORIES = [
  { value: 'iniciacion_hombres', label: 'Iniciacion Hombres' },
  { value: 'iniciacion_mujeres', label: 'Iniciacion Mujeres' },
  { value: 'perfeccionamiento_hombres', label: 'Perfeccionamiento Hombres' },
  { value: 'perfeccionamiento_mujeres', label: 'Perfeccionamiento Mujeres' },
  { value: 'master_mujeres', label: 'Master Mujeres' },
  { value: 'open_gym', label: 'Open Gym' },
];

const CATEGORY_STYLES = {
  iniciacion_hombres: {
    borderClass: 'border-l-sky-500',
    badgeClass: 'bg-sky-500 text-white',
  },
  iniciacion_mujeres: {
    borderClass: 'border-l-pink-500',
    badgeClass: 'bg-pink-500 text-white',
  },
  perfeccionamiento_hombres: {
    borderClass: 'border-l-emerald-500',
    badgeClass: 'bg-emerald-500 text-white',
  },
  perfeccionamiento_mujeres: {
    borderClass: 'border-l-violet-500',
    badgeClass: 'bg-violet-500 text-white',
  },
  master_mujeres: {
    borderClass: 'border-l-amber-500',
    badgeClass: 'bg-amber-500 text-slate-900',
  },
  open_gym: {
    borderClass: 'border-l-teal-500',
    badgeClass: 'bg-teal-500 text-white',
  },
  fallback: {
    borderClass: 'border-l-slate-400',
    badgeClass: 'bg-slate-500 text-white',
  },
};

const getCategoriaLabel = (categoria) => {
  const item = CATEGORIES.find((category) => category.value === categoria);
  return item ? item.label : categoria;
};

const getCategoryStyle = (categoria) => CATEGORY_STYLES[categoria] || CATEGORY_STYLES.fallback;

const HorariosManager = ({ user }) => {
  const {
    horarios,
    loading,
    showForm,
    editingId,
    filterDay,
    setFilterDay,
    filterCategory,
    setFilterCategory,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    resetFilters,
    formData,
    message,
    deleteDialog,
    horariosAgrupados,
    getDescripcionPorDefecto,
    toggleFormVisibility,
    resetForm,
    handleSubmit,
    handleEdit,
    requestDeleteHorario,
    cancelDeleteHorario,
    confirmDeleteHorario,
    handleChange,
    handleDiaToggle,
    handleCategoriaToggle,
    formatTime,
  } = useHorariosManager({ days: DAYS });

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rv-gold/20 border-t-rv-gold" />
        <p className="text-slate-200">Cargando horarios...</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Horarios"
        subtitle="Administra los horarios de entrenamientos."
        icon={<FaCalendarWeek />}
        actions={
          <Button type="button" onClick={toggleFormVisibility} className="w-full mobile:w-auto">
            {showForm ? <FaTimes className="mr-2" /> : <FaPlus className="mr-2" />}
            {showForm ? 'Cancelar' : 'Nuevo Horario'}
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

      <div className="mb-5 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-3">
          <FaClock className="text-3xl text-sky-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Total Horarios</p>
            <p className="text-2xl font-black text-white">{horarios.length}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <FaCalendarAlt className="text-3xl text-emerald-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Dias Activos</p>
            <p className="text-2xl font-black text-white">{Object.keys(horariosAgrupados).length}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <FaUsers className="text-3xl text-pink-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Categorias</p>
            <p className="text-2xl font-black text-white">{new Set(horarios.map((item) => item.categoria)).size}</p>
          </div>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-5" padding="lg">
          <h3 className="mb-4 text-xl font-black text-white">{editingId ? 'Editar Horario' : 'Nuevo Horario'}</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!editingId && (
              <div className="space-y-3 rounded-xl border border-rv-gold/15 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rv-gold">
                  <FaCalendarAlt /> Selecciona los dias
                </p>

                <label className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-rv-gold/20 bg-black/25 px-3 py-2.5 text-sm text-white">
                  <input
                    type="checkbox"
                    name="aplicar_todos_dias"
                    checked={formData.aplicar_todos_dias}
                    onChange={handleChange}
                    className="h-4 w-4 accent-yellow-400"
                  />
                  Aplicar a todos los dias de la semana
                </label>

                {!formData.aplicar_todos_dias && (
                  <div className="grid gap-2 mobile:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4">
                    {DAYS.map((day) => {
                      const active = formData.dias_seleccionados.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDiaToggle(day.value)}
                          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                            active
                              ? 'border-rv-gold/65 bg-rv-gold/20 text-rv-gold'
                              : 'border-white/20 bg-white/5 text-slate-200 hover:border-rv-gold/35 hover:bg-rv-gold/10'
                          }`}
                        >
                          <FaCalendarAlt /> {day.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-rv-gold/15 bg-white/5 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rv-gold">
                <FaUsers /> Selecciona las categorias
              </p>

              <div className="grid gap-2 mobile:grid-cols-2 desktop:grid-cols-3">
                {CATEGORIES.map((category) => {
                  const active = formData.categorias_seleccionadas.includes(category.value);
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => handleCategoriaToggle(category.value)}
                      className={cn(
                        'inline-flex min-h-[48px] items-center gap-2 rounded-lg border-l-4 px-3 py-2 text-left text-sm font-semibold transition-all duration-200',
                        active
                          ? `bg-white/12 text-white ${getCategoryStyle(category.value).borderClass}`
                          : 'border-l-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                      )}
                    >
                      <FaUsers /> {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 mobile:grid-cols-2">
              <Field label="Hora Inicio" icon={<FaClock />}>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  required
                />
              </Field>

              <Field label="Hora Fin" icon={<FaClock />}>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  required
                />
              </Field>
            </div>

            <Field label="Descripcion (opcional)" icon={<FaUsers />}>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder={`Descripcion sugerida: ${getDescripcionPorDefecto(formData.categorias_seleccionadas[0])}`}
                className="w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2.5 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
              />
              <p className="mt-2 text-xs text-slate-300">
                Si dejas vacio, se usara la descripcion por defecto segun la categoria.
              </p>
            </Field>

            {!editingId && (
              <Card variant="soft" padding="sm">
                <p className="text-sm text-white">
                  <strong className="text-rv-gold">Resumen:</strong> se crearan{' '}
                  {(formData.aplicar_todos_dias ? DAYS.length : formData.dias_seleccionados.length) * formData.categorias_seleccionadas.length}{' '}
                  horario(s).
                </p>
              </Card>
            )}

            <div className="grid gap-3 border-t border-rv-gold/15 pt-4 mobile:grid-cols-2">
              <Button type="button" variant="secondary" className="w-full" onClick={resetForm}>
                <FaTimes className="mr-2" /> Cancelar
              </Button>
              <Button type="submit" className="w-full">
                <FaSave className="mr-2" /> {editingId ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-5" padding="sm">
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rv-gold">
          <FaFilter /> Filtrar Horarios
        </p>
        <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-5">
          <Field label="Dia">
            <select
              id="schedules-filter-day"
              value={filterDay}
              onChange={(event) => setFilterDay(event.target.value)}
              className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            >
              <option value="todos">Todos los dias</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Categoria">
            <select
              id="schedules-filter-category"
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            >
              <option value="todos">Todas las categorias</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Ordenar por">
            <select
              id="schedules-sort-field"
              value={sortField}
              onChange={(event) => setSortField(event.target.value)}
              className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            >
              <option value="dia_semana">Dia</option>
              <option value="hora_inicio">Hora inicio</option>
              <option value="hora_fin">Hora fin</option>
              <option value="categoria">Categoria</option>
            </select>
          </Field>

          <Field label="Direccion">
            <select
              id="schedules-sort-direction"
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value)}
              className="h-12 w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button
              id="schedules-clear-filters"
              type="button"
              variant="secondary"
              className="w-full"
              onClick={resetFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {Object.keys(horariosAgrupados).length === 0 ? (
          <EmptyState
            icon={<FaCalendarAlt />}
            title="No hay horarios registrados"
            description="Comienza agregando un nuevo horario."
          />
        ) : (
          DAYS.filter((day) => horariosAgrupados[day.value]).map((day) => (
            <Card key={day.value} className="overflow-hidden" padding="sm">
              <h3 className="mb-3 inline-flex items-center gap-2 border-b border-rv-gold/20 pb-2 text-xl font-black text-rv-gold">
                <FaCalendarAlt /> {day.label}
              </h3>

              <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
                {horariosAgrupados[day.value].map((schedule) => (
                  <Card
                    key={schedule.id}
                    padding="sm"
                    className={cn(
                      'flex h-full flex-col gap-3 border-l-4',
                      getCategoryStyle(schedule.categoria).borderClass
                    )}
                  >
                    <span
                      className={cn(
                        'w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                        getCategoryStyle(schedule.categoria).badgeClass
                      )}
                    >
                      {getCategoriaLabel(schedule.categoria)}
                    </span>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-rv-gold/20 bg-white/8 px-3 py-2 text-white">
                      <FaClock className="text-rv-gold" />
                      <span className="font-bold">{formatTime(schedule.hora_inicio)} - {formatTime(schedule.hora_fin)}</span>
                    </div>

                    {schedule.descripcion ? (
                      <p className="text-sm leading-relaxed text-slate-200">{schedule.descripcion}</p>
                    ) : null}

                    <div className="mt-auto flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-sky-300/35 bg-sky-500/15 text-sky-200 transition-all duration-200 hover:bg-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
                        onClick={() => handleEdit(schedule)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-red-300/35 bg-red-500/15 text-red-200 transition-all duration-200 hover:bg-red-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80"
                        onClick={() => requestDeleteHorario(schedule.id)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <DeleteHorarioConfirmModal
        open={deleteDialog.open}
        onCancel={cancelDeleteHorario}
        onConfirm={confirmDeleteHorario}
      />
    </div>
  );
};

HorariosManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
  }),
};

HorariosManager.defaultProps = {
  user: null,
};

export default HorariosManager;

