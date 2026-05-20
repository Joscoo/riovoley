// src/features/account-admin/presentation/components/ProfileSettings.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaClipboardList, FaCog, FaEdit, FaExclamationTriangle, FaInfoCircle, FaKey, FaLock } from 'react-icons/fa';
import { accountAdminService } from '../../accountAdminService';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const ProfileSettings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
      const profileResult = await accountAdminService.loadProfileData({ user });
      setUserProfile(profileResult.userProfile);
      setUserData(profileResult.userData);
      setFormData(profileResult.formData);
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos del usuario' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await accountAdminService.updateProfileData({
        user,
        userProfile,
        formData
      });

      setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente' });
      setEditMode(false);
      await loadUserData();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMensaje({ tipo: 'error', texto: `Error al actualizar el perfil: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva Contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las Contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    try {
      const result = await accountAdminService.changePassword({
        user,
        passwordData
      });

      if (!result.ok) {
        setMensaje({ tipo: 'error', texto: result.message });
        setLoading(false);
        return;
      }

      setMensaje({ tipo: 'success', texto: 'Contraseña actualizada correctamente' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Error cambiando Contraseña:', error);
      setMensaje({ tipo: 'error', texto: `Error al cambiar la Contraseña: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <Card>
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
          <p className="text-sm">Cargando configuracion...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Configuracion de Perfil"
        subtitle="Administra tu informacion personal y seguridad"
        icon={<FaCog />}
      />

      {mensaje.texto ? (
        <div
          className={cn(
            'mb-4 rounded-xl border px-4 py-3 text-sm font-semibold',
            mensaje.tipo === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-red-400/40 bg-red-500/15 text-red-200'
          )}
        >
          {mensaje.texto}
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white">
            <FaClipboardList className="mr-2 inline align-middle text-rv-gold" />
            <span className="align-middle">Informacion Personal</span>
          </h3>
          {!editMode ? (
            <Button variant="secondary" onClick={() => setEditMode(true)} className="w-full mobile:w-auto">
              <FaEdit className="mr-2" /> Editar
            </Button>
          ) : null}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-4 mobile:grid-cols-2">
              <Field label="Nombre">
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className={INPUT_BASE} />
              </Field>
              <Field label="Apellido">
                <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required className={INPUT_BASE} />
              </Field>
              <Field label="Telefono">
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className={INPUT_BASE} />
              </Field>
              <Field label="Fecha de Nacimiento">
                <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} className={`${INPUT_BASE} rv-dark-date-input`} />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    nombre: userData?.nombre || '',
                    apellido: userData?.apellido || '',
                    telefono: userData?.telefono || '',
                    fecha_nacimiento: userData?.fecha_nacimiento || ''
                  });
                }}
                className="w-full mobile:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full mobile:w-auto">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            <Card padding="sm" className="bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Email</p>
              <p className="mt-1 break-all text-sm font-semibold text-white">{user?.email}</p>
            </Card>
            <Card padding="sm" className="bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Nombre</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {userData?.nombre || 'No especificado'} {userData?.apellido || ''}
              </p>
            </Card>
            <Card padding="sm" className="bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Telefono</p>
              <p className="mt-1 text-sm font-semibold text-white">{userData?.telefono || 'No especificado'}</p>
            </Card>
            <Card padding="sm" className="bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Fecha de Nacimiento</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {userData?.fecha_nacimiento ? new Date(userData.fecha_nacimiento).toLocaleDateString('es-ES') : 'No especificada'}
              </p>
            </Card>
            <Card padding="sm" className="bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Rol</p>
              <span className="mt-1 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.7px] text-white">
                {userProfile?.role || 'usuario'}
              </span>
            </Card>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <div className="mb-4 border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white">
            <FaLock className="mr-2 inline align-middle text-rv-gold" />
            <span className="align-middle">Seguridad</span>
          </h3>
        </div>

        {!showChangePassword ? (
          <Button variant="outline" onClick={() => setShowChangePassword(true)}>
            <FaKey className="mr-2" /> Cambiar Contraseña
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="rounded-lg border border-amber-300/40 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-100">
              <FaExclamationTriangle className="mr-2 inline align-middle" />
              <span className="align-middle">La Contraseña debe tener al menos 6 caracteres.</span>
            </div>

            <Field label="Contraseña Actual">
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className={INPUT_BASE}
              />
            </Field>

            <Field label="Nueva Contraseña">
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className={INPUT_BASE}
              />
            </Field>

            <Field label="Confirmar Nueva Contraseña">
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className={INPUT_BASE}
              />
            </Field>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full mobile:w-auto"
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
              </Button>
              <Button type="submit" disabled={loading} className="w-full mobile:w-auto">
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <div className="mb-4 border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white">
            <FaInfoCircle className="mr-2 inline align-middle text-rv-gold" />
            <span className="align-middle">Informacion de la Cuenta</span>
          </h3>
        </div>

        <div className="grid gap-3 mobile:grid-cols-2">
          <Card padding="sm" className="bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">ID de Usuario</p>
            <p className="mt-1 break-all text-sm font-semibold text-white">{user?.id}</p>
          </Card>
          <Card padding="sm" className="bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Cuenta Creada</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('es-ES') : 'No disponible'}
            </p>
          </Card>
        </div>
      </Card>
    </div>
  );
};

ProfileSettings.propTypes = {
  user: PropTypes.object.isRequired
};

export default ProfileSettings;



