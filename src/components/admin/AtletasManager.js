// src/components/admin/AtletasManager.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
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
          *,
          users!inner(
            id,
            email,
            nombre,
            apellido,
            telefono,
            role
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
      alert('Error: ' + error.message);
    }
  };

  const createAtleta = async () => {
    // Validar que se haya ingresado email (requerido para crear usuario)
    if (!formData.email || !formData.email.trim()) {
      throw new Error('El email es requerido para crear el usuario');
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
      // Eliminar el atleta (esto también eliminará el usuario por CASCADE)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', atleta.id);

      if (error) throw error;

      loadAtletas();
      alert('Atleta eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando atleta:', error);
      alert('Error: ' + error.message);
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
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
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
        <button 
          className={styles.addButton}
          onClick={() => openModal()}
        >
          ➕ Agregar Atleta
        </button>
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
                    Ingreso: {new Date(atleta.fecha_ingreso).toLocaleDateString()}
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