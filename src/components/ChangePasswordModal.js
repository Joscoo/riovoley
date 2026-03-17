// src/components/ChangePasswordModal.js
import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { validatePassword } from '../utils/passwordUtils';
import styles from '../styles/ChangePasswordModal.module.css';
import { FaLock, FaTimesCircle, FaEye, FaEyeSlash, FaClipboardList, FaSpinner, FaShieldAlt } from 'react-icons/fa';

const ChangePasswordModal = ({ user, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Validaciones
      if (!formData.currentPassword) {
        throw new Error('Debe ingresar su contraseña actual');
      }

      if (!formData.newPassword) {
        throw new Error('Debe ingresar una nueva contraseña');
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Validar fortaleza de la nueva contraseña
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        setErrors(passwordValidation.errors);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente para cambiar la contraseña.');
      }

      // El usuario ya está autenticado; actualizamos la contraseña directamente en Auth.
      const { error: authUpdateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (authUpdateError) {
        throw new Error(authUpdateError.message || 'No se pudo actualizar la contraseña');
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from('users')
        .update({
          first_login: false // Marcar que ya no es el primer login
        })
        .eq('id', user.id)
        .select('id')
        .limit(1);

      if (updateError || !updatedRows || updatedRows.length === 0) {
        console.warn('No se pudo sincronizar first_login=false desde cliente. Se continuará con el acceso.', updateError);
      }

      alert('✓ ¡Contraseña actualizada correctamente!');
      onPasswordChanged();

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2><FaLock style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Cambio de Contraseña Obligatorio</h2>
          <p>Por seguridad, debes cambiar tu contraseña temporal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.length > 0 && (
            <div className={styles.errorContainer}>
              <h4><FaTimesCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Errores encontrados:</h4>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contraseña Actual */}
          <div className={styles.inputGroup}>
            <label htmlFor="currentPassword">Contraseña Actual *</label>
            <div className={styles.passwordContainer}>
              <input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña temporal"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">Nueva Contraseña *</label>
            <div className={styles.passwordContainer}>
              <input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Crea una contraseña segura"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
            <div className={styles.passwordContainer}>
              <input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          <div className={styles.passwordRequirements}>
            <h4><FaClipboardList style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Requisitos de la contraseña:</h4>
            <ul>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra minúscula</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos un número</li>
              <li>Al menos un símbolo especial</li>
            </ul>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Actualizando...
                </>
              ) : (
                <>
                  <FaShieldAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Cambiar Contraseña
                </>
              )}
            </button>
          </div>
        </form>

        <div className={styles.securityNote}>
          <p>🛡️ <strong>Nota de seguridad:</strong> Tu nueva contraseña será encriptada y almacenada de forma segura. Nunca compartas tus credenciales con terceros.</p>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;