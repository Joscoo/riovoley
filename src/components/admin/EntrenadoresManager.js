// src/components/admin/EntrenadoresManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { createUserWorking } from '../../services/userCreationWorking';
import styles from '../../styles/EntrenadoresManager.module.css';
import { FaEdit, FaPlus, FaSave, FaCheckCircle } from 'react-icons/fa';

const EntrenadoresManager = ({ user }) => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntrenador, setEditingEntrenador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: ''
  });

  useEffect(() => {
    loadEntrenadores();
  }, []);

  const loadEntrenadores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'entrenador')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntrenadores(data || []);
    } catch (error) {
      console.error('Error cargando entrenadores:', error);
      alert('❌ Error al cargar entrenadores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEntrenador) {
        // Actualizar entrenador existente
        const updateData = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento || null
        };

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingEntrenador.id);

        if (error) throw error;
        alert('✅ Entrenador actualizado correctamente');
      } else {
        // Crear nuevo entrenador usando el método que funciona
        console.log('🏐 Creando entrenador con método que funciona...');

        const userResult = await createUserWorking({
          email: formData.email,
          nombre: formData.nombre,
          apellido: formData.apellido,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          telefono: formData.telefono || null,
          role: 'entrenador'
        });

        console.log('✅ Entrenador creado exitosamente:', userResult);

        // Mostrar mensaje de éxito con credenciales
        const message = `✅ ¡Entrenador creado exitosamente!

📧 Email: ${userResult.credentials.email}
🔑 Contraseña temporal: ${userResult.credentials.password}
🌐 URL de ingreso: ${userResult.credentials.loginUrl}

${userResult.canLogin ? '✅ Login verificado: El entrenador puede iniciar sesión inmediatamente.' : '⚠️ Puede requerir confirmación de email.'}

¿Deseas copiar las credenciales al portapapeles?`;

        if (globalThis.confirm(message)) {
          const credentialsText = `Email: ${userResult.credentials.email}\nContraseña: ${userResult.credentials.password}\nURL: ${userResult.credentials.loginUrl}`;
          navigator.clipboard.writeText(credentialsText)
            .then(() => alert('📋 Credenciales copiadas al portapapeles'))
            .catch(() => alert('⚠️ No se pudieron copiar las credenciales automáticamente'));
        }
      }

      setShowModal(false);
      loadEntrenadores();
      resetForm();
    } catch (error) {
      console.error('Error guardando entrenador:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('ya está registrado')) {
        errorMessage = `❌ El email "${formData.email}" ya está registrado. Por favor usa un email diferente.`;
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async (entrenadorId) => {
    if (!window.confirm('¿Estás seguro de eliminar este entrenador?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', entrenadorId);

      if (error) throw error;
      alert('✅ Entrenador eliminado correctamente');
      loadEntrenadores();
    } catch (error) {
      console.error('Error eliminando entrenador:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const openModal = (entrenador = null) => {
    if (entrenador) {
      setEditingEntrenador(entrenador);
      setFormData({
        nombre: entrenador.nombre || '',
        apellido: entrenador.apellido || '',
        email: entrenador.email || '',
        telefono: entrenador.telefono || '',
        fecha_nacimiento: entrenador.fecha_nacimiento || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fecha_nacimiento: ''
    });
    setEditingEntrenador(null);
  };

  const filteredEntrenadores = entrenadores.filter(entrenador => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entrenador.nombre?.toLowerCase().includes(searchLower) ||
      entrenador.apellido?.toLowerCase().includes(searchLower) ||
      entrenador.email?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando entrenadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🏐 Gestión de Entrenadores</h2>
          <p className={styles.subtitle}>Administrar el equipo de entrenadores</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => openModal()}>
          ➕ Nuevo Entrenador
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.counter}>
          {filteredEntrenadores.length} entrenador{filteredEntrenadores.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Fecha Nacimiento</th>
              <th>Último Login</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntrenadores.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  {searchTerm ? 'No se encontraron entrenadores' : 'No hay entrenadores registrados'}
                </td>
              </tr>
            ) : (
              filteredEntrenadores.map((entrenador) => (
                <tr key={entrenador.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <strong>{entrenador.nombre} {entrenador.apellido}</strong>
                    </div>
                  </td>
                  <td>{entrenador.email}</td>
                  <td>{entrenador.telefono || 'N/A'}</td>
                  <td>{formatDate(entrenador.fecha_nacimiento)}</td>
                  <td>
                    {entrenador.last_login ? (
                      <span className={styles.lastLogin}>
                        {formatDate(entrenador.last_login)}
                      </span>
                    ) : (
                      <span className={styles.neverLoggedIn}>Nunca</span>
                    )}
                  </td>
                  <td>{formatDate(entrenador.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.btnEdit}
                        onClick={() => openModal(entrenador)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className={styles.btnDelete}
                        onClick={() => handleDelete(entrenador.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {editingEntrenador ? (
                  <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Entrenador</>
                ) : (
                  <><FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Nuevo Entrenador</>
                )}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Apellido *</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={editingEntrenador}
                />
                {editingEntrenador && (
                  <small className={styles.hint}>El email no puede ser modificado</small>
                )}
                {!editingEntrenador && (
                  <small className={styles.hint}>Se generará una contraseña temporal automáticamente</small>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingEntrenador ? (
                    <><FaSave style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Actualizar</>
                  ) : (
                    <><FaCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registrar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

EntrenadoresManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default EntrenadoresManager;
