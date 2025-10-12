// src/components/admin/PagosManager.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import styles from '../../styles/PagosManager.module.css';

const PagosManager = ({ user }) => {
  const [pagos, setPagos] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [filters, setFilters] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    estado: '',
    atleta: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    student_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    estado: 'activo',
    observaciones: ''
  });

  const estadosPago = ['activo', 'vencido', 'proximo_a_vencer'];

  useEffect(() => {
    loadData();
  }, [filters]);

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

      // Cargar pagos con filtros
      let query = supabase
        .from('payments')
        .select(`
          *,
          student:students(
            id,
            categoria,
            user:users(id, nombre, apellido, email)
          )
        `)
        .order('fecha_inicio', { ascending: false });

      // Aplicar filtros
      if (filters.fecha_inicio) {
        query = query.gte('fecha_inicio', filters.fecha_inicio);
      }
      if (filters.fecha_fin) {
        query = query.lte('fecha_fin', filters.fecha_fin);
      }
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters.atleta) {
        query = query.eq('student_id', filters.atleta);
      }

      const { data: pagosData, error: pagosError } = await query;

      if (pagosError) throw pagosError;

      // Filtrar por búsqueda local
      let filteredData = pagosData || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(pago => 
          pago.student?.user?.nombre?.toLowerCase().includes(searchLower) ||
          pago.student?.user?.apellido?.toLowerCase().includes(searchLower) ||
          pago.student?.user?.email?.toLowerCase().includes(searchLower)
        );
      }

      setPagos(filteredData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPago) {
        await updatePago();
      } else {
        await createPago();
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
    const { error } = await supabase
      .from('payments')
      .insert({
        student_id: formData.student_id,
        monto: parseFloat(formData.monto),
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        fecha_pago: formData.fecha_pago || null,
        estado: formData.estado
      });

    if (error) throw error;
  };

  const updatePago = async () => {
    const { error } = await supabase
      .from('payments')
      .update({
        student_id: formData.student_id,
        monto: parseFloat(formData.monto),
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        fecha_pago: formData.fecha_pago || null,
        estado: formData.estado
      })
      .eq('id', editingPago.id);

    if (error) throw error;
  };

  const deletePago = async (pago) => {
    if (!window.confirm(`¿Eliminar pago de ${pago.student?.user?.nombre} ${pago.student?.user?.apellido}?`)) {
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

  const marcarComoPagado = async (pago) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          estado: 'activo',
          fecha_pago: new Date().toISOString().split('T')[0]
        })
        .eq('id', pago.id);

      if (error) throw error;

      loadData();
      alert('Pago marcado como activo');
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
        estado: pago.estado,
        observaciones: ''
      });
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
      fecha_pago: new Date().toISOString().split('T')[0],
      estado: 'activo',
      observaciones: ''
    });
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return '#28a745';
      case 'proximo_a_vencer': return '#ffc107';
      case 'vencido': return '#dc3545';
      default: return '#6c757d';
    }
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

  return (
    <div className={styles.pagosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>💰 Gestión de Pagos</h2>
          <p>Administrar mensualidades y pagos del club</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => openModal()}
        >
          ➕ Registrar Pago
        </button>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalPagos}</h3>
            <p>Total Pagos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <h3>{stats.proximosVencer}</h3>
            <p>Próximos a Vencer</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <h3>{stats.vencidos}</h3>
            <p>Vencidos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💵</div>
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
            placeholder="🔍 Buscar por nombre del atleta..."
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
            <option value="">📋 Todos los estados</option>
            {estadosPago.map(estado => (
              <option key={estado} value={estado}>
                {estado.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.atleta}
            onChange={(e) => setFilters({...filters, atleta: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">👥 Todos los atletas</option>
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
                          <small>{pago.student?.categoria?.replace(/_/g, ' ').toUpperCase()}</small>
                        </div>
                      </td>
                      <td>{formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}</td>
                      <td className={styles.monto}>{formatMonto(pago.monto)}</td>
                      <td>
                        <span 
                          className={styles.estadoBadge}
                          style={{ backgroundColor: getEstadoColor(pago.estado) }}
                        >
                          {pago.estado.replace(/_/g, ' ').toUpperCase()}
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
                          {pago.estado !== 'activo' && (
                            <button
                              onClick={() => marcarComoPagado(pago)}
                              className={styles.paidButton}
                              title="Marcar como activo"
                            >
                              ✅
                            </button>
                          )}
                          <button
                            onClick={() => openModal(pago)}
                            className={styles.editButton}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deletePago(pago)}
                            className={styles.deleteButton}
                            title="Eliminar"
                          >
                            🗑️
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
              <h3>💳 No hay pagos registrados</h3>
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
              <h3>{editingPago ? '✏️ Editar Pago' : '➕ Registrar Nuevo Pago'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="student_id">Atleta *</label>
                  <select
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar atleta</option>
                    {atletas.map(atleta => (
                      <option key={atleta.id} value={atleta.id}>
                        {atleta.users?.nombre} {atleta.users?.apellido} - {atleta.categoria?.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
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
                  <label htmlFor="estado">Estado *</label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                  >
                    {estadosPago.map(estado => (
                      <option key={estado} value={estado}>
                        {estado.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
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

export default PagosManager;