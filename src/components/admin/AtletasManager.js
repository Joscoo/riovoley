// src/components/admin/AtletasManager.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { EmailService } from '../../services/emailService';
import WhatsAppBusinessService from '../../services/whatsappBusinessService';
import { deleteAuthUserById } from '../../services/authAdminService';
import { createStudentWorking, resendWorkingCredentials } from '../../services/userCreationWorking';
import { withEncryptedUserContactFields } from '../../utils/piiCrypto';
import {
  MIN_ATHLETE_AGE,
  calculateAgeFromDate,
  getMaxBirthDateForAge,
  validateAthleteBirthDate,
} from '../../utils/athleteValidation';
import styles from '../../styles/AtletasManager.module.css';
import { 
  FaEdit, 
  FaPlus, 
  FaVolleyballBall, 
  FaUser, 
  FaTrash, 
  FaEnvelope, 
  FaBroom,
  FaTimes,
  FaUsers
} from 'react-icons/fa';

const AtletasManager = ({ user }) => {
  const modalTitleId = 'atleta-modal-title';
  const birthDateHintId = 'fecha-nacimiento-hint';
  const initialFocusRef = useRef(null);
  const [allAtletas, setAllAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState(null);
  const [whatsAppBusiness] = useState(new WhatsAppBusinessService());
  const [filters, setFilters] = useState({
    categoria: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc'
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
    fecha_nacimiento: '',
    // Datos del usuario asociado
    email: '',
    nombre: '',
    apellido: '',
    telefono: ''
  });

  const maxBirthDate = useMemo(() => getMaxBirthDateForAge(MIN_ATHLETE_AGE), []);

  useEffect(() => {
    loadAtletas();
  }, []);

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
      initialFocusRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  // Filtrado optimizado con useMemo - solo recalcula cuando cambian atletas o filtros
  const filteredAtletas = useMemo(() => {
    const normalizeText = (value = '') => value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const getSortableValue = (atleta) => {
      switch (filters.sortBy) {
        case 'nombre':
          return normalizeText(atleta.users?.nombre || atleta.full_name || '');
        case 'categoria':
          return normalizeText(atleta.categoria || '');
        case 'edad': {
          const age = calculateAgeFromDate(atleta.fecha_nacimiento);
          return Number.isFinite(age) ? age : Number.MAX_SAFE_INTEGER;
        }
        case 'ingreso': {
          const ingresoDate = atleta.users?.created_at ? new Date(atleta.users.created_at).getTime() : Number.MAX_SAFE_INTEGER;
          return Number.isFinite(ingresoDate) ? ingresoDate : Number.MAX_SAFE_INTEGER;
        }
        case 'apellido':
        default:
          return normalizeText(atleta.users?.apellido || atleta.full_name || '');
      }
    };

    let result = [...allAtletas];

    // Filtrar por categoría
    if (filters.categoria) {
      result = result.filter(atleta => atleta.categoria === filters.categoria);
    }

    // Filtrar por búsqueda
    if (filters.search) {
      const searchLower = normalizeText(filters.search);
      result = result.filter(atleta => 
        normalizeText(atleta.full_name).includes(searchLower) ||
        normalizeText(atleta.users?.nombre).includes(searchLower) ||
        normalizeText(atleta.users?.apellido).includes(searchLower) ||
        normalizeText(atleta.categoria).includes(searchLower) ||
        normalizeText(atleta.email).includes(searchLower)
      );
    }

    result.sort((a, b) => {
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

    return result;
  }, [allAtletas, filters]);

  const resetFilters = () => {
    setFilters({
      categoria: '',
      search: '',
      sortBy: 'apellido',
      sortOrder: 'asc'
    });
  };

  const loadAtletas = async () => {
    setLoading(true);
    try {
      console.log('📥 Cargando atletas...');
      
      // Obtener atletas con datos de usuario mediante JOIN
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          categoria,
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
      
      console.log('📊 Resultado de query atletas:', { 
        count: studentsData?.length || 0, 
        error: studentsError,
        data: studentsData 
      });

      if (studentsError) throw studentsError;

      // Procesar datos de atletas
      const atletasWithProfiles = studentsData.map((student) => ({
        ...student,
        email: student.users?.email || 'No disponible',
        telefono: student.users?.telefono || 'No disponible', 
        full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim() || `Atleta ${student.id}`
      }));

      setAllAtletas(atletasWithProfiles);
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

    const birthDateValidation = validateAthleteBirthDate(formData.fecha_nacimiento, MIN_ATHLETE_AGE);
    if (!birthDateValidation.isValid) {
      alert(`Error: ${birthDateValidation.error}`);
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
      
      closeModal();
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

    try {
      console.log('🔐 Creando estudiante con método que funciona...');

      // Usar el nuevo servicio que funciona (mismo método que confirm-fix)
      const result = await createStudentWorking({
        // Datos de usuario
        email: formData.email.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        fecha_nacimiento: formData.fecha_nacimiento,
        telefono: formData.telefono || null,
        // Datos específicos de estudiante
        categoria: formData.categoria
      });

      console.log('✅ Estudiante creado exitosamente:', result);

      // Mostrar mensaje de éxito con credenciales que funcionan y opción de enviar email
      const message = `✅ ¡Estudiante creado exitosamente!

📧 Email: ${result.credentials.email}
🔑 Contraseña temporal: ${result.credentials.password}
🌐 URL de ingreso: ${result.credentials.loginUrl}

${result.canLogin ? '✅ El usuario puede ingresar inmediatamente.' : '⚠️ Puede requerir verificación de email.'}

⚠️ IMPORTANTE: Guarda esta información y compártela de forma segura con el estudiante.

¿Deseas enviar estas credenciales por email al estudiante?`;

      const shouldSendEmail = globalThis.confirm(message);
      
      if (shouldSendEmail) {
        try {
          const userData = {
            email: result.credentials.email,
            nombre: result.user.nombre,
            apellido: result.user.apellido,
            full_name: `${result.user.nombre} ${result.user.apellido}`.trim(),
            password: result.credentials.password
          };

          const emailResult = await EmailService.sendCredentials(userData);
          
          if (emailResult.success) {
            alert(`Credenciales enviadas exitosamente a ${result.credentials.email}`);
          } else {
            alert(`No se pudo enviar el email automáticamente. Las credenciales ya se mostraron anteriormente.`);
          }
        } catch (emailError) {
          console.error('❌ Error enviando email:', emailError);
          alert(`Error enviando email: ${emailError.message}. Las credenciales ya se mostraron anteriormente.`);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Error creando estudiante:', error);
      throw error;
    }
  };

  const updateAtleta = async () => {
    const birthDateValidation = validateAthleteBirthDate(formData.fecha_nacimiento, MIN_ATHLETE_AGE);
    if (!birthDateValidation.isValid) {
      throw new Error(birthDateValidation.error);
    }

    const userUpdatePayload = await withEncryptedUserContactFields({
      email: formData.email,
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
      fecha_nacimiento: formData.fecha_nacimiento
    });

    // Actualizar datos del usuario
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdatePayload)
      .eq('id', editingAtleta.user_id);

    if (userError) throw userError;

    // Actualizar datos del atleta
    const { error: atletaError } = await supabase
      .from('students')
      .update({
        categoria: formData.categoria,
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

      // Paso 1: Eliminar el usuario en Supabase Auth para evitar correos bloqueados al recrear atletas
      if (atleta.user_id) {
        console.log('🛡️ Eliminando usuario en Auth con ID:', atleta.user_id);
        await deleteAuthUserById(atleta.user_id);
        console.log('✅ Usuario eliminado de Auth');
      }
      
      // Paso 2: Eliminar el registro del atleta en students
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', atleta.id);

      if (studentError) {
        throw new Error(`Error eliminando estudiante: ${studentError.message}`);
      }

      console.log('✅ Atleta eliminado de students');

      // Paso 3: Eliminar el usuario relacionado si existe
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
      alert('Atleta y usuario eliminados exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando atleta:', error);
      alert('Error: ' + error.message);
    }
  };

  // Función para reenviar credenciales por email y WhatsApp
  const resendCredentials = async (atleta) => {
    try {
      console.log('📧 Reenviando credenciales para:', atleta.full_name);

      // Usar la función que maneja las credenciales correctamente
      const result = await resendWorkingCredentials({
        user_id: atleta.user_id,
        email: atleta.users.email,
        nombre: atleta.users.nombre,
        apellido: atleta.users.apellido
      });

      if (!result.success) {
        throw new Error('No se pudieron obtener las credenciales');
      }

      const userData = {
        email: result.credentials.email,
        nombre: atleta.users.nombre,
        apellido: atleta.users.apellido,
        telefono: atleta.users.telefono,
        full_name: `${atleta.users.nombre} ${atleta.users.apellido}`.trim(),
        password: result.credentials.password
      };

      console.log('🔑 Enviando credenciales que funcionan:', {
        email: userData.email,
        hasPassword: !!userData.password,
        isNewPassword: result.isNewPassword,
        hasTelefono: !!userData.telefono
      });

      // Intentar enviar por WhatsApp si tiene teléfono
      let whatsappResult = { success: false };
      if (userData.telefono) {
        console.log('📱 Intentando enviar credenciales por WhatsApp...');
        whatsappResult = await whatsAppBusiness.sendCredentials(userData, userData.password);
        
        if (whatsappResult.success) {
          console.log('[SUCCESS] Credenciales enviadas por WhatsApp');
        } else {
          console.log('[WARNING] No se pudo enviar por WhatsApp:', whatsappResult.error);
        }
      }
      
      // Mensaje de confirmación según los canales exitosos
      const canalesExitosos = [];
      if (result.emailSent) canalesExitosos.push('✉ Email');
      if (whatsappResult.success) canalesExitosos.push('☎ WhatsApp');
      
      if (canalesExitosos.length > 0) {
        alert(`✓ Nueva contraseña temporal generada y enviada vía:
${canalesExitosos.join('\n')}

✉ Email: ${result.credentials.email}
🔑 Nueva Contraseña: ${result.credentials.password}
🌐 URL: ${result.credentials.loginUrl}

⚠ IMPORTANTE: Esta es una NUEVA contraseña temporal.
La contraseña anterior ya no funciona.

${result.message}`);
      } else {
        // Si todo falla, mostrar las credenciales directamente
        alert(`No se pudo enviar por Email ni WhatsApp.

✉ Email: ${result.credentials.email}
🔑 Nueva Contraseña: ${result.credentials.password}
🌐 URL: ${result.credentials.loginUrl}

⚠ IMPORTANTE: Esta es una NUEVA contraseña temporal.
La contraseña anterior ya no funciona.

${result.message}

Por favor, envía esta información al estudiante de forma manual.`);
      }
    } catch (error) {
      console.error('❌ Error reenviando credenciales:', error);
      alert('Error: ' + error.message);
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
      let orphanUsersQuery = supabase
        .from('users')
        .select('id, email, nombre, apellido')
        .eq('role', 'estudiante');

      if (activeUserIds.length > 0) {
        orphanUsersQuery = orphanUsersQuery.not('id', 'in', `(${activeUserIds.join(',')})`);
      }

      const { data: orphanUsers, error: usersError } = await orphanUsersQuery;

      if (usersError) throw usersError;

      if (orphanUsers.length === 0) {
        alert('No se encontraron usuarios huérfanos');
        return;
      }

      console.log('👻 Usuarios huérfanos encontrados:', orphanUsers);

      let deletedCount = 0;
      let failedCount = 0;

      for (const orphanUser of orphanUsers) {
        try {
          await deleteAuthUserById(orphanUser.id);

          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', orphanUser.id);

          if (deleteError) {
            throw deleteError;
          }

          deletedCount += 1;
        } catch (deleteUserError) {
          failedCount += 1;
          console.warn(`⚠️ No se pudo limpiar el usuario ${orphanUser.email}:`, deleteUserError.message);
        }
      }

      alert(`Limpieza completada: ${deletedCount} usuarios eliminados${failedCount > 0 ? `, ${failedCount} con error` : ''}`);
      console.log('🧹 Limpieza completada');
    } catch (error) {
      console.error('❌ Error limpiando usuarios huérfanos:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (atleta = null) => {
    if (atleta) {
      setEditingAtleta(atleta);
      setFormData({
        user_id: atleta.user_id,
        categoria: atleta.categoria || '',
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

  const closeModal = () => {
    setShowModal(false);
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      categoria: '',
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
      const age = calculateAgeFromDate(birthDate);
      if (age === null || age < 0) {
        return '--';
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
    return categoria.replaceAll('_', ' ').toUpperCase();
  };

  return (
    <div className={styles.atletasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaVolleyballBall style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Gestión de Atletas</h2>
          <p>Administrar deportistas del club</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.addButton}
            onClick={() => openModal()}
          >
            <FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Agregar Atleta
          </button>
          <button 
            className={styles.cleanButton}
            onClick={cleanOrphanUsers}
            title="Limpiar usuarios sin atletas asociados"
          >
            <FaBroom style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Limpiar DB
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="athlete-search">Busqueda</label>
          <input
            id="athlete-search"
            type="text"
            placeholder="Buscar por nombre, apellido, categoria o email..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
            aria-label="Buscar atletas"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="athlete-category-filter">Categoria</label>
          <select
            id="athlete-category-filter"
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className={`${styles.filterSelect} ${styles.brandSelect}`}
            aria-label="Filtrar por categoria"
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
          <label className={styles.filterLabel} htmlFor="athlete-sort-by">Ordenar por</label>
          <select
            id="athlete-sort-by"
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className={`${styles.filterSelect} ${styles.brandSelect}`}
            aria-label="Ordenar por"
          >
            <option value="apellido">Ordenar por apellido</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="categoria">Ordenar por categoria</option>
            <option value="edad">Ordenar por edad</option>
            <option value="ingreso">Ordenar por fecha de ingreso</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="athlete-sort-order">Direccion</label>
          <select
            id="athlete-sort-order"
            value={filters.sortOrder}
            onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
            className={`${styles.filterSelect} ${styles.brandSelect}`}
            aria-label="Direccion de orden"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>

        <button
          type="button"
          className={styles.clearFiltersButton}
          onClick={resetFilters}
        >
          Limpiar filtros
        </button>
      </div>

      <p className={styles.filterSummary}>
        Mostrando {filteredAtletas.length} de {allAtletas.length} atletas.
      </p>

      {/* Lista de Atletas */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando atletas...</p>
        </div>
      ) : (
        <div className={styles.atletasGrid}>
          {filteredAtletas.length > 0 ? (
            filteredAtletas.map(atleta => (
              <div key={atleta.id} className={styles.atletaCard}>
                <div className={styles.atletaHeader}>
                  <h3>{atleta.full_name}</h3>
                  <div className={styles.atletaActions}>
                    <button 
                      onClick={() => openModal(atleta)}
                      className={styles.editButton}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => resendCredentials(atleta)}
                      className={styles.emailButton}
                      title="Reenviar credenciales por email"
                    >
                      <FaEnvelope />
                    </button>
                    <button 
                      onClick={() => deleteAtleta(atleta)}
                      className={styles.deleteButton}
                      title="Eliminar"
                    >
                      <FaTrash />
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
              <h3><FaUsers style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay atletas registrados</h3>
              <p>Agrega el primer atleta al club</p>
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
                {editingAtleta ? (
                  <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Atleta</>
                ) : (
                  <><FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Agregar Nuevo Atleta</>
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
              
              {/* Sección: Datos de Usuario */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaUser style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Información Personal del Usuario</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="nombre">Nombre *</label>
                    <input
                      ref={initialFocusRef}
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
                      max={maxBirthDate}
                      aria-describedby={birthDateHintId}
                      required
                    />
                    <p id={birthDateHintId} className={styles.inputHint}>
                      Edad minima permitida: {MIN_ATHLETE_AGE} años.
                    </p>
                    {formData.fecha_nacimiento && (
                      <p className={styles.inputMeta}>
                        Edad calculada: {calculateAge(formData.fecha_nacimiento)} años.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Datos Deportivos */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaVolleyballBall style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Información Deportiva</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="categoria">Categoría *</label>
                    <select
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className={styles.brandSelect}
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

AtletasManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string
  }).isRequired
};

export default AtletasManager;