// src/components/admin/UsuariosManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { deleteAuthUserById } from '../../services/authAdminService';
import { getEcuadorISOString } from '../../utils/dateUtils';
import styles from '../../styles/UsuariosManager.module.css';
import { FaCrown, FaVolleyballBall, FaRunning, FaUser, FaPause, FaPlay, FaEdit, FaTrash, FaPhone, FaCalendar, FaUsers, FaChartBar, FaCheckCircle, FaBan, FaClock, FaStickyNote } from 'react-icons/fa';

const UsuariosManager = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    role: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    suspended: false,
    suspension_reason: '',
    suspension_until: ''
  });

  const roles = [
    { value: 'administrador', label: 'Administrador', icon: <FaCrown /> },
    { value: 'entrenador', label: 'Entrenador', icon: <FaVolleyballBall /> },
    { value: 'estudiante', label: 'Estudiante', icon: <FaRunning /> }
  ];

  useEffect(() => {
    loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      console.log('[INFO] Cargando usuarios...');
      
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          nombre,
          apellido,
          telefono,
          fecha_nacimiento,
          last_login,
          created_at,
          suspended,
          suspension_reason,
          suspension_until,
          suspended_at
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtro por rol
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      const { data: usuariosData, error } = await query;
      
      console.log('📊 Resultado de query usuarios:', { 
        count: usuariosData?.length || 0, 
        error: error,
        data: usuariosData 
      });

      if (error) throw error;

      // Filtrar por búsqueda local
      let filteredData = usuariosData || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(usuario => 
          usuario.nombre?.toLowerCase().includes(searchLower) ||
          usuario.apellido?.toLowerCase().includes(searchLower) ||
          usuario.email?.toLowerCase().includes(searchLower)
        );
      }

      // Filtrar por estado
      if (filters.status === 'activo') {
        filteredData = filteredData.filter(usuario => !usuario.suspended);
      } else if (filters.status === 'suspendido') {
        filteredData = filteredData.filter(usuario => usuario.suspended);
      }

      setUsuarios(filteredData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      console.log('🔄 Actualizando usuario:', { 
        id: editingUser.id, 
        email: editingUser.email,
        rolAntiguo: editingUser.role, 
        rolNuevo: formData.role 
      });

      // Actualizar tabla users
      const { error: usersError } = await supabase
        .from('users')
        .update({
          role: formData.role,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono
        })
        .eq('id', editingUser.id);

      if (usersError) {
        console.error('❌ Error actualizando users:', usersError);
        throw usersError;
      }
      console.log('✅ Tabla users actualizada');

      // Actualizar tabla user_profiles (donde realmente se guarda el rol para autenticación)
      const { data: profileUpdateData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: editingUser.id,
          role: formData.role,
          full_name: `${formData.nombre} ${formData.apellido}`.trim()
        }, {
          onConflict: 'id'
        })
        .select();

      if (profileError) {
        console.error('❌ Error actualizando user_profiles:', profileError);
        throw new Error(`Error actualizando perfil: ${profileError.message}`);
      }
      
      console.log('✅ Tabla user_profiles actualizada:', profileUpdateData);

      // Verificar que el cambio se hizo correctamente
      const { data: verifyData } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .eq('id', editingUser.id)
        .single();
      
      console.log('[DEBUG] Verificación del rol actualizado:', verifyData);

      alert(`Usuario actualizado correctamente\n\n${editingUser.email}\nRol: ${formData.role}\n\nEl usuario debe cerrar sesión y volver a iniciar para ver los cambios.`);
      setShowModal(false);
      loadUsuarios();
      resetForm();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      role: usuario.role || '',
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      telefono: usuario.telefono || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      role: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      suspended: false,
      suspension_reason: '',
      suspension_until: ''
    });
    setEditingUser(null);
  };

  const deleteUser = async (usuario) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    try {
      await deleteAuthUserById(usuario.id);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', usuario.id);

      if (error) throw error;

      alert('Usuario eliminado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error: ' + error.message);
    }
  };

  const suspendUser = async (usuario, suspensionData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          suspended: true,
          suspension_reason: suspensionData.reason,
          suspension_until: suspensionData.until,
          suspended_at: getEcuadorISOString()
        })
        .eq('id', usuario.id);

      if (error) throw error;

      alert('Usuario suspendido temporalmente');
      loadUsuarios();
    } catch (error) {
      console.error('Error suspendiendo usuario:', error);
      alert('Error: ' + error.message);
    }
  };

  const reactivateUser = async (usuario) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`¿Reactivar la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          suspended: false,
          suspension_reason: null,
          suspension_until: null,
          suspended_at: null
        })
        .eq('id', usuario.id);

      if (error) throw error;

      alert('✓ Usuario reactivado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error reactivando usuario:', error);
      alert('✗ Error: ' + error.message);
    }
  };

  const handleSuspensionToggle = (usuario) => {
    if (usuario.suspended) {
      reactivateUser(usuario);
    } else {
      // Abrir modal de suspensión
      const reason = prompt('Motivo de la suspensión:');
      if (!reason) return;

      const until = prompt('Fecha de finalización (YYYY-MM-DD) o dejar vacío para indefinido:');
      
      suspendUser(usuario, {
        reason,
        until: until || null
      });
    }
  };

  const getRoleIcon = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.icon : <FaUser />;
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleStats = () => {
    const stats = {};
    for (const role of roles) {
      stats[role.value] = usuarios.filter(u => u.role === role.value).length;
    }
    return stats;
  };

  const getStatusStats = () => {
    const totalUsuarios = usuarios.length;
    const suspendidos = usuarios.filter(u => u.suspended).length;
    const activos = totalUsuarios - suspendidos;
    return { totalUsuarios, activos, suspendidos };
  };

  const stats = getRoleStats();
  const statusStats = getStatusStats();

  return (
    <div className={styles.usuariosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaUsers style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Gestión de Usuarios</h2>
          <p>Administrar usuarios y sus roles en el sistema</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        {roles.map(role => (
          <div key={role.value} className={styles.statCard}>
            <div className={styles.statIcon}>{role.icon}</div>
            <div className={styles.statInfo}>
              <h3>{stats[role.value] || 0}</h3>
              <p>{role.label}s</p>
            </div>
          </div>
        ))}
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartBar /></div>
          <div className={styles.statInfo}>
            <h3>{statusStats.totalUsuarios}</h3>
            <p>Total Usuarios</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheckCircle /></div>
          <div className={styles.statInfo}>
            <h3>{statusStats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaBan /></div>
          <div className={styles.statInfo}>
            <h3>{statusStats.suspendidos}</h3>
            <p>Suspendidos</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="roleFilter">Filtrar por Rol:</label>
          <select
            id="roleFilter"
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Todos los roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.icon} {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="searchFilter">Buscar Usuario:</label>
          <input
            id="searchFilter"
            type="text"
            placeholder="Nombre, apellido o email..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Estado:</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando usuarios...</p>
        </div>
      ) : (
        <div className={styles.usuariosGrid}>
          {usuarios.length > 0 ? (
            usuarios.map(usuario => (
              <div key={usuario.id} className={`${styles.userCard} ${usuario.suspended ? styles.suspendedCard : ''}`}>
                <div className={styles.userHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.userRole}>
                      {usuario.suspended ? <FaPause /> : getRoleIcon(usuario.role)}
                    </div>
                    <div className={styles.userDetails}>
                      <h3>{usuario.nombre} {usuario.apellido}</h3>
                      <p className={styles.userEmail}>{usuario.email}</p>
                      <span className={`${styles.roleBadge} ${styles[usuario.role]} ${usuario.suspended ? styles.suspended : ''}`}>
                        {usuario.suspended ? 'SUSPENDIDO' : getRoleLabel(usuario.role)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.userActions}>
                    <button
                      onClick={() => openModal(usuario)}
                      className={styles.editButton}
                      title="Editar usuario"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleSuspensionToggle(usuario)}
                      className={`${styles.suspendButton} ${usuario.suspended ? styles.reactivateButton : ''}`}
                      title={usuario.suspended ? "Reactivar usuario" : "Suspender usuario"}
                    >
                      {usuario.suspended ? <FaPlay /> : <FaPause />}
                    </button>
                    <button
                      onClick={() => deleteUser(usuario)}
                      className={styles.deleteButton}
                      title="Eliminar usuario"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className={styles.userMeta}>
                  {usuario.telefono && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FaPhone style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Teléfono:</span>
                      <span>{usuario.telefono}</span>
                    </div>
                  )}
                  
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><FaCalendar style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Registrado:</span>
                    <span>{new Date(usuario.created_at).toLocaleDateString()}</span>
                  </div>

                  {usuario.last_login && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FaClock style={{ marginRight: '4px' }} /> Último acceso:</span>
                      <span>{new Date(usuario.last_login).toLocaleDateString()}</span>
                    </div>
                  )}

                  {usuario.suspended && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FaPause style={{ marginRight: '4px' }} /> Estado:</span>
                      <span className={styles.suspendedStatus}>
                        SUSPENDIDO
                        {usuario.suspension_until && ` hasta ${new Date(usuario.suspension_until).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}

                  {usuario.suspension_reason && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FaStickyNote style={{ marginRight: '4px' }} /> Motivo:</span>
                      <span className={styles.suspensionReason}>{usuario.suspension_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noUsers}>
              <h3><FaUsers style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay usuarios encontrados</h3>
              <p>No se encontraron usuarios con los filtros aplicados</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Editar Usuario */}
      {showModal && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Usuario</h3>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Información básica */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaUser style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Información Personal</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Nombre del usuario"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      id="apellido"
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      placeholder="Apellido del usuario"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Email (Solo lectura)</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className={styles.readOnly}
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
              </div>

              {/* Rol del usuario */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>🔐 Rol y Permisos</h4>
                <div className={styles.roleSelector}>
                  {roles.map(role => (
                    <label key={role.value} className={styles.roleOption} aria-label={`Seleccionar rol ${role.label}`}>
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      />
                      <div className={`${styles.roleCard} ${formData.role === role.value ? styles.selected : ''}`}>
                        <div className={styles.roleIcon}>{role.icon}</div>
                        <div className={styles.roleInfo}>
                          <h5>{role.label}</h5>
                          <p>{getRoleDescription(role.value)}</p>
                        </div>
                      </div>
                    </label>
                  ))}
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
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Función auxiliar para describir roles
function getRoleDescription(role) {
  switch (role) {
    case 'administrador':
      return 'Acceso completo al sistema';
    case 'entrenador':
      return 'Gestión de entrenamientos y atletas';
    case 'estudiante':
      return 'Acceso básico como atleta';
    default:
      return 'Usuario del sistema';
  }
}

UsuariosManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default UsuariosManager;