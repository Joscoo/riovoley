// src/components/admin/UsuariosManager.js
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBan,
  FaCalendar,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaCrown,
  FaEdit,
  FaPause,
  FaPhone,
  FaPlay,
  FaRunning,
  FaStickyNote,
  FaTrash,
  FaUser,
  FaUsers,
  FaVolleyballBall
} from 'react-icons/fa';
import { accountAdminService } from '../../features/account-admin';
import { cn } from '../../lib/cn';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Field from '../ui/Field';
import SectionHeader from '../ui/SectionHeader';

const INITIAL_FORM = {
  role: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  suspended: false,
  suspension_reason: '',
  suspension_until: ''
};

const ROLE_CONFIG = [
  { value: 'administrador', label: 'Administrador', icon: <FaCrown />, color: 'text-amber-300' },
  { value: 'entrenador', label: 'Entrenador', icon: <FaVolleyballBall />, color: 'text-indigo-300' },
  { value: 'estudiante', label: 'Estudiante', icon: <FaRunning />, color: 'text-emerald-300' }
];

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
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    globalThis.setTimeout(() => {
      setMessage((current) => (current.text === text ? { type: '', text: '' } : current));
    }, 4500);
  };

  const loadUsuarios = async () => {
    setLoading(true);

    try {
      const filteredData = await accountAdminService.loadUsuarios({ filters });
      setUsuarios(filteredData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showMessage('error', `Error al cargar usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingUser(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openModal = (usuarioEntry) => {
    setEditingUser(usuarioEntry);
    setFormData({
      role: usuarioEntry.role || '',
      nombre: usuarioEntry.nombre || '',
      apellido: usuarioEntry.apellido || '',
      email: usuarioEntry.email || '',
      telefono: usuarioEntry.telefono || '',
      suspended: Boolean(usuarioEntry.suspended),
      suspension_reason: usuarioEntry.suspension_reason || '',
      suspension_until: usuarioEntry.suspension_until || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      await accountAdminService.updateManagedUser({
        editingUser,
        formData
      });

      showMessage('success', `${editingUser.email} actualizado. Debe reiniciar sesion para ver cambios de rol.`);
      closeModal();
      loadUsuarios();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      showMessage('error', `Error al actualizar usuario: ${error.message}`);
    }
  };

  const deleteUser = async (usuarioEntry) => {
    const confirmed = globalThis.confirm(
      `Estas seguro de eliminar al usuario ${usuarioEntry.nombre} ${usuarioEntry.apellido}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await accountAdminService.deleteManagedUser({ userId: usuarioEntry.id });

      showMessage('success', 'Usuario eliminado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      showMessage('error', `Error al eliminar usuario: ${error.message}`);
    }
  };

  const suspendUser = async (usuarioEntry, suspensionData) => {
    try {
      await accountAdminService.suspendManagedUser({
        userId: usuarioEntry.id,
        reason: suspensionData.reason,
        until: suspensionData.until
      });

      showMessage('success', 'Usuario suspendido temporalmente');
      loadUsuarios();
    } catch (error) {
      console.error('Error suspendiendo usuario:', error);
      showMessage('error', `Error al suspender usuario: ${error.message}`);
    }
  };

  const reactivateUser = async (usuarioEntry) => {
    const confirmed = globalThis.confirm(`Reactivar la cuenta de ${usuarioEntry.nombre} ${usuarioEntry.apellido}?`);
    if (!confirmed) {
      return;
    }

    try {
      await accountAdminService.reactivateManagedUser({ userId: usuarioEntry.id });

      showMessage('success', 'Usuario reactivado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error reactivando usuario:', error);
      showMessage('error', `Error al reactivar usuario: ${error.message}`);
    }
  };

  const handleSuspensionToggle = (usuarioEntry) => {
    if (usuarioEntry.suspended) {
      reactivateUser(usuarioEntry);
      return;
    }

    const reason = globalThis.prompt('Motivo de la suspension:');
    if (!reason) return;

    const until = globalThis.prompt('Fecha de finalizacion (YYYY-MM-DD) o vacio para indefinido:');

    suspendUser(usuarioEntry, {
      reason,
      until: until || null
    });
  };

  const getRoleInfo = (role) => {
    return ROLE_CONFIG.find((entry) => entry.value === role) || {
      value: role,
      label: role,
      icon: <FaUser />,
      color: 'text-slate-200'
    };
  };

  const roleStats = useMemo(() => {
    const stats = {};
    ROLE_CONFIG.forEach((role) => {
      stats[role.value] = usuarios.filter((usuarioEntry) => usuarioEntry.role === role.value).length;
    });
    return stats;
  }, [usuarios]);

  const statusStats = useMemo(() => {
    const totalUsuarios = usuarios.length;
    const suspendidos = usuarios.filter((usuarioEntry) => usuarioEntry.suspended).length;
    return {
      totalUsuarios,
      activos: totalUsuarios - suspendidos,
      suspendidos
    };
  }, [usuarios]);

  const formatShortDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('es-ES');
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'administrador':
        return 'Acceso completo al sistema';
      case 'entrenador':
        return 'Gestion de entrenamientos y atletas';
      case 'estudiante':
        return 'Acceso basico como atleta';
      default:
        return 'Usuario del sistema';
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Usuarios"
        subtitle="Administra roles, estado de cuenta y datos basicos de todos los usuarios."
        icon={<FaUsers />}
      />

      {message.text ? (
        <div
          className={cn(
            'mb-4 rounded-xl border px-4 py-3 text-sm font-semibold',
            message.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-red-400/40 bg-red-500/15 text-red-200'
          )}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 mobile:grid-cols-2 desktop:grid-cols-3">
        {ROLE_CONFIG.map((role) => (
          <Card key={role.value} className="flex items-center gap-3">
            <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl', role.color)}>
              {role.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-white">{roleStats[role.value] || 0}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">{role.label}s</p>
            </div>
          </Card>
        ))}

        <Card className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl text-cyan-200">
            <FaChartBar />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{statusStats.totalUsuarios}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Total Usuarios</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl text-emerald-200">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{statusStats.activos}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Activos</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl text-amber-200">
            <FaBan />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{statusStats.suspendidos}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-slate-300">Suspendidos</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-3">
          <Field label="Filtrar por rol">
            <select
              value={filters.role}
              onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            >
              <option value="">Todos los roles</option>
              {ROLE_CONFIG.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Buscar usuario">
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Nombre, apellido o email"
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
          </Field>

          <Field label="Estado">
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="suspendido">Suspendidos</option>
            </select>
          </Field>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        </Card>
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title="No hay usuarios encontrados"
          description="No se encontraron usuarios con los filtros aplicados."
        />
      ) : (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {usuarios.map((usuarioEntry) => {
            const roleInfo = getRoleInfo(usuarioEntry.role);
            const suspended = Boolean(usuarioEntry.suspended);

            return (
              <Card
                key={usuarioEntry.id}
                className={cn(
                  'flex h-full flex-col gap-4 border',
                  suspended ? 'border-amber-300/45 bg-amber-500/10' : 'border-white/15'
                )}
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div
                      className={cn(
                        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl',
                        suspended ? 'text-amber-200' : roleInfo.color
                      )}
                    >
                      {suspended ? <FaPause /> : roleInfo.icon}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white">
                        {usuarioEntry.nombre} {usuarioEntry.apellido}
                      </p>
                      <p className="break-all text-sm text-slate-300">{usuarioEntry.email}</p>
                      <span
                        className={cn(
                          'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.7px]',
                          suspended ? 'bg-amber-500/25 text-amber-100' : 'bg-white/10 text-white'
                        )}
                      >
                        {suspended ? 'Suspendido' : roleInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => openModal(usuarioEntry)}
                      aria-label={`Editar usuario ${usuarioEntry.nombre} ${usuarioEntry.apellido}`}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant={suspended ? 'outline' : 'ghost'}
                      size="icon"
                      onClick={() => handleSuspensionToggle(usuarioEntry)}
                      aria-label={
                        suspended
                          ? `Reactivar usuario ${usuarioEntry.nombre} ${usuarioEntry.apellido}`
                          : `Suspender usuario ${usuarioEntry.nombre} ${usuarioEntry.apellido}`
                      }
                    >
                      {suspended ? <FaPlay /> : <FaPause />}
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      onClick={() => deleteUser(usuarioEntry)}
                      aria-label={`Eliminar usuario ${usuarioEntry.nombre} ${usuarioEntry.apellido}`}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>

                <dl className="space-y-2 text-sm text-slate-200">
                  {usuarioEntry.telefono ? (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <dt className="font-semibold text-slate-300">
                        <FaPhone className="mr-1 inline align-middle" /> Telefono
                      </dt>
                      <dd className="break-words">{usuarioEntry.telefono}</dd>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-semibold text-slate-300">
                      <FaCalendar className="mr-1 inline align-middle" /> Registro
                    </dt>
                    <dd>{formatShortDate(usuarioEntry.created_at)}</dd>
                  </div>

                  {usuarioEntry.last_login ? (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <dt className="font-semibold text-slate-300">
                        <FaClock className="mr-1 inline align-middle" /> Ultimo acceso
                      </dt>
                      <dd>{formatShortDate(usuarioEntry.last_login)}</dd>
                    </div>
                  ) : null}

                  {suspended ? (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <dt className="font-semibold text-slate-300">
                        <FaPause className="mr-1 inline align-middle" /> Estado
                      </dt>
                      <dd className="font-semibold text-amber-100">
                        Suspendido
                        {usuarioEntry.suspension_until
                          ? ` hasta ${formatShortDate(usuarioEntry.suspension_until)}`
                          : ''}
                      </dd>
                    </div>
                  ) : null}

                  {usuarioEntry.suspension_reason ? (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <dt className="font-semibold text-slate-300">
                        <FaStickyNote className="mr-1 inline align-middle" /> Motivo
                      </dt>
                      <dd className="italic text-amber-50">{usuarioEntry.suspension_reason}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && editingUser ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white mobile:text-xl">
                <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                <span className="align-middle">Editar Usuario</span>
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal de usuario">
                <span className="text-lg leading-none">x</span>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">Informacion Personal</h4>

                <div className="grid gap-4 mobile:grid-cols-2">
                  <Field label="Nombre">
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                      className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      placeholder="Nombre del usuario"
                    />
                  </Field>

                  <Field label="Apellido">
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(event) => setFormData((prev) => ({ ...prev, apellido: event.target.value }))}
                      className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      placeholder="Apellido del usuario"
                    />
                  </Field>

                  <Field label="Email" hint="Solo lectura">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="min-h-12 w-full cursor-not-allowed rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-slate-300 opacity-80"
                    />
                  </Field>

                  <Field label="Telefono">
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(event) => setFormData((prev) => ({ ...prev, telefono: event.target.value }))}
                      className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      placeholder="Numero de telefono"
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">Rol y Permisos</h4>

                <div className="grid gap-3 mobile:grid-cols-2">
                  {ROLE_CONFIG.map((role) => {
                    const selected = formData.role === role.value;
                    return (
                      <label key={role.value} className="block cursor-pointer" aria-label={`Seleccionar rol ${role.label}`}>
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={selected}
                          onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'rounded-xl border p-4 transition',
                            selected
                              ? 'border-rv-gold bg-rv-gold/15 ring-2 ring-rv-gold/50'
                              : 'border-white/20 bg-black/25 hover:border-white/35'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn('text-2xl', role.color)}>{role.icon}</span>
                            <div>
                              <p className="font-bold text-white">{role.label}</p>
                              <p className="text-xs text-slate-300">{getRoleDescription(role.value)}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
                <Button type="button" variant="secondary" className="w-full mobile:w-auto" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="w-full mobile:w-auto">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

UsuariosManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default UsuariosManager;
