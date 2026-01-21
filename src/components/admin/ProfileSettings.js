// src/components/admin/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/ProfileSettings.module.css';

const ProfileSettings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para edición de perfil
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fecha_nacimiento: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Cargar datos de user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Cargar datos de users (puede no existir para algunos usuarios)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (usersError && usersError.code !== 'PGRST116') {
        console.error('Error cargando users:', usersError);
      }

      // Si no existe en users, usar datos de user_profiles
      if (!usersData) {
        console.log('Usuario no existe en tabla users, usando user_profiles');
        const nameParts = profileData.full_name?.split(' ') || [];
        setUserData({
          id: user.id,
          email: user.email,
          nombre: nameParts[0] || '',
          apellido: nameParts.slice(1).join(' ') || '',
          telefono: '',
          fecha_nacimiento: ''
        });
        setFormData({
          nombre: nameParts[0] || '',
          apellido: nameParts.slice(1).join(' ') || '',
          telefono: '',
          fecha_nacimiento: ''
        });
      } else {
        setUserData(usersData);
        setFormData({
          nombre: usersData.nombre || '',
          apellido: usersData.apellido || '',
          telefono: usersData.telefono || '',
          fecha_nacimiento: usersData.fecha_nacimiento || ''
        });
      }

    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos del usuario' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Verificar si el usuario existe en la tabla users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      // Si existe en users, actualizar
      if (existingUser) {
        const { error: usersError } = await supabase
          .from('users')
          .update({
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            fecha_nacimiento: formData.fecha_nacimiento
          })
          .eq('id', user.id);

        if (usersError) {
          console.error('Error actualizando users:', usersError);
        }
      } else {
        // Si no existe, crear el registro en users
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            fecha_nacimiento: formData.fecha_nacimiento,
            role: userProfile?.role || 'usuario'
          });

        if (insertError) {
          console.error('Error insertando en users:', insertError);
        }
      }

      // Actualizar full_name en user_profiles
      const fullName = `${formData.nombre} ${formData.apellido}`.trim();
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setMensaje({ tipo: 'success', texto: '✅ Perfil actualizado correctamente' });
      setEditMode(false);
      await loadUserData();

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el perfil: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    try {
      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        setMensaje({ tipo: 'error', texto: 'La contraseña actual es incorrecta' });
        setLoading(false);
        return;
      }

      // Cambiar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setMensaje({ tipo: 'success', texto: '✅ Contraseña actualizada correctamente' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cambiar la contraseña: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>⚙️ Configuración de Perfil</h2>
          <p className={styles.subtitle}>Administra tu información personal y seguridad</p>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Información del Usuario */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>📋 Información Personal</h3>
          {!editMode && (
            <button 
              className={styles.editButton}
              onClick={() => setEditMode(true)}
            >
              ✏️ Editar
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    nombre: userData?.nombre || '',
                    apellido: userData?.apellido || '',
                    telefono: userData?.telefono || '',
                    fecha_nacimiento: userData?.fecha_nacimiento || ''
                  });
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre:</span>
              <span className={styles.infoValue}>
                {userData?.nombre || 'No especificado'} {userData?.apellido || ''}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teléfono:</span>
              <span className={styles.infoValue}>{userData?.telefono || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha de Nacimiento:</span>
              <span className={styles.infoValue}>
                {userData?.fecha_nacimiento 
                  ? new Date(userData.fecha_nacimiento).toLocaleDateString('es-ES')
                  : 'No especificada'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Rol:</span>
              <span className={`${styles.infoValue} ${styles.roleBadge}`}>
                {userProfile?.role || 'usuario'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Seguridad */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>🔒 Seguridad</h3>
        </div>

        {!showChangePassword ? (
          <button 
            className={styles.changePasswordButton}
            onClick={() => setShowChangePassword(true)}
          >
            🔑 Cambiar Contraseña
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.passwordNotice}>
              <p>⚠️ La contraseña debe tener al menos 6 caracteres</p>
            </div>

            <div className={styles.formGroup}>
              <label>Contraseña Actual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nueva Contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={loading}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Información de la Cuenta */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>ℹ️ Información de la Cuenta</h3>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>ID de Usuario:</span>
            <span className={styles.infoValue}>{user?.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Cuenta Creada:</span>
            <span className={styles.infoValue}>
              {userProfile?.created_at 
                ? new Date(userProfile.created_at).toLocaleDateString('es-ES')
                : 'No disponible'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

ProfileSettings.propTypes = {
  user: PropTypes.object.isRequired
};

export default ProfileSettings;
