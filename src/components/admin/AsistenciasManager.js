// src/components/admin/AsistenciasManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/AsistenciasManager.module.css';
import { getEcuadorDate, getEcuadorDateMinusDays, formatDateString } from '../../utils/dateUtils';
import { exportAttendancePdf } from '../../utils/exportAttendancePdf';
import { 
  FaChartBar, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine, 
  FaCalendarAlt, 
  FaUsers, 
  FaVolleyballBall, 
  FaMars, 
  FaVenus, 
  FaTrophy, 
  FaMedal, 
  FaTrash, 
  FaTimes, 
  FaCheck,
  FaDollarSign,
  FaCalendarCheck,
  FaCreditCard,
  FaFileExport,
  FaPrint,
  FaSearch
} from 'react-icons/fa';

const AsistenciasManager = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getEcuadorDate());
  const [filters, setFilters] = useState({
    fecha_inicio: getEcuadorDateMinusDays(7),
    fecha_fin: getEcuadorDate(),
    categoria: '',
    atleta: ''
  });

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Nueva: categoría seleccionada en tabs
  const [paymentTypes, setPaymentTypes] = useState([]); // Métodos de pago disponibles
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportObservations, setExportObservations] = useState('');
  const [expandedDays, setExpandedDays] = useState([]); // Días expandidos en el historial
  const [asistenciasByDate, setAsistenciasByDate] = useState({}); // Asistencias agrupadas por fecha
  const [dateToExport, setDateToExport] = useState(null); // Fecha a exportar
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda de atletas

  const categorias = [
    'iniciacion_hombres',
    'iniciacion_mujeres', 
    'perfeccionamiento_mujeres',
    'perfeccionamiento_hombres',
    'master_mujeres'
  ];

  // Categorías agrupadas para los tabs
  const categoriasAgrupadas = [
    { id: 'all', nombre: 'Todas', icono: <FaUsers /> },
    { id: 'iniciacion', nombre: 'Iniciación', icono: <FaVolleyballBall /> },
    { id: 'perfeccionamiento', nombre: 'Perfeccionamiento', icono: <FaTrophy /> },
    { id: 'master', nombre: 'Master', icono: <FaMedal /> }
  ];

  const splitName = (value = '') => value.trim().split(/\s+/).filter(Boolean);

  const getAthleteNameParts = (athleteUser) => {
    const nombreOriginal = athleteUser?.nombre?.trim() || '';
    const apellidoOriginal = athleteUser?.apellido?.trim() || '';

    const nombreParts = splitName(nombreOriginal);
    const apellidoParts = splitName(apellidoOriginal);

    const primerNombre = nombreParts[0] || '';
    const primerApellido = apellidoParts[0] || '';
    const segundoApellido = apellidoParts.slice(1).join(' ');
    const nombreCompleto = `${nombreOriginal} ${apellidoOriginal}`.trim();

    return {
      nombreOriginal,
      apellidoOriginal,
      primerNombre,
      primerApellido,
      segundoApellido,
      nombreCompleto
    };
  };

  const getHomonymKey = (athleteUser) => {
    const { primerNombre, primerApellido } = getAthleteNameParts(athleteUser);
    if (!primerNombre && !primerApellido) return '';
    return `${primerNombre.toLowerCase()}|${primerApellido.toLowerCase()}`;
  };

  const getCompactDisplayName = (athleteUser, isHomonym = false) => {
    const {
      nombreOriginal,
      primerNombre,
      primerApellido,
      segundoApellido,
      nombreCompleto
    } = getAthleteNameParts(athleteUser);

    const nombreBase = `${primerNombre || nombreOriginal} ${primerApellido}`.trim();

    if (!nombreBase) {
      return nombreCompleto || 'Sin nombre';
    }

    if (isHomonym) {
      if (segundoApellido) {
        return `${nombreBase} ${segundoApellido}`.trim();
      }

      return nombreCompleto || nombreBase;
    }

    return nombreBase;
  };

  const getSearchNameBlob = (athleteUser) => {
    const { nombreOriginal, apellidoOriginal, primerNombre, primerApellido, segundoApellido, nombreCompleto } = getAthleteNameParts(athleteUser);

    return [
      `${nombreOriginal} ${apellidoOriginal}`.trim(),
      `${primerNombre || nombreOriginal} ${primerApellido}`.trim(),
      `${primerNombre || nombreOriginal} ${primerApellido} ${segundoApellido}`.trim(),
      nombreCompleto
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  };

  const getAthleteInitials = (athleteUser) => {
    const { primerNombre, primerApellido, nombreOriginal, apellidoOriginal } = getAthleteNameParts(athleteUser);
    const first = (primerNombre || nombreOriginal || 'A').charAt(0);
    const last = (primerApellido || apellidoOriginal || 'A').charAt(0);
    return `${first}${last}`.toUpperCase();
  };

  useEffect(() => {
    // Cargar datos iniciales al montar el componente
    loadData();
    loadPaymentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Recargar cuando cambien los filtros (excluyendo la carga inicial)
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    // Solo cargar asistencias del día si ya tenemos atletas cargados
    if (atletas.length > 0) {
      loadTodayAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, atletas]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar atletas solo si no están ya cargados
      if (atletas.length === 0) {
        const { data: atletasData, error: atletasError } = await supabase
          .from('students')
          .select(`
            id,
            categoria,
            users(id, nombre, apellido, email, role)
          `)
          .order('users(apellido)', { ascending: true });

        if (atletasError) throw atletasError;
        // Debug: Ver qué roles tienen los usuarios
        console.log('🔍 Roles encontrados:', (atletasData || []).map(a => ({ 
          nombre: a.users?.nombre, 
          role: a.users?.role 
        })));
        
        // Filtrar solo usuarios con role='estudiante' (atletas, no admins ni entrenadores)
        const atletasFiltrados = (atletasData || []).filter(a => a.users?.role === 'estudiante');
        console.log('📊 Total students:', atletasData?.length, '| Atletas (role=estudiante):', atletasFiltrados.length);
        setAtletas(atletasFiltrados);
      }

      // Cargar asistencias con filtros - Estrategia separada para evitar problemas de JOIN
      let query = supabase
        .from('attendances')
        .select('*')
        .order('fecha', { ascending: false });

      // Aplicar filtros de fecha
      if (filters.fecha_inicio && filters.fecha_fin) {
        query = query
          .gte('fecha', filters.fecha_inicio)
          .lte('fecha', filters.fecha_fin);
      }

      // Filtro por categoría
      if (filters.categoria) {
        const atletasCategoria = (atletas.length > 0 ? atletas : await loadAtletasForFilter())
          .filter(a => a.categoria === filters.categoria)
          .map(a => a.id);
        
        if (atletasCategoria.length > 0) {
          query = query.in('student_id', atletasCategoria);
        }
      }

      // Filtro por atleta específico
      if (filters.atleta) {
        query = query.eq('student_id', filters.atleta);
      }

      const { data: asistenciasRaw, error: asistenciasError } = await query;

      if (asistenciasError) throw asistenciasError;

      // Combinar asistencias con datos de estudiantes
      const currentAtletas = atletas.length > 0 ? atletas : await loadAtletasForFilter();
      const asistenciasWithDetails = await Promise.all(
        (asistenciasRaw || []).map(async (asistencia) => {
          const student = currentAtletas.find(a => a.id === asistencia.student_id);
          
          if (!student) {
            // Si no encontramos el estudiante en cache, cargarlo
            const { data: studentData } = await supabase
              .from('students')
              .select(`
                id,
                categoria,
                users!inner(id, nombre, apellido, email)
              `)
              .eq('id', asistencia.student_id)
              .single();
              
            return {
              ...asistencia,
              students: studentData
            };
          }

          return {
            ...asistencia,
            students: student
          };
        })
      );

      setAsistencias(asistenciasWithDetails);

      // Agrupar asistencias por fecha
      const grouped = {};
      asistenciasWithDetails.forEach(asistencia => {
        const fecha = asistencia.fecha;
        if (!grouped[fecha]) {
          grouped[fecha] = [];
        }
        grouped[fecha].push(asistencia);
      });
      setAsistenciasByDate(grouped);

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para cargar atletas cuando se necesitan para filtros
  const loadAtletasForFilter = async () => {
    const { data: atletasData, error: atletasError } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users(id, nombre, apellido, email, role)
      `)
      .order('users(apellido)', { ascending: true });

    if (atletasError) throw atletasError;
    // Filtrar solo usuarios con role='estudiante'
    const atletasResult = (atletasData || []).filter(a => a.users?.role === 'estudiante');
    
    if (atletas.length === 0) {
      setAtletas(atletasResult);
    }
    
    return atletasResult;
  };

  const loadTodayAttendance = async () => {
    try {
      // Cargar asistencias del día seleccionado
      const { data: rawAttendance, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('fecha', selectedDate)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Crear mapa de asistencias por atleta
      const attendanceMap = {};
      (rawAttendance || []).forEach(attendance => {
        attendanceMap[attendance.student_id] = attendance;
      });

      // Combinar con lista de atletas para mostrar todos
      const todayData = atletas.map(atleta => ({
        ...atleta,
        attendance: attendanceMap[atleta.id] || null
      }));

      setTodayAttendance(todayData);
    } catch (error) {
      console.error('Error cargando asistencias del día:', error);
    }
  };

  const loadPaymentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('id');

      if (error) throw error;
      setPaymentTypes(data || []);
      console.log('📋 Métodos de pago cargados:', data);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const registerAttendanceWithPayment = async (atletaId, paymentTypeId) => {
    try {
      // Verificar si ya existe asistencia para este día
      const { data: existing, error: findError } = await supabase
        .from('attendances')
        .select('id, metodo_pago_id')
        .eq('student_id', atletaId)
        .eq('fecha', selectedDate)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (findError) {
        console.error('Error buscando asistencia existente:', findError);
        throw findError;
      }

      if (existing) {
        // Si ya existe, actualizar el método de pago
        const { error } = await supabase
          .from('attendances')
          .update({ metodo_pago_id: paymentTypeId })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Si no existe, crear nuevo registro
        const { error } = await supabase
          .from('attendances')
          .insert({
            student_id: atletaId,
            fecha: selectedDate,
            metodo_pago_id: paymentTypeId
          });

        if (error) throw error;
      }

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const removeAttendance = async (atletaId) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('student_id', atletaId)
        .eq('fecha', selectedDate);

      if (error) throw error;

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const toggleAttendance = async (atletaId, isCurrentlyPresent) => {
    try {
      if (isCurrentlyPresent) {
        // Si está presente, eliminar el registro (marcar como ausente)
        const { error } = await supabase
          .from('attendances')
          .delete()
          .eq('student_id', atletaId)
          .eq('fecha', selectedDate);

        if (error) throw error;
      } else {
        // Si está ausente, crear registro (marcar como presente)
        const { error } = await supabase
          .from('attendances')
          .insert({
            student_id: atletaId,
            fecha: selectedDate
          });

        if (error) throw error;
      }

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const markAllPresent = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Marcar todos los atletas como presentes con MENSUALIDAD?')) {
      return;
    }

    try {
      // Buscar el ID de mensualidad
      const mensualidad = paymentTypes.find(pt => pt.nombre === 'mensualidad');
      
      if (!mensualidad) {
        alert('Error: No se encontró el método de pago "mensualidad"');
        return;
      }

      for (const atleta of todayAttendance) {
        const isCurrentlyPresent = atleta.attendance !== null;
        if (!isCurrentlyPresent) {
          // Registrar con mensualidad por defecto
          await registerAttendanceWithPayment(atleta.id, mensualidad.id);
        }
      }
      alert('Todos los atletas marcados como presentes con MENSUALIDAD');
    } catch (error) {
      console.error('Error marcando asistencias masivas:', error);
      alert('Error: ' + error.message);
    }
  };

  const clearAllAttendance = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Limpiar todas las asistencias del día?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('fecha', selectedDate);

      if (error) throw error;

      // Recargar solo las asistencias del día, mantener atletas
      loadTodayAttendance();
      alert('Asistencias del día limpiadas correctamente');
    } catch (error) {
      console.error('Error limpiando asistencias:', error);
      alert('Error: ' + error.message);
    }
  };

  const calculateStats = () => {
    // En la nueva lógica, solo tenemos registros de presentes
    const totalPresentes = asistencias.length; // Todos los registros son presencias
    const totalAtletas = atletas.length;
    
    // Calcular estadísticas de manera diferente según el modo
    let ausentes, porcentajeAsistencia;
    
    if (bulkMode) {
      // Modo día actual: calcular sobre atletas totales del día
      ausentes = totalAtletas > 0 ? totalAtletas - todayAttendance.filter(a => a.attendance !== null).length : 0;
      const presentesHoy = todayAttendance.filter(a => a.attendance !== null).length;
      porcentajeAsistencia = totalAtletas > 0 ? ((presentesHoy / totalAtletas) * 100).toFixed(1) : 0;
    } else {
      // Modo historial: calcular promedio por día del rango de fechas
      const diasUnicos = new Set(asistencias.map(a => a.fecha)).size;
      
      if (diasUnicos > 0 && totalAtletas > 0) {
        // Promedio de asistencia = asistencias totales / (días * atletas totales) * 100
        porcentajeAsistencia = ((totalPresentes / (diasUnicos * totalAtletas)) * 100).toFixed(1);
        // Ausentes promedio por día
        ausentes = Math.round(totalAtletas - (totalPresentes / diasUnicos));
      } else {
        porcentajeAsistencia = 0;
        ausentes = 0;
      }
    }

    // Estadísticas por categoría
    const categoriaStats = {};
    categorias.forEach(cat => {
      const atletasCategoria = atletas.filter(a => a.categoria === cat);
      const asistenciasCategoria = asistencias.filter(a => 
        a.students?.categoria === cat
      );
      const catTotal = atletasCategoria.length;
      const catPresentes = asistenciasCategoria.length;
      
      categoriaStats[cat] = {
        total: catTotal,
        presentes: catPresentes,
        porcentaje: catTotal > 0 ? ((catPresentes / catTotal) * 100).toFixed(1) : 0
      };
    });

    return { 
      total: bulkMode ? totalAtletas : totalPresentes, // En bulk muestra total atletas, en histórico total asistencias
      presentes: bulkMode ? todayAttendance.filter(a => a.attendance !== null).length : totalPresentes, 
      ausentes, 
      porcentajeAsistencia, 
      categoriaStats 
    };
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return '--';
    return categoria.replaceAll('_', ' ').toUpperCase();
  };

  // Filtrar atletas según categoría seleccionada en tabs y término de búsqueda
  const filteredAtletas = (() => {
    let filtered = todayAttendance;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(atleta => 
        atleta.categoria?.includes(selectedCategory)
      );
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(atleta => {
        const searchableNames = getSearchNameBlob(atleta.users);
        return searchableNames.includes(searchLower);
      });
    }

    return filtered;
  })();

  // Filtrar atletas por categoría específica y término de búsqueda
  const filterAtletasBySearchAndCategory = (categoria) => {
    let filtered = todayAttendance.filter(atleta => atleta.categoria === categoria);
    
    // Aplicar filtro de búsqueda si existe
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(atleta => {
        const searchableNames = getSearchNameBlob(atleta.users);
        return searchableNames.includes(searchLower);
      });
    }
    
    return filtered;
  };

  // Obtener estadísticas de la categoría seleccionada
  const getCategoryStats = () => {
    const presentes = filteredAtletas.filter(a => a.attendance !== null).length;
    const total = filteredAtletas.length;
    const ausentes = total - presentes;
    const porcentaje = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0;

    return { total, presentes, ausentes, porcentaje };
  };

  const homonymsByCompactName = (() => {
    const counts = {};

    filteredAtletas.forEach((atleta) => {
      const key = getHomonymKey(atleta.users);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  })();

  // Renderizar atleta con botones de métodos de pago
  const renderAtletaWithPaymentMethods = (atleta) => {
    const isPresent = atleta.attendance !== null;
    const currentPaymentMethod = atleta.attendance?.metodo_pago_id;
    const homonymCount = homonymsByCompactName[getHomonymKey(atleta.users)] || 0;
    const displayName = getCompactDisplayName(atleta.users, homonymCount > 1);
    const fullName = getAthleteNameParts(atleta.users).nombreCompleto || displayName;
    
    // Obtener nombres de métodos de pago
    const getPaymentMethodInfo = (ptId) => {
      const pt = paymentTypes.find(p => p.id === ptId);
      if (!pt) return { nombre: '', icono: null };
      
      // Iconos según método de pago usando react-icons
      const iconos = {
        'pago_diario': <FaDollarSign />,
        'mensualidad': <FaCalendarCheck />,
        'tarjeta': <FaCreditCard />
      };
      
      return {
        nombre: pt.nombre,
        icono: iconos[pt.nombre] || <FaDollarSign />
      };
    };

    return (
      <div key={atleta.id} className={styles.atletaItemNew}>
        <div className={styles.atletaNameSection}>
          <div className={styles.atletaIdentity}>
            <span className={styles.atletaInitials} aria-hidden="true">
              {getAthleteInitials(atleta.users)}
            </span>
            <span className={styles.atletaName} title={fullName}>
              {displayName}
            </span>
          </div>
          {isPresent && currentPaymentMethod && (
            <span className={styles.currentPaymentBadge}>
              {getPaymentMethodInfo(currentPaymentMethod).icono}
            </span>
          )}
        </div>
        
        <div className={styles.paymentButtons}>
          {paymentTypes.map(pt => {
            const isSelected = currentPaymentMethod === pt.id;
            const info = getPaymentMethodInfo(pt.id);
            
            return (
              <button
                key={pt.id}
                onClick={() => registerAttendanceWithPayment(atleta.id, pt.id)}
                className={`${styles.paymentMethodBtn} ${
                  isSelected ? styles.paymentMethodActive : ''
                }`}
                aria-label={`Marcar asistencia con ${pt.nombre.replaceAll('_', ' ')}`}
                title={pt.descripcion}
              >
                {info.icono}
              </button>
            );
          })}
          
          {isPresent && (
            <button
              onClick={() => removeAttendance(atleta.id)}
              className={styles.removeAttendanceBtn}
              aria-label="Eliminar asistencia"
              title="Eliminar asistencia"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
    );
  };

  const exportAttendance = (fecha = null) => {
    const isValidDateString = typeof fecha === 'string' && fecha.includes('-');
    setDateToExport(isValidDateString ? fecha : selectedDate);
    setShowExportModal(true);
  };

  const toggleDayExpansion = (fecha) => {
    setExpandedDays(prev => 
      prev.includes(fecha) 
        ? prev.filter(d => d !== fecha)
        : [...prev, fecha]
    );
  };

  const getExportAttendanceData = (exportFecha) => {
    if (asistenciasByDate[exportFecha]) {
      return asistenciasByDate[exportFecha].map(asistencia => ({
        ...asistencia.students,
        attendance: {
          metodo_pago_id: asistencia.metodo_pago_id
        }
      }));
    }

    return todayAttendance.filter(a => a.attendance !== null);
  };

  const getExportPaymentMethodName = (metodoPagoId) => {
    const pt = paymentTypes.find(p => p.id === metodoPagoId);
    if (!pt) return 'N/A';
    switch (pt.nombre) {
      case 'pago_diario': return 'Pago Diario';
      case 'mensualidad': return 'Mensualidad';
      case 'tarjeta': return 'Tarjeta';
      default: return pt.nombre;
    }
  };

  const getExportSummary = () => {
    const exportFecha = dateToExport || selectedDate;
    const attendancesData = getExportAttendanceData(exportFecha);

    return {
      exportFecha,
      formattedDate: formatDateString(exportFecha),
      totalAttendances: attendancesData.length,
      attendancesData
    };
  };

  const generateExportDocument = () => {
    try {
      const { exportFecha, formattedDate, attendancesData } = getExportSummary();

      if (!exportFecha) {
        alert('Selecciona una fecha valida para exportar.');
        return;
      }

      if (attendancesData.length === 0) {
        alert('No hay asistencias registradas para exportar en la fecha seleccionada.');
        return;
      }

      exportAttendancePdf({
        exportDate: exportFecha,
        formattedDate,
        attendancesData,
        observations: exportObservations,
        getPaymentMethodName: getExportPaymentMethodName
      });

      setShowExportModal(false);
      setExportObservations('');
      setDateToExport(null);
      alert('Reporte PDF generado correctamente.');
    } catch (error) {
      console.error('Error generando PDF de asistencias:', error);
      alert(`No se pudo generar el PDF: ${error.message}`);
    }
  };

  const stats = calculateStats();
  const exportSummary = getExportSummary();

  return (
    <div className={styles.asistenciasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaCalendarAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Control de Asistencias</h2>
          <p>Registro y seguimiento de entrenamientos</p>
        </div>
        <div className={styles.headerActions}>
          {bulkMode && (
            <button 
              className={styles.exportButton}
              onClick={() => exportAttendance()}
              title="Exportar asistencias del día"
            >
              <FaFileExport style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Exportar
            </button>
          )}
          <button 
            className={styles.bulkButton}
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? (
              <><FaChartBar style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Ver Reportes</>
            ) : (
              <><FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Registro Rápido</>
            )}
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartBar /></div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Registros</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheckCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.presentes}</h3>
            <p>Presentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaTimesCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.ausentes}</h3>
            <p>Ausentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartLine /></div>
          <div className={styles.statInfo}>
            <h3>{stats.porcentajeAsistencia}%</h3>
            <p>Asistencia Promedio</p>
          </div>
        </div>
      </div>

      {bulkMode ? (
        /* Modo de Registro por Categorías */
        <div className={styles.categoryAttendance}>
          <div className={styles.bulkHeader}>
            <div className={styles.dateSelector}>
              <label htmlFor="attendance-date">Fecha de Entrenamiento:</label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar atleta por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={styles.clearSearch}
                  title="Limpiar búsqueda"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className={styles.bulkActions}>
              <button onClick={markAllPresent} className={styles.allPresentButton}>
                <FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Todos Presentes
              </button>
              <button onClick={clearAllAttendance} className={styles.clearButton}>
                <FaTrash style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Limpiar Día
              </button>
            </div>
          </div>

          {/* Registro por Categorías */}
          <div className={styles.categorySections}>
            {/* Tabs de Categorías */}
            <div className={styles.categoryTabs}>
              {categoriasAgrupadas.map(cat => {
                const categoryStats = getCategoryStats();
                const isActive = selectedCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`${styles.tabButton} ${isActive ? styles.tabActive : ''}`}
                  >
                    <span className={styles.tabIcon}>{cat.icono}</span>
                    <span className={styles.tabName}>{cat.nombre}</span>
                    {isActive && (
                      <span className={styles.tabCount}>
                        {categoryStats.presentes}/{categoryStats.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Estadísticas de la categoría seleccionada */}
            <div className={styles.categoryStatsBar}>
              {(() => {
                const catStats = getCategoryStats();
                return (
                  <>
                    <div className={styles.miniStat}>
                      <FaUsers className={styles.miniIcon} />
                      <span>Total: {catStats.total}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaCheckCircle className={styles.miniIcon} style={{ color: '#28a745' }} />
                      <span>Presentes: {catStats.presentes}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaTimesCircle className={styles.miniIcon} style={{ color: '#dc3545' }} />
                      <span>Ausentes: {catStats.ausentes}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaChartLine className={styles.miniIcon} />
                      <span>Asistencia: {catStats.porcentaje}%</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Contenido de la categoría seleccionada */}
            <div className={styles.categoryContent}>
              {selectedCategory === 'all' ? (
                /* Vista de todas las categorías */
                <div className={styles.allCategoriesView}>
                  {/* Iniciación */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaVolleyballBall style={{ marginRight: '8px' }} /> Iniciación
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Perfeccionamiento */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaTrophy style={{ marginRight: '8px' }} /> Perfeccionamiento
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Master */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaMedal style={{ marginRight: '8px' }} /> Master
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('master_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName} title={getAthleteNameParts(atleta.users).nombreCompleto}>
                                    {getCompactDisplayName(
                                      atleta.users,
                                      (homonymsByCompactName[getHomonymKey(atleta.users)] || 0) > 1
                                    )}
                                  </span>
                                  <button
                                    onClick={() => toggleAttendance(atleta.id, isPresent)}
                                    className={`${styles.attendanceToggle} ${
                                      isPresent ? styles.present : styles.absent
                                    }`}
                                  >
                                    {isPresent ? <FaCheck /> : <FaTimes />}
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Vista filtrada por categoría específica */
                <div className={styles.filteredCategoryView}>
                  {selectedCategory === 'iniciacion' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'perfeccionamiento' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'master' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('master_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Modo de Reportes */
        <div className={styles.reportsMode}>
          {/* Filtros */}
          <div className={styles.filtersSection}>
            <div className={styles.filterGroup}>
              <label htmlFor="fecha-inicio">Desde:</label>
              <input
                id="fecha-inicio"
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="fecha-fin">Hasta:</label>
              <input
                id="fecha-fin"
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="categoria-filter">Categoría:</label>
              <select
                id="categoria-filter"
                value={filters.categoria}
                onChange={(e) => setFilters({...filters, categoria: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {formatCategoria(categoria)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="atleta-filter">Atleta:</label>
              <select
                id="atleta-filter"
                value={filters.atleta}
                onChange={(e) => setFilters({...filters, atleta: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Todos los atletas</option>
                {atletas.map(atleta => (
                  <option key={atleta.id} value={atleta.id}>
                    {atleta.users?.nombre} {atleta.users?.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas por Categoría */}
          <div className={styles.categoryStats}>
            <h3><FaChartBar style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Estadísticas por Categoría</h3>
            <div className={styles.categoryGrid}>
              {categorias.map(categoria => {
                const catStats = stats.categoriaStats[categoria];
                return (
                  <div key={categoria} className={styles.categoryCard}>
                    <h4>{formatCategoria(categoria)}</h4>
                    <div className={styles.categoryNumbers}>
                      <span>Presentes: {catStats.presentes}</span>
                      <span>Total: {catStats.total}</span>
                      <span className={styles.percentage}>{catStats.porcentaje}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de Asistencias Agrupadas por Día */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando asistencias...</p>
            </div>
          ) : (
            <div className={styles.attendanceTable}>
              <h3>📋 Historial de Asistencias por Día</h3>
              
              {Object.keys(asistenciasByDate).length > 0 ? (
                <div className={styles.daysContainer}>
                  {Object.keys(asistenciasByDate)
                    .sort((a, b) => new Date(b) - new Date(a)) // Ordenar por fecha descendente
                    .map(fecha => {
                      const dayAttendances = asistenciasByDate[fecha];
                      const isExpanded = expandedDays.includes(fecha);
                      const fechaFormateada = formatDateString(fecha);

                      // Agrupar por categorías para este día
                      const iniciacion = dayAttendances.filter(a =>
                        a.students?.categoria === 'iniciacion_hombres' || 
                        a.students?.categoria === 'iniciacion_mujeres'
                      );
                      const iniciacionHombres = iniciacion.filter(a => a.students?.categoria === 'iniciacion_hombres');
                      const iniciacionMujeres = iniciacion.filter(a => a.students?.categoria === 'iniciacion_mujeres');
                      
                      const perfHombres = dayAttendances.filter(a =>
                        a.students?.categoria === 'perfeccionamiento_hombres'
                      );
                      const perfMujeres = dayAttendances.filter(a =>
                        a.students?.categoria === 'perfeccionamiento_mujeres' || 
                        a.students?.categoria === 'master_mujeres'
                      );

                      const getPaymentMethodName = (metodoPagoId) => {
                        const pt = paymentTypes.find(p => p.id === metodoPagoId);
                        if (!pt) return 'N/A';
                        switch(pt.nombre) {
                          case 'pago_diario': return <><FaDollarSign /> Pago Diario</>;
                          case 'mensualidad': return <><FaCalendarCheck /> Mensualidad</>;
                          case 'tarjeta': return <><FaCreditCard /> Tarjeta</>;
                          default: return pt.nombre;
                        }
                      };

                      return (
                        <div key={fecha} className={styles.dayCard}>
                          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                          <div 
                            className={styles.dayHeader}
                            onClick={() => toggleDayExpansion(fecha)}
                          >
                            <div className={styles.dayInfo}>
                              <h4>
                                <FaCalendarAlt style={{ marginRight: '8px' }} />
                                {fechaFormateada}
                              </h4>
                              <span className={styles.dayCount}>
                                {dayAttendances.length} asistencias
                              </span>
                            </div>
                            <div className={styles.dayActions}>
                              <button
                                className={styles.exportDayButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportAttendance(fecha);
                                }}
                                title="Exportar este día"
                              >
                                <FaFileExport style={{ marginRight: '6px' }} />
                                Exportar
                              </button>
                              <span className={styles.expandIcon}>
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className={styles.dayContent}>
                              {/* Tabla 1: Iniciación */}
                              {iniciacion.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaVolleyballBall style={{ marginRight: '8px' }} />
                                    Iniciación
                                  </h5>
                                  <div className={styles.categoryTables}>
                                    {/* Hombres */}
                                    {iniciacionHombres.length > 0 && (
                                      <div className={styles.subCategoryTable}>
                                        <h6><FaMars style={{ marginRight: '6px' }} /> Hombres</h6>
                                        <table className={styles.compactTable}>
                                          <thead>
                                            <tr>
                                              <th>#</th>
                                              <th>Atleta</th>
                                              <th>Método de Pago</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {iniciacionHombres
                                              .map((asistencia, index) => (
                                                <tr key={asistencia.id}>
                                                  <td data-label="#">{index + 1}</td>
                                                  <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                                  <td className={styles.paymentCell} data-label="Método de Pago">
                                                    {getPaymentMethodName(asistencia.metodo_pago_id)}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                        <div className={styles.subtotal}>
                                          Total: {iniciacionHombres.length}
                                        </div>
                                      </div>
                                    )}

                                    {/* Mujeres */}
                                    {iniciacionMujeres.length > 0 && (
                                      <div className={styles.subCategoryTable}>
                                        <h6><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h6>
                                        <table className={styles.compactTable}>
                                          <thead>
                                            <tr>
                                              <th>#</th>
                                              <th>Atleta</th>
                                              <th>Método de Pago</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {iniciacionMujeres
                                              .map((asistencia, index) => (
                                                <tr key={asistencia.id}>
                                                  <td data-label="#">{index + 1}</td>
                                                  <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                                  <td className={styles.paymentCell} data-label="Método de Pago">
                                                    {getPaymentMethodName(asistencia.metodo_pago_id)}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                        <div className={styles.subtotal}>
                                          Total: {iniciacionMujeres.length}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className={styles.categoryTotal}>
                                    Total Iniciación: {iniciacion.length}
                                  </div>
                                </div>
                              )}

                              {/* Tabla 2: Perfeccionamiento Hombres */}
                              {perfHombres.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaTrophy style={{ marginRight: '8px' }} />
                                    Perfeccionamiento - Hombres
                                  </h5>
                                  <table className={styles.compactTable}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Atleta</th>
                                        <th>Método de Pago</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {perfHombres.map((asistencia, index) => (
                                        <tr key={asistencia.id}>
                                          <td data-label="#">{index + 1}</td>
                                          <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                          <td className={styles.paymentCell} data-label="Método de Pago">
                                            {getPaymentMethodName(asistencia.metodo_pago_id)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className={styles.categoryTotal}>
                                    Total: {perfHombres.length}
                                  </div>
                                </div>
                              )}

                              {/* Tabla 3: Perfeccionamiento Mujeres */}
                              {perfMujeres.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaMedal style={{ marginRight: '8px' }} />
                                    Perfeccionamiento - Mujeres
                                  </h5>
                                  <table className={styles.compactTable}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Atleta</th>
                                        <th>Categoría</th>
                                        <th>Método de Pago</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {perfMujeres.map((asistencia, index) => (
                                        <tr key={asistencia.id}>
                                          <td data-label="#">{index + 1}</td>
                                          <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                          <td data-label="Categoría">{asistencia.students?.categoria === 'master_mujeres' ? 'Master' : 'Perfeccionamiento'}</td>
                                          <td className={styles.paymentCell} data-label="Método de Pago">
                                            {getPaymentMethodName(asistencia.metodo_pago_id)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className={styles.categoryTotal}>
                                    Total: {perfMujeres.length}
                                  </div>
                                </div>
                              )}

                              {/* Resumen del día */}
                              <div className={styles.dayResumen}>
                                <strong>Total del día: {dayAttendances.length} asistencias</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={styles.noData}>
                  <h3><FaCalendarAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay registros de asistencia</h3>
                  <p>Selecciona un rango de fechas o ajusta los filtros</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowExportModal(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3><FaPrint style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Exportar Asistencias</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowExportModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.exportInfo}>
                <p><strong>Fecha:</strong> {exportSummary.formattedDate}</p>
                <p><strong>Total asistencias:</strong> {exportSummary.totalAttendances}</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="observations">
                  📝 Observaciones (opcional)
                </label>
                <textarea
                  id="observations"
                  className={styles.observationsTextarea}
                  placeholder="Escribe aquí cualquier observación que desees incluir en el documento exportado..."
                  rows={5}
                  value={exportObservations}
                  onChange={(e) => setExportObservations(e.target.value)}
                />
              </div>

              <div className={styles.exportPreview}>
                <h4>📋 El documento incluirá:</h4>
                <ul>
                  <li>✅ Tabla 1: Iniciación (Hombres y Mujeres)</li>
                  <li>✅ Tabla 2: Perfeccionamiento Hombres</li>
                  <li>✅ Tabla 3: Perfeccionamiento Mujeres</li>
                  <li>✅ Resumen general de asistencias</li>
                  {exportObservations && <li>✅ Observaciones</li>}
                </ul>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowExportModal(false);
                  setExportObservations('');
                  setDateToExport(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmButton}
                onClick={generateExportDocument}
              >
                <FaFileExport style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AsistenciasManager.propTypes = {
  user: PropTypes.object
};

export default AsistenciasManager;