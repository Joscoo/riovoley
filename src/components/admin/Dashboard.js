// src/components/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBolt,
  FaChartBar,
  FaClipboardList,
  FaCreditCard,
  FaDollarSign,
  FaExclamationTriangle,
  FaRunning,
  FaUserPlus,
  FaUsers,
  FaUsersCog,
  FaVolleyballBall
} from 'react-icons/fa';
import { adminDashboardService } from '../../features/admin-dashboard';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Button from '../ui/Button';
import { cn } from '../../lib/cn';

const StatCard = React.memo(({ title, value, icon, borderClass, iconClass, subtitle, loading }) => (
  <Card className={cn('h-full border-l-4', borderClass)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">{title}</h3>
        <p className="mt-1 text-3xl font-black text-white">{loading ? '...' : value}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-300">{subtitle}</p> : null}
      </div>
      <div className={cn('text-3xl', iconClass)}>
        {icon}
      </div>
    </div>
  </Card>
));

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  borderClass: PropTypes.string.isRequired,
  iconClass: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  loading: PropTypes.bool
};

const Dashboard = ({ user, onNavigateToSection }) => {
  const [stats, setStats] = useState({
    totalAtletas: 0,
    ingresosDelMes: 0,
    pagosVencidos: 0,
    renovacionesPendientes: 0,
    asistenciasHoy: 0,
    atletasActivos: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [categoriesStats, setCategoriesStats] = useState({
    iniciacion_hombres: 0,
    iniciacion_mujeres: 0,
    perfeccionamiento_mujeres: 0,
    perfeccionamiento_hombres: 0,
    master_mujeres: 0,
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleDashboardRefresh = () => {
      loadDashboardData();
    };

    window.addEventListener('riovoley:dashboard-refresh', handleDashboardRefresh);
    return () => {
      window.removeEventListener('riovoley:dashboard-refresh', handleDashboardRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardData = await adminDashboardService.loadDashboard();
      setStats(dashboardData?.stats || {
        totalAtletas: 0,
        ingresosDelMes: 0,
        pagosVencidos: 0,
        renovacionesPendientes: 0,
        asistenciasHoy: 0,
        atletasActivos: 0,
        loading: false
      });
      setCategoriesStats(dashboardData?.categoriesStats || {
        iniciacion_hombres: 0,
        iniciacion_mujeres: 0,
        perfeccionamiento_mujeres: 0,
        perfeccionamiento_hombres: 0,
        master_mujeres: 0,
        loading: false
      });
      setRecentActivity(dashboardData?.recentActivity || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Dashboard - Resumen General"
        subtitle={`Vista general de RioVoley Club${user?.email ? ` - Sesion: ${user.email}` : ''}`}
        icon={<FaChartBar />}
      />

      <div className="mb-6 grid gap-4 mobile:grid-cols-2 desktop:grid-cols-3">
        <StatCard
          title="Total Atletas"
          value={stats.totalAtletas}
          icon={<FaUsers />}
          borderClass="border-l-green-400"
          iconClass="text-green-400"
          subtitle="Registrados en el sistema"
          loading={stats.loading}
        />

        <StatCard
          title="Ingresos del Mes"
          value={`$${stats.ingresosDelMes.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={<FaDollarSign />}
          borderClass="border-l-cyan-400"
          iconClass="text-cyan-400"
          subtitle="Pagos recibidos este mes"
          loading={stats.loading}
        />

        <StatCard
          title="Periodos Vencidos"
          value={stats.pagosVencidos}
          icon={<FaExclamationTriangle />}
          borderClass={stats.pagosVencidos > 0 ? 'border-l-red-400' : 'border-l-green-400'}
          iconClass={stats.pagosVencidos > 0 ? 'text-red-400' : 'text-green-400'}
          subtitle={stats.pagosVencidos > 0 ? 'Necesitan registrar nuevo pago' : 'Todos con periodo vigente'}
          loading={stats.loading}
        />

        <StatCard
          title="Proximos a Vencer"
          value={stats.renovacionesPendientes}
          icon={<FaCreditCard />}
          borderClass={stats.renovacionesPendientes > 0 ? 'border-l-orange-400' : 'border-l-green-400'}
          iconClass={stats.renovacionesPendientes > 0 ? 'text-orange-400' : 'text-green-400'}
          subtitle={stats.renovacionesPendientes > 0 ? 'Vencen en 5 dias o menos' : 'Sin vencimientos proximos'}
          loading={stats.loading}
        />

        <StatCard
          title="Atletas Activos"
          value={stats.atletasActivos}
          icon={<FaRunning />}
          borderClass="border-l-green-400"
          iconClass="text-green-400"
          subtitle={`${stats.atletasActivos} de ${stats.totalAtletas} con pagos activos`}
          loading={stats.loading}
        />
      </div>

      <div className="mb-6 grid gap-4 desktop:grid-cols-[1fr_360px]">
        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">
            <FaClipboardList className="mr-2 inline align-middle text-rv-gold" />
            <span className="align-middle">Actividad Reciente</span>
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
                  <span className="mt-0.5 text-lg">{activity.icono}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white">{activity.descripcion}</p>
                    <span className="text-xs text-slate-300">{activity.fecha}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm italic text-slate-300">No hay actividad reciente</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">
            <FaBolt className="mr-2 inline align-middle text-rv-gold" />
            <span className="align-middle">Acciones Rapidas</span>
          </h3>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigateToSection('usuarios')}>
              <FaUserPlus className="mr-2" /> Agregar Atleta
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigateToSection('pagos')}>
              <FaCreditCard className="mr-2" /> Registrar Pago
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigateToSection('usuarios')}>
              <FaUsersCog className="mr-2" /> Gestionar Usuarios
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigateToSection('reportes')}>
              <FaChartBar className="mr-2" /> Ver Reportes
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-bold text-white">
          <FaVolleyballBall className="mr-2 inline align-middle text-rv-gold" />
          <span className="align-middle">Resumen por Categorias</span>
        </h3>
        <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
          <div className="rounded-lg border border-rv-gold/30 bg-white/5 px-4 py-4 text-center">
            <h4 className="text-sm font-semibold text-white">Iniciacion Hombres</h4>
            <p className="mt-1 text-xl font-black text-rv-gold">
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.iniciacion_hombres} atletas`}
            </p>
          </div>
          <div className="rounded-lg border border-rv-gold/30 bg-white/5 px-4 py-4 text-center">
            <h4 className="text-sm font-semibold text-white">Iniciacion Mujeres</h4>
            <p className="mt-1 text-xl font-black text-rv-gold">
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.iniciacion_mujeres} atletas`}
            </p>
          </div>
          <div className="rounded-lg border border-rv-gold/30 bg-white/5 px-4 py-4 text-center">
            <h4 className="text-sm font-semibold text-white">Perfeccionamiento Mujeres</h4>
            <p className="mt-1 text-xl font-black text-rv-gold">
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.perfeccionamiento_mujeres} atletas`}
            </p>
          </div>
          <div className="rounded-lg border border-rv-gold/30 bg-white/5 px-4 py-4 text-center">
            <h4 className="text-sm font-semibold text-white">Perfeccionamiento Hombres</h4>
            <p className="mt-1 text-xl font-black text-rv-gold">
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.perfeccionamiento_hombres} atletas`}
            </p>
          </div>
          <div className="rounded-lg border border-rv-gold/30 bg-white/5 px-4 py-4 text-center">
            <h4 className="text-sm font-semibold text-white">Master Mujeres</h4>
            <p className="mt-1 text-xl font-black text-rv-gold">
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.master_mujeres} atletas`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

Dashboard.propTypes = {
  user: PropTypes.object,
  onNavigateToSection: PropTypes.func.isRequired
};

export default Dashboard;
