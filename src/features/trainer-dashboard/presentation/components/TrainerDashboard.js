// src/features/trainer-dashboard/presentation/components/TrainerDashboard.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBolt,
  FaCalendar,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaDollarSign,
  FaDumbbell,
  FaMoneyBillWave,
  FaPlus,
  FaVolleyballBall
} from 'react-icons/fa';
import { trainerDashboardService } from '../../trainerDashboardService';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';

const TrainerDashboard = ({ user, onNavigateToSection }) => {
  const [stats, setStats] = useState({
    totalAtletas: 0,
    asistenciasHoy: 0,
    testsPendientes: 0,
    pagosDelMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const dashboardStats = await trainerDashboardService.loadStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error cargando estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
          <p className="text-sm">Cargando dashboard...</p>
        </div>
      </Card>
    );
  }

  const statCards = [
    {
      id: 'usuarios',
      title: 'Atletas Registrados',
      value: stats.totalAtletas,
      icon: <FaVolleyballBall />,
      color: 'text-rv-gold',
      bg: 'bg-rv-gold/15'
    },
    {
      id: 'asistencias',
      title: 'Asistencias Hoy',
      value: stats.asistenciasHoy,
      icon: <FaCalendar />,
      color: 'text-cyan-300',
      bg: 'bg-cyan-500/15'
    },
    {
      id: 'tests-fisicos',
      title: 'Tests (30 dias)',
      value: stats.testsPendientes,
      icon: <FaDumbbell />,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/15'
    },
    {
      id: 'pagos',
      title: 'Pagos del Mes',
      value: stats.pagosDelMes,
      icon: <FaDollarSign />,
      color: 'text-amber-300',
      bg: 'bg-amber-500/15'
    }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Dashboard del Entrenador"
        subtitle={`Resumen de tus actividades y atletas${user?.email ? ` - Sesión: ${user.email}` : ''}`}
        icon={<FaChartBar />}
      />

      <Card className="mb-6">
        <h3 className="mb-4 text-lg font-bold text-white">
          <FaBolt className="mr-2 inline align-middle text-rv-gold" />
          <span className="align-middle">Acciones Rapidas</span>
        </h3>
        <div className="grid gap-3 mobile:grid-cols-2">
          <Button variant="secondary" className="justify-start" onClick={() => onNavigateToSection('usuarios')}>
            <FaPlus className="mr-2" /> Registrar Atleta
          </Button>

          <Button variant="secondary" className="justify-start" onClick={() => onNavigateToSection('asistencias')}>
            <FaCheckCircle className="mr-2" /> Tomar Asistencia
          </Button>

          <Button variant="secondary" className="justify-start" onClick={() => onNavigateToSection('tests-fisicos')}>
            <FaClipboardList className="mr-2" /> Registrar Test
          </Button>

          <Button variant="secondary" className="justify-start" onClick={() => onNavigateToSection('pagos')}>
            <FaMoneyBillWave className="mr-2" /> Registrar Pago
          </Button>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 mobile:grid-cols-2">
        {statCards.map((stat) => (
          <Card
            key={stat.id}
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
            role="button"
            tabIndex={0}
            onClick={() => onNavigateToSection(stat.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onNavigateToSection(stat.id);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">{stat.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

TrainerDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  onNavigateToSection: PropTypes.func.isRequired
};

export default TrainerDashboard;



