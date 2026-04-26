// src/components/admin/PagosManager.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { EmailService } from '../../services/emailService';
import WhatsAppService from '../../services/whatsappService';
import WhatsAppBusinessService from '../../services/whatsappBusinessService';
import PagoStatusService from '../../services/pagoStatusService';
import { getEcuadorDate, getEcuadorISOString } from '../../utils/dateUtils';
import { getLatestPaymentsList } from '../../utils/paymentUtils';
import styles from '../../styles/PagosManager.module.css';
import { 
  FaChartBar, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaExclamationTriangle, 
  FaDollarSign, 
  FaEdit, 
  FaPlus, 
  FaMoneyBillWave, 
  FaSync, 
  FaTrash, 
  FaTimes, 
  FaUsers, 
  FaCreditCard
} from 'react-icons/fa';

const PagosManager = ({ user }) => {
  const modalTitleId = 'payment-modal-title';
  const firstPaymentFieldRef = useRef(null);
  const [pagos, setPagos] = useState([]);
  const [allPagos, setAllPagos] = useState([]); // Almacenar todos los pagos sin filtrar
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [whatsAppBusiness] = useState(new WhatsAppBusinessService());
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    atleta: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc'
  });

  // Estados para búsqueda de atleta en formulario
  const [atletaBusqueda, setAtletaBusqueda] = useState('');
  const [atletasFiltrados, setAtletasFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    student_id: '',
    fecha_inicio: getEcuadorDate(),
    fecha_fin: '',
    monto: '',
    fecha_pago: '', // Vacío por defecto - solo se llena cuando realmente se paga
    observaciones: ''
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros localmente cuando cambien los filters
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allPagos]);

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    globalThis.setTimeout(() => {
      firstPaymentFieldRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const getTodayDateString = () => getEcuadorDate();

  const parseDateOnly = (value) => {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  };

  const validatePaymentForm = () => {
    const errors = {};
    const monto = Number.parseFloat(formData.monto);
    const startDate = parseDateOnly(formData.fecha_inicio);
    const endDate = parseDateOnly(formData.fecha_fin);
    const paidDate = parseDateOnly(formData.fecha_pago);
    const todayDate = parseDateOnly(getTodayDateString());

    if (!formData.student_id) {
      errors.student_id = 'Selecciona un atleta de la lista para continuar.';
    }

    if (!formData.fecha_inicio || !startDate) {
      errors.fecha_inicio = 'La fecha de inicio es obligatoria.';
    }

    if (formData.fecha_fin && !endDate) {
      errors.fecha_fin = 'La fecha fin no es valida.';
    }

    if (startDate && endDate && endDate < startDate) {
      errors.fecha_fin = 'La fecha fin no puede ser anterior a la fecha de inicio.';
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      errors.monto = 'Ingresa un monto mayor a 0.';
    }

    if (formData.fecha_pago && !paidDate) {
      errors.fecha_pago = 'La fecha de pago no es valida.';
    }

    if (paidDate && todayDate && paidDate > todayDate) {
      errors.fecha_pago = 'La fecha de pago no puede estar en el futuro.';
    }

    if (formData.observaciones && formData.observaciones.length > 300) {
      errors.observaciones = 'Las observaciones no deben superar 300 caracteres.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const paymentStatusPreview = useMemo(() => {
    const pagoTemporal = {
      monto: Number.parseFloat(formData.monto || '0'),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      fecha_pago: formData.fecha_pago || null
    };

    return PagoStatusService.getStatusInfo(pagoTemporal);
  }, [formData.monto, formData.fecha_inicio, formData.fecha_fin, formData.fecha_pago]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar atletas para el selector
      const { data: atletasData, error: atletasError } = await supabase
        .from('students')
        .select(`
          id,
          categoria,
          users(id, nombre, apellido, email)
        `)
        .order('users(apellido)', { ascending: true });

      if (atletasError) throw atletasError;
      setAtletas(atletasData || []);

      // Cargar TODOS los pagos sin filtros (solo los no eliminados)
      const { data: pagosData, error: pagosError } = await supabase
        .from('payments')
        .select(`
          *,
          student:students(
            id,
            categoria,
            user:users(id, nombre, apellido, email, telefono)
          )
        `)
        .is('deleted_at', null)
        .order('fecha_inicio', { ascending: false });

      if (pagosError) throw pagosError;

      // Actualizar estados automáticamente en segundo plano
      console.log('🔄 Verificando y actualizando estados de pagos...');
      const resultadoActualizacion = await PagoStatusService.actualizarTodosLosEstados(supabase);
      if (resultadoActualizacion.actualizados > 0) {
        console.log(`✅ ${resultadoActualizacion.actualizados} pagos actualizados automáticamente`);
        // Recargar todos los pagos si hubo cambios
        const { data: pagosActualizados } = await supabase
          .from('payments')
          .select(`
            *,
            student:students(
              id,
              categoria,
              user:users(id, nombre, apellido, email, telefono)
            )
          `)
          .is('deleted_at', null)
          .order('fecha_inicio', { ascending: false });
        
        if (pagosActualizados) {
          setAllPagos(pagosActualizados);
          // Mostrar todos los pagos inicialmente
          setPagos(pagosActualizados);
        } else {
          setAllPagos(pagosData || []);
          // Mostrar todos los pagos inicialmente
          setPagos(pagosData || []);
        }
      } else {
        setAllPagos(pagosData || []);
        // Mostrar todos los pagos inicialmente
        setPagos(pagosData || []);
      }

      // Los filtros se aplicarán automáticamente por el useEffect de filters
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar filtros localmente
  const applyFilters = () => {
    const normalizeText = (value = '') => value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const getSortableValue = (pago) => {
      switch (filters.sortBy) {
        case 'nombre':
          return normalizeText(pago.student?.user?.nombre || '');
        case 'estado':
          return normalizeText(PagoStatusService.getStatusInfo(pago).estado || '');
        case 'monto':
          return Number(pago.monto || 0);
        case 'fecha_inicio':
          return new Date(pago.fecha_inicio || '1900-01-01').getTime();
        case 'apellido':
        default:
          return normalizeText(pago.student?.user?.apellido || '');
      }
    };

    // Mostrar solo el pago mas reciente por atleta para evitar vencidos historicos en la vista principal.
    let filteredData = getLatestPaymentsList(allPagos);

    // Filtrar por fecha de inicio
    if (filters.fecha_inicio) {
      filteredData = filteredData.filter(pago => {
        if (!pago.fecha_inicio) return false;
        return pago.fecha_inicio >= filters.fecha_inicio;
      });
    }

    // Filtrar por fecha fin
    if (filters.fecha_fin) {
      filteredData = filteredData.filter(pago => {
        if (!pago.fecha_fin) return true; // Si no tiene fecha fin, incluirlo
        return pago.fecha_fin <= filters.fecha_fin;
      });
    }

    // Filtrar por estado
    if (filters.estado) {
      filteredData = filteredData.filter(
        pago => PagoStatusService.getStatusInfo(pago).estado === filters.estado
      );
    }

    // Filtrar por atleta
    if (filters.atleta) {
      filteredData = filteredData.filter(pago => pago.student_id?.toString() === filters.atleta);
    }

    // Filtrar por búsqueda de texto
    if (filters.search) {
      const searchLower = normalizeText(filters.search);
      filteredData = filteredData.filter(pago => 
        normalizeText(pago.student?.user?.nombre).includes(searchLower) ||
        normalizeText(pago.student?.user?.apellido).includes(searchLower) ||
        normalizeText(pago.student?.user?.email).includes(searchLower)
      );
    }

    filteredData.sort((a, b) => {
      const valueA = getSortableValue(a);
      const valueB = getSortableValue(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return filters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (valueA < valueB) {
        return filters.sortOrder === 'asc' ? -1 : 1;
      }

      if (valueA > valueB) {
        return filters.sortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });

    setPagos(filteredData);
  };

  const resetFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      estado: '',
      atleta: '',
      search: '',
      sortBy: 'apellido',
      sortOrder: 'asc'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }
    
    try {
      if (editingPago) {
        await updatePago();
        alert('Pago actualizado exitosamente');
      } else {
        const result = await createPago();
        
        let mensaje = 'Pago registrado exitosamente.';
        
        if (result?.emailSent) {
          mensaje += '\nEmail de confirmación enviado.';
        } else if (result?.emailError) {
          mensaje += `\nEmail no enviado: ${result.emailError}`;
        }
        
        if (result?.whatsappSent && result?.messageId) {
          mensaje += '\nWhatsApp Business enviado automáticamente.';
        } else if (result?.whatsappError) {
          mensaje += `\nWhatsApp Business error: ${result.whatsappError}`;
        } else if (result?.whatsappSent) {
          mensaje += '\nWhatsApp enviado.';
        }
        
        alert(mensaje);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const createPago = async () => {
    // Crear objeto temporal para calcular estado
    const pagoTemporal = {
      student_id: formData.student_id,
      monto: Number.parseFloat(formData.monto),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      fecha_pago: formData.fecha_pago || null
    };
    
    // Calcular estado automáticamente
    const estadoCalculado = PagoStatusService.calcularEstado(pagoTemporal);
    
    // Crear el pago en la base de datos
    const { data: pagoCreado, error } = await supabase
      .from('payments')
      .insert({
        ...pagoTemporal,
        estado: estadoCalculado
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Pago creado exitosamente:', pagoCreado);

    // Obtener información del atleta directamente de Supabase
    try {
      console.log('[DEBUG] Obteniendo información del atleta con ID:', formData.student_id);
      
      const { data: atletaData, error: atletaError } = await supabase
        .from('students')
        .select(`
          id,
          categoria,
          users!inner(
            id,
            email,
            nombre,
            apellido,
            telefono
          )
        `)
        .eq('id', formData.student_id)
        .single();

      if (atletaError) {
        console.error('❌ Error obteniendo datos del atleta:', atletaError);
        return { emailSent: false, emailError: 'No se pudo obtener información del atleta' };
      }

      if (!atletaData?.users?.email) {
        console.warn('⚠️ No se encontró email para el atleta');
        return { emailSent: false, emailError: 'El atleta no tiene email configurado' };
      }

      console.log('👤 Datos del atleta encontrados:', {
        email: atletaData.users.email,
        nombre: atletaData.users.nombre,
        apellido: atletaData.users.apellido
      });

      // Enviar email de confirmación de pago
      console.log('📧 Enviando notificación de pago a:', atletaData.users.email);
      
      const emailResult = await EmailService.sendPaymentConfirmation({
        email: atletaData.users.email,
        nombre: atletaData.users.nombre,
        apellido: atletaData.users.apellido,
        monto: Number.parseFloat(formData.monto),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        fecha_pago: formData.fecha_pago,
        estado: pagoCreado.estado
      });
      
      if (emailResult.success) {
        console.log('✅ Email de confirmación enviado exitosamente');
        
        // Verificar si el atleta tiene teléfono para WhatsApp Business
        if (atletaData.users.telefono && WhatsAppService.validarTelefono(atletaData.users.telefono)) {
          // Verificar configuración de WhatsApp Business
          const businessConfig = whatsAppBusiness.validateConfiguration();
          
          if (businessConfig.isValid) {
            // Usar WhatsApp Business API (automático)
            console.log('📱 Enviando mensaje por WhatsApp Business...');
            
            const whatsAppResult = await whatsAppBusiness.sendPaymentConfirmation({
              id: pagoCreado.id,
              estudiante_nombre: `${atletaData.users.nombre} ${atletaData.users.apellido}`,
              monto: Number.parseFloat(formData.monto),
              fecha_pago: formData.fecha_pago,
              concepto: 'Mensualidad Club de Voley'
            }, atletaData.users.telefono);
            
            if (whatsAppResult.success) {
              console.log('✅ WhatsApp Business enviado exitosamente');
              return { emailSent: true, whatsappSent: true, messageId: whatsAppResult.messageId };
            } else {
              console.warn('⚠️ Error en WhatsApp Business:', whatsAppResult.error);
              return { emailSent: true, whatsappSent: false, whatsappError: whatsAppResult.error };
            }
          } else {
            // Fallback: usar WhatsApp Web (manual)
            console.log('⚠️ WhatsApp Business no configurado, usando método manual');
            const telefonoFormateado = WhatsAppService.formatearTelefono(atletaData.users.telefono);
            const mensajeWhatsApp = WhatsAppService.crearMensajePago({
              id: pagoCreado.id,
              estudiante_nombre: `${atletaData.users.nombre} ${atletaData.users.apellido}`,
              monto: Number.parseFloat(formData.monto),
              fecha_pago: formData.fecha_pago,
              concepto: 'Mensualidad Club de Voley',
              observaciones: formData.observaciones
            });
            
            if (globalThis.confirm('¿Desea enviar confirmación por WhatsApp al atleta?')) {
              WhatsAppService.sendMessage(telefonoFormateado, mensajeWhatsApp);
              return { emailSent: true, whatsappSent: true };
            }
          }
        }
        
        return { emailSent: true };
      } else {
        console.warn('⚠️ El email no se pudo enviar:', emailResult.error);
        return { emailSent: false, emailError: emailResult.error };
      }
      
    } catch (emailError) {
      console.error('❌ Error en proceso de envío de email:', emailError);
      return { emailSent: false, emailError: emailError.message };
    }
  };

  const updatePago = async () => {
    // Crear objeto temporal para calcular estado
    const pagoTemporal = {
      student_id: formData.student_id,
      monto: Number.parseFloat(formData.monto),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      fecha_pago: formData.fecha_pago || null
    };
    
    // Calcular estado automáticamente
    const estadoCalculado = PagoStatusService.calcularEstado(pagoTemporal);
    
    const { error } = await supabase
      .from('payments')
      .update({
        ...pagoTemporal,
        estado: estadoCalculado
      })
      .eq('id', editingPago.id);

    if (error) throw error;
  };

  const deletePago = async (pago) => {
    if (!globalThis.confirm(
      `⚠️ ATENCIÓN: ¿Eliminar pago de ${pago.student?.user?.nombre} ${pago.student?.user?.apellido}?\n\n` +
      `Monto: $${pago.monto}\n` +
      `Período: ${formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}\n\n` +
      `Esta acción se puede revertir durante 30 días.`
    )) {
      return;
    }

    try {
      // Soft delete: marcar como eliminado en lugar de borrar
      const { error } = await supabase
        .from('payments')
        .update({ deleted_at: getEcuadorISOString() })
        .eq('id', pago.id);

      if (error) throw error;

      loadData();
      alert('✅ Pago marcado como eliminado.\nSe puede recuperar desde la base de datos durante 30 días.');
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const marcarComoPagado = async (pago) => {
    try {
      const fechaPago = getEcuadorDate();
      const estadoCalculado = PagoStatusService.calcularEstado({
        ...pago,
        fecha_pago: fechaPago
      });

      const { error } = await supabase
        .from('payments')
        .update({
          fecha_pago: fechaPago,
          estado: estadoCalculado
        })
        .eq('id', pago.id);

      if (error) throw error;

      loadData();
      alert('Fecha de pago registrada');
    } catch (error) {
      console.error('Error actualizando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (pago = null) => {
    setFormErrors({});
    if (pago) {
      setEditingPago(pago);
      setFormData({
        student_id: pago.student_id.toString(),
        fecha_inicio: pago.fecha_inicio || '',
        fecha_fin: pago.fecha_fin || '',
        monto: pago.monto?.toString() || '',
        fecha_pago: pago.fecha_pago || '',
        observaciones: ''
      });
      
      // Establecer el atleta en el campo de búsqueda
      const atleta = atletas.find(a => a.id === pago.student_id);
      if (atleta) {
        const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`;
        setAtletaBusqueda(nombreCompleto);
      }
    } else {
      setEditingPago(null);
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      fecha_inicio: getEcuadorDate(),
      fecha_fin: '',
      monto: '',
      fecha_pago: '', // Vacío por defecto
      observaciones: ''
    });
    setAtletaBusqueda('');
    setAtletasFiltrados([]);
    setMostrarSugerencias(false);
    setFormErrors({});
  };

  // Función para manejar la búsqueda de atletas
  const handleAtletaBusqueda = (valorBusqueda) => {
    setAtletaBusqueda(valorBusqueda);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
    
    if (valorBusqueda.trim() === '') {
      setAtletasFiltrados([]);
      setMostrarSugerencias(false);
      setFormData({...formData, student_id: ''});
      return;
    }

    // Filtrar atletas por nombre o apellido
    const filtrados = atletas.filter(atleta => {
      const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`.toLowerCase();
      return nombreCompleto.includes(valorBusqueda.toLowerCase());
    });

    setAtletasFiltrados(filtrados);
    setMostrarSugerencias(true);
  };

  // Función para seleccionar un atleta de las sugerencias
  const seleccionarAtleta = (atleta) => {
    const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`;
    setAtletaBusqueda(nombreCompleto);
    setFormData({...formData, student_id: atleta.id.toString()});
    setMostrarSugerencias(false);
    setAtletasFiltrados([]);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
  };

  // Función helper para formatear fechas sin problemas de zona horaria
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Parsear la fecha en formato YYYY-MM-DD sin conversión de zona horaria
      const [year, month, day] = dateStr.split('T')[0].split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  const formatPeriodo = (fecha_inicio, fecha_fin) => {
    if (!fecha_inicio) return '--';
    const inicio = formatDateSafe(fecha_inicio);
    if (!fecha_fin) return `Desde: ${inicio}`;
    const fin = formatDateSafe(fecha_fin);
    return `${inicio} - ${fin}`;
  };

  const formatMonto = (monto) => {
    if (!monto) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  const calcularEstadisticas = () => {
    const pagosVigentes = getLatestPaymentsList(allPagos);
    const pagosConEstado = pagosVigentes.map((pago) => ({
      ...pago,
      estadoCalculado: PagoStatusService.getStatusInfo(pago).estado
    }));

    const totalPagos = pagosConEstado.length;
    const activos = pagosConEstado.filter(p => p.estadoCalculado === 'activo').length;
    const proximosVencer = pagosConEstado.filter(p => p.estadoCalculado === 'proximo_a_vencer').length;
    const vencidos = pagosConEstado.filter(p => p.estadoCalculado === 'vencido').length;
    const totalRecaudado = pagosConEstado
      .filter(p => p.estadoCalculado === 'activo')
      .reduce((sum, p) => sum + (p.monto || 0), 0);

    return { totalPagos, activos, proximosVencer, vencidos, totalRecaudado };
  };

  const stats = calcularEstadisticas();

  const actualizarEstadosManualmente = async () => {
    try {
      console.log('🔄 Actualizando estados manualmente...');
      const resultados = await PagoStatusService.actualizarTodosLosEstados(supabase);
      
      if (resultados.actualizados > 0) {
        alert(`${resultados.actualizados} pagos actualizados.\nEstados sincronizados correctamente.`);
        loadData(); // Recargar datos
      } else {
        alert('Todos los estados ya están actualizados.');
      }
    } catch (error) {
      console.error('Error actualizando estados:', error);
      alert('Error al actualizar estados: ' + error.message);
    }
  };

  return (
    <div className={styles.pagosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaMoneyBillWave style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Gestión de Pagos</h2>
          <p>Administrar mensualidades y pagos del club</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.updateButton}
            onClick={actualizarEstadosManualmente}
            title="Actualizar estados automáticamente"
          >
            <FaSync style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Actualizar Estados
          </button>
          <button 
            className={styles.addButton}
            onClick={() => openModal()}
          >
            <FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar Pago
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartBar /></div>
          <div className={styles.statInfo}>
            <h3>{stats.totalPagos}</h3>
            <p>Total Pagos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheckCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaHourglassHalf /></div>
          <div className={styles.statInfo}>
            <h3>{stats.proximosVencer}</h3>
            <p>Próximos a Vencer</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaExclamationTriangle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.vencidos}</h3>
            <p>Vencidos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaDollarSign /></div>
          <div className={styles.statInfo}>
            <h3>{formatMonto(stats.totalRecaudado)}</h3>
            <p>Total Recaudado</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="payments-search" className={styles.filterLabel}>Busqueda</label>
          <input
            id="payments-search"
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
            aria-label="Buscar pagos por atleta"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="payments-start-date" className={styles.filterLabel}>Desde</label>
          <input
            id="payments-start-date"
            type="date"
            placeholder="Fecha inicio"
            value={filters.fecha_inicio}
            onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="payments-end-date" className={styles.filterLabel}>Hasta</label>
          <input
            id="payments-end-date"
            type="date"
            placeholder="Fecha fin"
            value={filters.fecha_fin}
            onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-status-filter" className={styles.filterLabel}>Estado</label>
          <select
            id="payments-status-filter"
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            className={styles.filterSelect}
            aria-label="Filtrar por estado de pago"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="proximo_a_vencer">Proximo a Vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-athlete-filter" className={styles.filterLabel}>Atleta</label>
          <select
            id="payments-athlete-filter"
            value={filters.atleta}
            onChange={(e) => setFilters({...filters, atleta: e.target.value})}
            className={styles.filterSelect}
            aria-label="Filtrar por atleta"
          >
            <option value="">Todos los atletas</option>
            {atletas.map(atleta => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.users?.nombre} {atleta.users?.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-sort-by" className={styles.filterLabel}>Ordenar por</label>
          <select
            id="payments-sort-by"
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className={styles.filterSelect}
            aria-label="Ordenar pagos por"
          >
            <option value="apellido">Apellido</option>
            <option value="nombre">Nombre</option>
            <option value="estado">Estado</option>
            <option value="monto">Monto</option>
            <option value="fecha_inicio">Fecha de inicio</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-sort-order" className={styles.filterLabel}>Direccion</label>
          <select
            id="payments-sort-order"
            value={filters.sortOrder}
            onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
            className={styles.filterSelect}
            aria-label="Direccion de orden"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="payments-clear-filters">Acciones</label>
          <button id="payments-clear-filters" type="button" className={styles.clearFiltersButton} onClick={resetFilters}>
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className={styles.filterSummary}>Mostrando {pagos.length} de {getLatestPaymentsList(allPagos).length} pagos.</p>

      {/* Lista de Pagos */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando pagos...</p>
        </div>
      ) : (
        <div className={styles.pagosTable}>
          {pagos.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Período</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(pago => (
                    <tr key={pago.id} className={styles.tableRow}>
                      <td data-label="Atleta">
                        <div className={styles.atletaInfo}>
                          <strong>{pago.student?.user?.nombre} {pago.student?.user?.apellido}</strong>
                          <small>{pago.student?.categoria?.replaceAll('_', ' ').toUpperCase()}</small>
                        </div>
                      </td>
                      <td data-label="Período">{formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}</td>
                      <td className={styles.monto} data-label="Monto">{formatMonto(pago.monto)}</td>
                      <td data-label="Estado">
                        <span
                          className={styles.estadoBadge}
                          style={{ backgroundColor: PagoStatusService.getStatusInfo(pago).color }}
                        >
                          {PagoStatusService.getStatusInfo(pago).mensaje}
                        </span>
                      </td>
                      <td data-label="Fecha Pago">
                        {pago.fecha_pago ? 
                          formatDateSafe(pago.fecha_pago) : 
                          '--'
                        }
                      </td>
                      <td data-label="Acciones">
                        <div className={styles.actions}>
                          {!pago.fecha_pago && (
                            <button
                              onClick={() => marcarComoPagado(pago)}
                              className={styles.paidButton}
                              title="Registrar fecha de pago"
                            >
                              <FaDollarSign />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(pago)}
                            className={styles.editButton}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deletePago(pago)}
                            className={styles.deleteButton}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noPagos}>
              <h3><FaCreditCard style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay pagos registrados</h3>
              <p>Registra el primer pago del club</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Agregar/Editar */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 id={modalTitleId}>
                {editingPago ? (
                  <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Pago</>
                ) : (
                  <><FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar Nuevo Pago</>
                )}
              </h3>
              <button 
                onClick={closeModal}
                className={styles.closeButton}
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {Object.values(formErrors).filter(Boolean).length > 0 && (
                <div className={styles.formErrorSummary} role="alert">
                  {Object.values(formErrors).filter(Boolean)[0]}
                </div>
              )}

              <div className={styles.statusPreview}>
                <span className={styles.statusPreviewLabel}>Estado estimado:</span>
                <span className={styles.statusPreviewBadge} style={{ backgroundColor: paymentStatusPreview.color }}>
                  {paymentStatusPreview.mensaje}
                </span>
              </div>

              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaUsers style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Atleta y Periodo</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="student_id">Atleta *</label>
                    <div className={styles.autosuggestContainer}>
                      <input
                        ref={firstPaymentFieldRef}
                        id="student_id"
                        type="text"
                        value={atletaBusqueda}
                        onChange={(e) => handleAtletaBusqueda(e.target.value)}
                        onFocus={() => {
                          if (atletaBusqueda && atletasFiltrados.length > 0) {
                            setMostrarSugerencias(true);
                          }
                        }}
                        placeholder="Escribe el nombre del atleta..."
                        required
                        autoComplete="off"
                        aria-invalid={Boolean(formErrors.student_id)}
                        aria-describedby={formErrors.student_id ? 'payment-student-error' : undefined}
                      />
                      {formErrors.student_id && (
                        <p id="payment-student-error" className={styles.fieldError}>{formErrors.student_id}</p>
                      )}
                      {mostrarSugerencias && atletasFiltrados.length > 0 && (
                        <ul className={styles.sugerenciasList}>
                          {atletasFiltrados.map(atleta => (
                            <li
                              key={atleta.id}
                              onClick={() => seleccionarAtleta(atleta)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  seleccionarAtleta(atleta);
                                }
                              }}
                              className={styles.sugerenciaItem}
                              role="button"
                              tabIndex={0}
                            >
                              <span className={styles.sugerenciaNombre}>
                                {atleta.users?.nombre} {atleta.users?.apellido}
                              </span>
                              <span className={styles.sugerenciaCategoria}>
                                {atleta.categoria?.replaceAll('_', ' ').toUpperCase()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {mostrarSugerencias && atletaBusqueda && atletasFiltrados.length === 0 && (
                        <div className={styles.noResultados}>
                          No se encontraron atletas
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_inicio">Fecha Inicio *</label>
                    <input
                      id="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => {
                        setFormData({...formData, fecha_inicio: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_inicio: undefined, fecha_fin: undefined }));
                      }}
                      required
                      max={getTodayDateString()}
                      aria-invalid={Boolean(formErrors.fecha_inicio)}
                      aria-describedby={formErrors.fecha_inicio ? 'payment-start-error' : 'payment-start-hint'}
                    />
                    <p id="payment-start-hint" className={styles.fieldHint}>Inicio del periodo a cubrir.</p>
                    {formErrors.fecha_inicio && <p id="payment-start-error" className={styles.fieldError}>{formErrors.fecha_inicio}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_fin">Fecha Fin</label>
                    <input
                      id="fecha_fin"
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => {
                        setFormData({...formData, fecha_fin: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_fin: undefined }));
                      }}
                      min={formData.fecha_inicio || undefined}
                      aria-invalid={Boolean(formErrors.fecha_fin)}
                      aria-describedby={formErrors.fecha_fin ? 'payment-end-error' : 'payment-end-hint'}
                    />
                    <p id="payment-end-hint" className={styles.fieldHint}>Opcional. Debe ser igual o posterior al inicio.</p>
                    {formErrors.fecha_fin && <p id="payment-end-error" className={styles.fieldError}>{formErrors.fecha_fin}</p>}
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaDollarSign style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Datos del Pago</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="monto">Monto *</label>
                    <input
                      id="monto"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.monto}
                      onChange={(e) => {
                        setFormData({...formData, monto: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, monto: undefined }));
                      }}
                      required
                      placeholder="0.00"
                      aria-invalid={Boolean(formErrors.monto)}
                      aria-describedby={formErrors.monto ? 'payment-amount-error' : 'payment-amount-hint'}
                    />
                    <p id="payment-amount-hint" className={styles.fieldHint}>Monto total del periodo.</p>
                    {formErrors.monto && <p id="payment-amount-error" className={styles.fieldError}>{formErrors.monto}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_pago">Fecha de Pago</label>
                    <input
                      id="fecha_pago"
                      type="date"
                      value={formData.fecha_pago}
                      onChange={(e) => {
                        setFormData({...formData, fecha_pago: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_pago: undefined }));
                      }}
                      max={getTodayDateString()}
                      aria-invalid={Boolean(formErrors.fecha_pago)}
                      aria-describedby={formErrors.fecha_pago ? 'payment-date-error' : 'payment-date-hint'}
                    />
                    <p id="payment-date-hint" className={styles.fieldHint}>Opcional. Solo fechas hasta hoy.</p>
                    {formErrors.fecha_pago && <p id="payment-date-error" className={styles.fieldError}>{formErrors.fecha_pago}</p>}
                  </div>

                  <div className={styles.inputGroupFullWidth}>
                    <label htmlFor="observaciones">Observaciones</label>
                    <textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => {
                        setFormData({...formData, observaciones: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, observaciones: undefined }));
                      }}
                      maxLength={300}
                      placeholder="Notas internas del pago (opcional)"
                      aria-invalid={Boolean(formErrors.observaciones)}
                      aria-describedby={formErrors.observaciones ? 'payment-notes-error' : 'payment-notes-hint'}
                    />
                    <p id="payment-notes-hint" className={styles.fieldHint}>{formData.observaciones.length}/300 caracteres</p>
                    {formErrors.observaciones && <p id="payment-notes-error" className={styles.fieldError}>{formErrors.observaciones}</p>}
                  </div>
                </div>
              </div>
              

              
              <div className={styles.formActions}>
                <button 
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                >
                  {editingPago ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

PagosManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string
  })
};

export default PagosManager;