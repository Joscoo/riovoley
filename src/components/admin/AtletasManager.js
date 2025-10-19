// src/components/admin/AtletasManager.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { generateTemporaryPassword } from '../../utils/passwordUtils';
import { EmailService } from '../../services/emailService';
import styles from '../../styles/AtletasManager.module.css';

const AtletasManager = ({ user }) => {
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    search: ''
  });

  const categorias = [
    'iniciacion_hombres',
    'iniciacion_mujeres', 
    'perfeccionamiento_mujeres',
    'perfeccionamiento_hombres',
    'master_mujeres'
  ];

  const [formData, setFormData] = useState({
    user_id: '',
    categoria: '',
    altura: '',
    peso: '',
    fecha_nacimiento: '',
    // Datos del usuario asociado
    email: '',
    nombre: '',
    apellido: '',
    telefono: ''
  });

  useEffect(() => {
    loadAtletas();
  }, [filters]);

  const loadAtletas = async () => {
    setLoading(true);
    try {
      // Obtener atletas con datos de usuario mediante JOIN
      let query = supabase
        .from('students')
        .select(`
          id,
          user_id,
          categoria,
          altura,
          peso,
          fecha_nacimiento,
          users!inner(
            id,
            email,
            nombre,
            apellido,
            telefono,
            role,
            created_at
          )
        `);

      // Aplicar filtros si existen
      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      const { data: studentsData, error: studentsError } = await query;

      if (studentsError) throw studentsError;

      // Procesar datos de atletas
      const atletasWithProfiles = studentsData.map((student) => ({
        ...student,
        email: student.users?.email || 'No disponible',
        telefono: student.users?.telefono || 'No disponible', 
        full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim() || `Atleta ${student.id}`
      }));

      // Filtrar por búsqueda local si hay término
      let filteredData = atletasWithProfiles || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(atleta => 
          atleta.full_name?.toLowerCase().includes(searchLower) ||
          atleta.categoria?.toLowerCase().includes(searchLower) ||
          atleta.email?.toLowerCase().includes(searchLower)
        );
      }

      setAtletas(filteredData);
    } catch (error) {
      console.error('Error cargando atletas:', error);
      alert('Error al cargar los atletas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones - Datos de Usuario
    if (!formData.nombre.trim()) {
      alert('Error: El nombre del usuario es requerido');
      return;
    }
    
    if (!formData.apellido.trim()) {
      alert('Error: El apellido del usuario es requerido');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Error: El email es requerido para crear la cuenta de usuario');
      return;
    }
    
    if (!formData.fecha_nacimiento) {
      alert('Error: La fecha de nacimiento es requerida');
      return;
    }
    
    // Validaciones - Datos Deportivos
    if (!formData.categoria) {
      alert('Error: La categoría deportiva es requerida para el atleta');
      return;
    }
    
    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Error: Por favor ingrese un email válido');
      return;
    }
    
    try {
      if (editingAtleta) {
        await updateAtleta();
      } else {
        await createAtleta();
      }
      
      setShowModal(false);
      resetForm();
      loadAtletas();
    } catch (error) {
      console.error('Error guardando atleta:', error);
      
      // Mejorar mensajes de error para casos específicos
      let errorMessage = error.message;
      
      if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        errorMessage = `❌ El email "${formData.email}" ya está registrado. Por favor usa un email diferente.`;
      } else if (error.message.includes('ya está registrado')) {
        errorMessage = `❌ ${error.message}`;
      } else if (error.message.includes('El email') && error.message.includes('requerido')) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const createAtleta = async () => {
    // Validar que se haya ingresado email (requerido para crear usuario)
    if (!formData.email || !formData.email.trim()) {
      throw new Error('El email es requerido para crear el usuario');
    }

    // Verificar si el email ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', formData.email.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 significa "no rows returned" (no existe el usuario)
      throw new Error(`Error verificando email: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error(`El email "${formData.email}" ya está registrado. Por favor usa un email diferente.`);
    }

    // Paso 1: Crear usuario en public.users (no en auth.users por RLS)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: formData.email.trim(),
        password: 'temp123456', // Contraseña temporal (se debería hashear)
        role: 'estudiante',
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        fecha_nacimiento: formData.fecha_nacimiento,
        telefono: formData.telefono || null
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Error creando usuario: ${userError.message}`);
    }

    const userId = userData.id;
    console.log('Usuario creado con ID:', userId);

    // Paso 2: Crear registro en students vinculado al usuario
    const { error: atletaError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        categoria: formData.categoria,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        fecha_nacimiento: formData.fecha_nacimiento
      });

    if (atletaError) {
      // Si falla, intentar eliminar el usuario creado
      await supabase.from('users').delete().eq('id', userId);
      throw new Error(`Error creando atleta: ${atletaError.message}`);
    }

    console.log('Usuario y atleta creados exitosamente');
    alert('✅ ¡Usuario y atleta registrados correctamente!');
  };

  const updateAtleta = async () => {
    // Actualizar datos del usuario
    const { error: userError } = await supabase
      .from('users')
      .update({
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento
      })
      .eq('id', editingAtleta.user_id);

    if (userError) throw userError;

    // Actualizar datos del atleta
    const { error: atletaError } = await supabase
      .from('students')
      .update({
        categoria: formData.categoria,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        fecha_nacimiento: formData.fecha_nacimiento
      })
      .eq('id', editingAtleta.id);

    if (atletaError) throw atletaError;
  };

  const deleteAtleta = async (atleta) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${atleta.full_name}?`)) {
      return;
    }

    try {
      console.log('🗑️ Eliminando atleta:', atleta);
      
      // Paso 1: Eliminar el registro del atleta en students
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', atleta.id);

      if (studentError) {
        throw new Error(`Error eliminando estudiante: ${studentError.message}`);
      }

      console.log('✅ Atleta eliminado de students');

      // Paso 2: Eliminar el usuario relacionado si existe
      if (atleta.user_id) {
        console.log('🗑️ Eliminando usuario con ID:', atleta.user_id);
        
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', atleta.user_id);

        if (userError) {
          console.warn('⚠️ Error eliminando usuario:', userError.message);
          // No lanzamos error aquí para no fallar toda la operación
        } else {
          console.log('✅ Usuario eliminado exitosamente');
        }
      } else {
        console.log('ℹ️ No hay user_id asociado para eliminar');
      }

      loadAtletas();
      alert('✅ Atleta y usuario eliminados exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando atleta:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  // Función para reenviar credenciales por email
  const resendCredentials = async (atleta) => {
    try {
      console.log('📧 Reenviando credenciales para:', atleta.full_name);
      
      // Preparar datos del usuario
      const userData = {
        id: atleta.user_id,
        email: atleta.users.email,
        nombre: atleta.users.nombre,
        apellido: atleta.users.apellido,
        full_name: `${atleta.users.nombre} ${atleta.users.apellido}`.trim(),
        // Generar nueva contraseña temporal
        password: generateTemporaryPassword()
      };

      console.log('👤 Datos del usuario:', { 
        email: userData.email, 
        nombre: userData.nombre,
        apellido: userData.apellido 
      });

      // Actualizar la contraseña en la base de datos
      const { error: passwordError } = await supabase
        .from('users')
        .update({ 
          password: userData.password,
          first_login: true // Marcar para que cambie la contraseña
        })
        .eq('id', atleta.user_id);

      if (passwordError) {
        throw new Error(`Error actualizando contraseña: ${passwordError.message}`);
      }

      console.log('🔑 Contraseña actualizada en la base de datos');

      // Enviar email con las nuevas credenciales
      const emailResult = await EmailService.sendCredentials(userData);
      
      if (emailResult.success) {
        alert(`✅ Credenciales enviadas exitosamente a ${userData.email}`);
      } else {
        console.warn('⚠️ El email no se pudo enviar, pero se mostró el modal con las credenciales');
      }
    } catch (error) {
      console.error('❌ Error reenviando credenciales:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  // Función utilitaria para limpiar usuarios huérfanos (opcional)
  const cleanOrphanUsers = async () => {
    if (!window.confirm('¿Deseas limpiar usuarios que ya no tienen atletas asociados? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      console.log('🧹 Limpiando usuarios huérfanos...');
      
      // Obtener todos los user_ids que están en students
      const { data: studentsUserIds, error: studentsError } = await supabase
        .from('students')
        .select('user_id');

      if (studentsError) throw studentsError;

      const activeUserIds = studentsUserIds.map(s => s.user_id).filter(Boolean);

      // Obtener usuarios con role 'estudiante' que no están en la lista de activos
      const { data: orphanUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email, nombre, apellido')
        .eq('role', 'estudiante')
        .not('id', 'in', `(${activeUserIds.join(',')})`);

      if (usersError) throw usersError;

      if (orphanUsers.length === 0) {
        alert('✅ No se encontraron usuarios huérfanos');
        return;
      }

      console.log('👻 Usuarios huérfanos encontrados:', orphanUsers);

      // Eliminar usuarios huérfanos
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('role', 'estudiante')
        .not('id', 'in', `(${activeUserIds.join(',')})`);

      if (deleteError) throw deleteError;

      alert(`✅ Se eliminaron ${orphanUsers.length} usuarios huérfanos`);
      console.log('🧹 Limpieza completada');
    } catch (error) {
      console.error('❌ Error limpiando usuarios huérfanos:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const openModal = (atleta = null) => {
    if (atleta) {
      setEditingAtleta(atleta);
      setFormData({
        user_id: atleta.user_id,
        categoria: atleta.categoria || '',
        altura: atleta.altura || '',
        peso: atleta.peso || '',
        fecha_nacimiento: atleta.fecha_nacimiento || '',
        email: atleta.users?.email || '',
        nombre: atleta.users?.nombre || '',
        apellido: atleta.users?.apellido || '',
        telefono: atleta.users?.telefono || ''
      });
    } else {
      setEditingAtleta(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      categoria: '',
      altura: '',
      peso: '',
      fecha_nacimiento: '',
      email: '',
      nombre: '',
      apellido: '',
      telefono: ''
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '--';
    
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      
      // Verificar si la fecha es válida
      if (isNaN(birth.getTime())) {
        return '--';
      }
      
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }
      return age;
    } catch (error) {
      console.warn('Error calculando edad:', error);
      return '--';
    }
  };

  const formatIngresoDate = (atleta) => {
    try {
      if (atleta.users?.created_at) {
        const date = new Date(atleta.users.created_at);
        // Verificar si la fecha es válida
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      }
    } catch (error) {
      console.warn('Error formateando fecha de ingreso:', error);
    }
    return 'No registrado';
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return '--';
    return categoria.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className={styles.atletasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>🏐 Gestión de Atletas</h2>
          <p>Administrar deportistas del club</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.addButton}
            onClick={() => openModal()}
          >
            ➕ Agregar Atleta
          </button>
          <button 
            className={styles.cleanButton}
            onClick={cleanOrphanUsers}
            title="Limpiar usuarios sin atletas asociados"
          >
            🧹 Limpiar DB
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, apellido o email..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">🏐 Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>
                {formatCategoria(categoria)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Atletas */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando atletas...</p>
        </div>
      ) : (
        <div className={styles.atletasGrid}>
          {atletas.length > 0 ? (
            atletas.map(atleta => (
              <div key={atleta.id} className={styles.atletaCard}>
                <div className={styles.atletaHeader}>
                  <h3>{atleta.full_name}</h3>
                  <div className={styles.atletaActions}>
                    <button 
                      onClick={() => openModal(atleta)}
                      className={styles.editButton}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => resendCredentials(atleta)}
                      className={styles.emailButton}
                      title="Reenviar credenciales por email"
                    >
                      📧
                    </button>
                    <button 
                      onClick={() => deleteAtleta(atleta)}
                      className={styles.deleteButton}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className={styles.atletaInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Categoría:</span>
                    <span className={styles.categoria}>
                      {formatCategoria(atleta.categoria)}
                    </span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Edad:</span>
                    <span>{calculateAge(atleta.fecha_nacimiento)} años</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span>{atleta.email}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Teléfono:</span>
                    <span>{atleta.telefono || '--'}</span>
                  </div>
                  
                  {atleta.altura && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Altura:</span>
                      <span>{atleta.altura}m</span>
                    </div>
                  )}
                  
                  {atleta.peso && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Peso:</span>
                      <span>{atleta.peso}kg</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.atletaFooter}>
                  <small>
                    Ingreso: {formatIngresoDate(atleta)}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noAtletas}>
              <h3>👥 No hay atletas registrados</h3>
              <p>Agrega el primer atleta al club</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Agregar/Editar */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingAtleta ? '✏️ Editar Atleta' : '➕ Agregar Nuevo Atleta'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Sección: Datos de Usuario */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>👤 Información Personal del Usuario</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="nombre">Nombre *</label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                      placeholder="Ingrese el nombre"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="apellido">Apellido *</label>
                    <input
                      id="apellido"
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      required
                      placeholder="Ingrese el apellido"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      placeholder="ejemplo@email.com"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</label>
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Datos Deportivos */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>🏐 Información Deportiva</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="categoria">Categoría *</label>
                    <select
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria} value={categoria}>
                          {formatCategoria(categoria)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="altura">Altura (metros)</label>
                    <input
                      id="altura"
                      type="number"
                      step="0.01"
                      min="1.00"
                      max="2.50"
                      value={formData.altura}
                      onChange={(e) => setFormData({...formData, altura: e.target.value})}
                      placeholder="1.75"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="peso">Peso (kg)</label>
                    <input
                      id="peso"
                      type="number"
                      step="0.1"
                      min="30"
                      max="150"
                      value={formData.peso}
                      onChange={(e) => setFormData({...formData, peso: e.target.value})}
                      placeholder="70.0"
                    />
                  </div>
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
                  {editingAtleta ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtletasManager;