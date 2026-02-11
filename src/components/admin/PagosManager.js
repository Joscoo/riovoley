// src/components/admin/PagosManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { EmailService } from '../../services/emailService';
import WhatsAppService from '../../services/whatsappService';
import WhatsAppBusinessService from '../../services/whatsappBusinessService';
import PagoStatusService from '../../services/pagoStatusService';
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
  FaWhatsapp, 
  FaTrash, 
  FaTimes, 
  FaUsers, 
  FaCreditCard, 
  FaClipboardList 
} from 'react-icons/fa';

const PagosManager = ({ user }) => {
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
    search: ''
  });

  // Estados para búsqueda de atleta en formulario
  const [atletaBusqueda, setAtletaBusqueda] = useState('');
  const [atletasFiltrados, setAtletasFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
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

      // Cargar TODOS los pagos sin filtros
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
          .order('fecha_inicio', { ascending: false });
        
        if (pagosActualizados) {
          setAllPagos(pagosActualizados);
        } else {
          setAllPagos(pagosData || []);
        }
      } else {
        setAllPagos(pagosData || []);
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
    let filteredData = [...allPagos];

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
      filteredData = filteredData.filter(pago => pago.estado === filters.estado);
    }

    // Filtrar por atleta
    if (filters.atleta) {
      filteredData = filteredData.filter(pago => pago.student_id?.toString() === filters.atleta);
    }

    // Filtrar por búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(pago => 
        pago.student?.user?.nombre?.toLowerCase().includes(searchLower) ||
        pago.student?.user?.apellido?.toLowerCase().includes(searchLower) ||
        pago.student?.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    setPagos(filteredData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        estado: formData.estado
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
    if (!globalThis.confirm(`¿Eliminar pago de ${pago.student?.user?.nombre} ${pago.student?.user?.apellido}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', pago.id);

      if (error) throw error;

      loadData();
      alert('Pago eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const enviarWhatsAppPago = async (pago) => {
    const atletaInfo = pago.student?.user;
    if (!atletaInfo) {
      alert('No se encontró información del atleta');
      return;
    }

    // Verificar si el atleta tiene teléfono
    if (!atletaInfo.telefono) {
      alert('El atleta no tiene número de teléfono registrado');
      return;
    }

    if (!WhatsAppService.validarTelefono(atletaInfo.telefono)) {
      alert('El número de teléfono no es válido');
      return;
    }

    try {
      // Verificar configuración de WhatsApp Business
      const businessConfig = whatsAppBusiness.validateConfiguration();
      
      if (businessConfig.isValid) {
        // Usar WhatsApp Business API
        console.log('📱 Enviando mensaje por WhatsApp Business...');
        
        const whatsAppResult = await whatsAppBusiness.sendPaymentConfirmation({
          id: pago.id,
          estudiante_nombre: `${atletaInfo.nombre} ${atletaInfo.apellido}`,
          monto: pago.monto,
          fecha_pago: pago.fecha_pago,
          concepto: 'Mensualidad Club de Voley'
        }, atletaInfo.telefono);
        
        if (whatsAppResult.success) {
          alert(`WhatsApp Business enviado exitosamente\nID: ${whatsAppResult.messageId}`);
        } else {
          alert(`Error en WhatsApp Business: ${whatsAppResult.error}`);
        }
      } else {
        // Fallback: usar WhatsApp Web (manual)
        console.log('⚠️ WhatsApp Business no configurado, usando método manual');
        console.log('Issues:', businessConfig.issues);
        
        const telefonoFormateado = WhatsAppService.formatearTelefono(atletaInfo.telefono);
        const mensajeWhatsApp = WhatsAppService.crearMensajePago({
          id: pago.id,
          estudiante_nombre: `${atletaInfo.nombre} ${atletaInfo.apellido}`,
          monto: pago.monto,
          fecha_pago: pago.fecha_pago,
          concepto: 'Mensualidad Club de Voley',
          observaciones: pago.observaciones || ''
        });

        WhatsAppService.sendMessage(telefonoFormateado, mensajeWhatsApp);
      }
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const marcarComoPagado = async (pago) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          fecha_pago: new Date().toISOString().split('T')[0]
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
        setAtletaSeleccionado(atleta);
      }
    } else {
      setEditingPago(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      monto: '',
      fecha_pago: '', // Vacío por defecto
      observaciones: ''
    });
    setAtletaBusqueda('');
    setAtletaSeleccionado(null);
    setAtletasFiltrados([]);
    setMostrarSugerencias(false);
  };

  // Función para manejar la búsqueda de atletas
  const handleAtletaBusqueda = (valorBusqueda) => {
    setAtletaBusqueda(valorBusqueda);
    
    if (valorBusqueda.trim() === '') {
      setAtletasFiltrados([]);
      setMostrarSugerencias(false);
      setFormData({...formData, student_id: ''});
      setAtletaSeleccionado(null);
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
    setAtletaSeleccionado(atleta);
    setFormData({...formData, student_id: atleta.id.toString()});
    setMostrarSugerencias(false);
    setAtletasFiltrados([]);
  };

  const formatPeriodo = (fecha_inicio, fecha_fin) => {
    if (!fecha_inicio) return '--';
    const inicio = new Date(fecha_inicio).toLocaleDateString();
    if (!fecha_fin) return `Desde: ${inicio}`;
    const fin = new Date(fecha_fin).toLocaleDateString();
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
    const totalPagos = pagos.length;
    const activos = pagos.filter(p => p.estado === 'activo').length;
    const proximosVencer = pagos.filter(p => p.estado === 'proximo_a_vencer').length;
    const vencidos = pagos.filter(p => p.estado === 'vencido').length;
    const totalRecaudado = pagos
      .filter(p => p.estado === 'activo')
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
          <input
            type="text"
            placeholder="Buscar por nombre del atleta..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <input
            type="date"
            placeholder="Fecha inicio"
            value={filters.fecha_inicio}
            onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <input
            type="date"
            placeholder="Fecha fin"
            value={filters.fecha_fin}
            onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            className={styles.filterSelect}
          >
            <option value=""><FaClipboardList style={{ marginRight: '6px' }} /> Todos los estados</option>
            <option value="activo"><FaCheckCircle style={{ marginRight: '6px' }} /> Activo</option>
            <option value="proximo_a_vencer"><FaHourglassHalf style={{ marginRight: '6px' }} /> Próximo a Vencer</option>
            <option value="vencido"><FaExclamationTriangle style={{ marginRight: '6px' }} /> Vencido</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.atleta}
            onChange={(e) => setFilters({...filters, atleta: e.target.value})}
            className={styles.filterSelect}
          >
            <option value=""><FaUsers style={{ marginRight: '6px' }} /> Todos los atletas</option>
            {atletas.map(atleta => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.users?.nombre} {atleta.users?.apellido}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                      <td>
                        <div className={styles.atletaInfo}>
                          <strong>{pago.student?.user?.nombre} {pago.student?.user?.apellido}</strong>
                          <small>{pago.student?.categoria?.replaceAll('_', ' ').toUpperCase()}</small>
                        </div>
                      </td>
                      <td>{formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}</td>
                      <td className={styles.monto}>{formatMonto(pago.monto)}</td>
                      <td>
                        <span
                          className={styles.estadoBadge}
                          style={{ backgroundColor: PagoStatusService.getStatusInfo(pago).color }}
                        >
                          {PagoStatusService.getStatusInfo(pago).mensaje}
                        </span>
                      </td>
                      <td>
                        {pago.fecha_pago ? 
                          new Date(pago.fecha_pago).toLocaleDateString() : 
                          '--'
                        }
                      </td>
                      <td>
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
                            onClick={() => enviarWhatsAppPago(pago)}
                            className={styles.whatsappButton}
                            title="Enviar por WhatsApp"
                          >
                            <FaWhatsapp />
                          </button>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>
                {editingPago ? (
                  <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Pago</>
                ) : (
                  <><FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar Nuevo Pago</>
                )}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="student_id">Atleta *</label>
                  <div className={styles.autosuggestContainer}>
                    <input
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
                    />
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
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="fecha_fin">Fecha Fin</label>
                  <input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="monto">Monto *</label>
                  <input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="fecha_pago">Fecha de Pago</label>
                  <input
                    id="fecha_pago"
                    type="date"
                    value={formData.fecha_pago}
                    onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                  />
                </div>
              </div>
              

              
              <div className={styles.formActions}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
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