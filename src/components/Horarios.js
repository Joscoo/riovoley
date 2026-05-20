import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaInfoCircle, FaUsers } from 'react-icons/fa';
import { schedulesService } from '../features/schedules';
import { cn } from '../lib/cn';
import { PageShell } from '../shared/ui';
import { Card } from '../shared/ui';
import { SectionHeader } from '../shared/ui';
import { EmptyState } from '../shared/ui';
import { StatusBadge } from '../shared/ui';
import { Button } from '../shared/ui';

const DAYS = [
  { value: 'todos', label: 'Todos los dias' },
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miercoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sabado' },
  { value: 'domingo', label: 'Domingo' }
];

const CATEGORY_DATA = {
  iniciacion_hombres: {
    label: 'Iniciacion Hombres',
    borderClass: 'border-l-sky-500',
    badgeClass: 'bg-sky-500/20 text-sky-300',
    description:
      'Perfecto para quienes se inician en voleibol. Aprende fundamentos basicos como recepcion, saque y posicionamiento.'
  },
  iniciacion_mujeres: {
    label: 'Iniciacion Mujeres',
    borderClass: 'border-l-pink-500',
    badgeClass: 'bg-pink-500/20 text-pink-300',
    description:
      'Ideal para principiantes que quieren aprender desde cero en un entorno motivador y de apoyo constante.'
  },
  perfeccionamiento_hombres: {
    label: 'Perfeccionamiento Hombres',
    borderClass: 'border-l-emerald-500',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    description:
      'Para jugadores con experiencia que buscan mejorar tecnica y tactica con enfoque competitivo.'
  },
  perfeccionamiento_mujeres: {
    label: 'Perfeccionamiento Mujeres',
    borderClass: 'border-l-violet-500',
    badgeClass: 'bg-violet-500/20 text-violet-300',
    description:
      'Entrenamiento avanzado para jugadoras con bases solidas y mejora tactica individual y colectiva.'
  },
  master_mujeres: {
    label: 'Master Mujeres',
    borderClass: 'border-l-amber-500',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    description:
      'Categoria para atletas mayores de 18 anos con experiencia previa para mantener nivel competitivo.'
  },
  open_gym: {
    label: 'Open Gym',
    borderClass: 'border-l-teal-500',
    badgeClass: 'bg-teal-500/20 text-teal-300',
    description:
      'Sesión de juego libre para practicar, compartir con otras categorias y disfrutar partidos recreativos.'
  }
};

const formatTime = (time) => (time ? time.slice(0, 5) : '');

const Horarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('todos');

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');

      const sorted = await schedulesService.loadHorarios();
      setHorarios(sorted);
    } catch (requestError) {
      console.error('Error loading schedules:', requestError);
      setError(`Error al cargar los horarios: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const filteredSchedules = useMemo(() => {
    if (selectedDay === 'todos') return horarios;
    return horarios.filter((item) => item.dia_semana === selectedDay);
  }, [horarios, selectedDay]);

  const groupedSchedules = useMemo(() => {
    return filteredSchedules.reduce((accumulator, schedule) => {
      if (!accumulator[schedule.dia_semana]) {
        accumulator[schedule.dia_semana] = [];
      }
      accumulator[schedule.dia_semana].push(schedule);
      return accumulator;
    }, {});
  }, [filteredSchedules]);

  return (
    <PageShell>
      <section className="px-4 pb-8 pt-16 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            title="Horarios de Entrenamientos"
            subtitle="Consulta nuestros horarios actualizados y elige el mejor momento para entrenar."
            centered
          />

          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-rv-gold/25 bg-black/35 p-3 backdrop-blur-md mobile:p-4">
            <label className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rv-gold/95">
              <FaCalendarAlt /> Filtrar por dia
            </label>
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            >
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          {loading && (
            <EmptyState
              title="Cargando horarios..."
              description="Estamos consultando la planificacion mas reciente del club."
              icon={<FaClock />}
            />
          )}

          {!loading && error && (
            <EmptyState
              title="Error al Cargar Horarios"
              description={error}
              icon={<FaExclamationTriangle />}
              action={<Button onClick={loadSchedules}>Reintentar</Button>}
            />
          )}

          {!loading && !error && filteredSchedules.length === 0 && (
            <EmptyState
              title="No hay horarios programados"
              description="Los horarios se actualizaran pronto. Revisa esta pagina regularmente."
              icon={<FaCalendarAlt />}
            />
          )}

          {!loading && !error && filteredSchedules.length > 0 && (
            <div className="space-y-8">
              {DAYS.filter((day) => day.value !== 'todos' && groupedSchedules[day.value]).map((day) => (
                <div key={day.value} className="space-y-3">
                  <h2 className="inline-flex items-center gap-2 text-2xl font-black text-white">
                    <FaCalendarAlt className="text-rv-gold" /> {day.label}
                  </h2>

                  <div className="grid gap-4 tablet:grid-cols-2">
                    {groupedSchedules[day.value].map((schedule) => {
                      const categoryInfo = CATEGORY_DATA[schedule.categoria] || {
                        label: schedule.categoria,
                        borderClass: 'border-l-slate-400',
                        badgeClass: 'bg-slate-500/20 text-slate-300',
                        description: ''
                      };

                      return (
                        <Card
                          key={schedule.id}
                          className={cn('h-full border-l-4', categoryInfo.borderClass)}
                          padding="lg"
                        >
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <StatusBadge className={cn('border-none text-[12px]', categoryInfo.badgeClass)}>
                              <FaUsers className="mr-1" /> {categoryInfo.label}
                            </StatusBadge>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                              <FaClock className="text-rv-gold" /> {formatTime(schedule.hora_inicio)} - {formatTime(schedule.hora_fin)}
                            </p>
                          </div>

                          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rv-gold/95">
                              <FaInfoCircle /> Descripcion
                            </p>
                            <p className="text-sm leading-relaxed text-slate-200">{schedule.descripcion || categoryInfo.description}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default Horarios;

