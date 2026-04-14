// src/components/ChangePasswordModal.js
import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { validatePassword } from '../utils/passwordUtils';
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

      // Cerrar inmediatamente el modal; la sincronización en users se resuelve en paralelo.
      onPasswordChanged();

      supabase
        .from('users')
        .update({ first_login: false })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.warn('No se pudo sincronizar first_login=false desde cliente. Trigger SQL debería cubrir este caso.', error);
          }
        });

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

  const inputBaseClass =
    'w-full rounded-lg border-2 border-slate-400/30 bg-slate-900/80 px-3 py-3 pr-12 text-base text-slate-50 transition-all duration-200 placeholder:text-slate-300/70 focus:border-amber-500/80 focus:bg-slate-900/95 focus:outline-none focus:ring-2 focus:ring-amber-400/30 mobile:text-sm';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(5,8,14,0.85)] p-2 backdrop-blur-[8px] mobile:p-4">
      <div
        className="max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900/95 to-slate-950/95 shadow-[0_24px_70px_rgba(0,0,0,0.55),0_0_40px_rgba(245,158,11,0.15)] mobile:rounded-[24px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <div className="border-b border-amber-500/20 px-4 py-4 text-center mobile:px-8 mobile:py-8">
          <h2 id="change-password-title" className="m-0 mb-2 text-[1.1rem] font-bold text-slate-50 mobile:text-2xl">
            <FaLock className="mr-2 inline-block align-middle mobile:mr-2.5" />
            Cambio de Contrasena Obligatorio
          </h2>
          <p className="m-0 text-sm text-slate-300 mobile:text-base">Por seguridad, debes cambiar tu contrasena temporal</p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 mobile:px-8 mobile:py-8">
          {errors.length > 0 && (
            <div className="mb-6 rounded-xl border border-red-500/45 bg-red-500/15 p-4">
              <h4 className="m-0 mb-2 text-base font-semibold text-red-200">
                <FaTimesCircle className="mr-2 inline-block align-middle" />
                Errores encontrados:
              </h4>
              <ul className="m-0 list-disc pl-6 text-red-200">
                {errors.map((error, index) => (
                  <li key={index} className="mb-1 text-sm last:mb-0">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contraseña Actual */}
          <div className="mb-6">
            <label htmlFor="currentPassword" className="mb-2 block text-[0.95rem] font-semibold uppercase tracking-[0.5px] text-slate-50">
              Contrasena Actual *
            </label>
            <div className="relative flex items-center">
              <input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña temporal"
                className={inputBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-2 z-[1] flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-slate-300 transition-all duration-200 hover:bg-amber-500/20 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Ocultar contrasena actual' : 'Mostrar contrasena actual'}
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="mb-6">
            <label htmlFor="newPassword" className="mb-2 block text-[0.95rem] font-semibold uppercase tracking-[0.5px] text-slate-50">
              Nueva Contrasena *
            </label>
            <div className="relative flex items-center">
              <input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Crea una contraseña segura"
                className={inputBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-2 z-[1] flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-slate-300 transition-all duration-200 hover:bg-amber-500/20 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Ocultar nueva contrasena' : 'Mostrar nueva contrasena'}
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="mb-2 block text-[0.95rem] font-semibold uppercase tracking-[0.5px] text-slate-50">
              Confirmar Nueva Contrasena *
            </label>
            <div className="relative flex items-center">
              <input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                className={inputBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-2 z-[1] flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-slate-300 transition-all duration-200 hover:bg-amber-500/20 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Ocultar confirmacion de contrasena' : 'Mostrar confirmacion de contrasena'}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          <div className="mb-6 rounded-xl border border-slate-400/25 bg-slate-900/60 p-4">
            <h4 className="m-0 mb-3 text-[0.95rem] font-semibold text-slate-50">
              <FaClipboardList className="mr-2 inline-block align-middle" />
              Requisitos de la contrasena:
            </h4>
            <ul className="m-0 list-disc pl-5 text-[0.85rem] text-slate-300">
              <li className="mb-1">Minimo 8 caracteres</li>
              <li className="mb-1">Al menos una letra minuscula</li>
              <li className="mb-1">Al menos una letra mayuscula</li>
              <li className="mb-1">Al menos un numero</li>
              <li className="mb-0">Al menos un simbolo especial</li>
            </ul>
          </div>

          <div className="mb-4 flex justify-center">
            <button
              type="submit"
              className="rv-touch-target w-full rounded-lg border-0 bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-3 text-base font-semibold text-slate-900 shadow-[0_8px_24px_rgba(217,119,6,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(217,119,6,0.45)] disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none mobile:max-w-none tablet:max-w-[320px]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="mr-2 inline-block animate-spin align-middle" /> Actualizando...
                </>
              ) : (
                <>
                  <FaShieldAlt className="mr-2 inline-block align-middle" /> Cambiar Contrasena
                </>
              )}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-400/20 bg-slate-900/50 px-4 py-4 mobile:px-8 mobile:pb-8">
          <p className="m-0 text-center text-xs leading-[1.4] text-slate-300 mobile:text-[0.85rem]">
            <strong>Nota de seguridad:</strong> Tu nueva contrasena sera encriptada y almacenada de forma segura. Nunca compartas tus credenciales con terceros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;