// src/components/admin/EntrenadoresManager.js
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaCheckCircle,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaUserTie,
  FaUsers
} from 'react-icons/fa';
import { trainerManagementService } from '../../features/trainer-management';
import { cn } from '../../lib/cn';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Field from '../ui/Field';
import SectionHeader from '../ui/SectionHeader';

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: ''
};

const EntrenadoresManager = ({ user }) => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntrenador, setEditingEntrenador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadEntrenadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    globalThis.setTimeout(() => {
      setMessage((current) => (current.text === text ? { type: '', text: '' } : current));
    }, 4500);
  };

  const loadEntrenadores = async () => {
    setLoading(true);
    try {
      const data = await trainerManagementService.loadEntrenadores();
      setEntrenadores(data || []);
    } catch (error) {
      console.error('Error cargando entrenadores:', error);
      showMessage('error', `Error al cargar entrenadores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingEntrenador(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const { mode, userResult } = await trainerManagementService.saveEntrenador({
        editingEntrenador,
        formData
      });

      if (mode === 'updated') {
        showMessage('success', 'Entrenador actualizado correctamente');
      } else {
        const credentialsMessage = `Entrenador creado exitosamente.\n\nEmail: ${userResult.credentials.email}\nContrasena temporal: ${userResult.credentials.password}\nURL de ingreso: ${userResult.credentials.loginUrl}\n\n${userResult.canLogin ? 'Login verificado: puede iniciar sesion de inmediato.' : 'Puede requerir confirmacion de email.'}\n\nDeseas copiar las credenciales al portapapeles?`;

        if (globalThis.confirm(credentialsMessage)) {
          const credentialsText = `Email: ${userResult.credentials.email}\nContrasena: ${userResult.credentials.password}\nURL: ${userResult.credentials.loginUrl}`;
          navigator.clipboard
            .writeText(credentialsText)
            .then(() => showMessage('success', 'Credenciales copiadas al portapapeles'))
            .catch(() => showMessage('error', 'No se pudieron copiar las credenciales automaticamente'));
        }
      }

      closeModal();
      loadEntrenadores();
    } catch (error) {
      console.error('Error guardando entrenador:', error);

      if (error.message.includes('ya esta registrado')) {
        showMessage('error', `El email "${formData.email}" ya esta registrado. Usa un email diferente.`);
        return;
      }

      showMessage('error', `Error al guardar entrenador: ${error.message}`);
    }
  };

  const handleDelete = async (entrenadorId) => {
    if (!globalThis.confirm('Estas seguro de eliminar este entrenador?')) {
      return;
    }

    try {
      await trainerManagementService.deleteEntrenador({ trainerId: entrenadorId });
      showMessage('success', 'Entrenador eliminado correctamente');
      loadEntrenadores();
    } catch (error) {
      console.error('Error eliminando entrenador:', error);
      showMessage('error', `Error al eliminar entrenador: ${error.message}`);
    }
  };

  const filteredEntrenadores = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return entrenadores;

    return entrenadores.filter((entrenador) => {
      return (
        entrenador.nombre?.toLowerCase().includes(search) ||
        entrenador.apellido?.toLowerCase().includes(search) ||
        entrenador.email?.toLowerCase().includes(search)
      );
    });
  }, [entrenadores, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Entrenadores"
        subtitle="Administra el equipo tecnico, actualiza datos y registra nuevos perfiles."
        icon={<FaUserTie />}
        actions={
          <Button className="w-full mobile:w-auto" onClick={() => openModal()}>
            <FaPlus className="mr-2" /> Nuevo Entrenador
          </Button>
        }
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

      <Card className="mb-4">
        <div className="grid gap-3 mobile:grid-cols-[minmax(0,1fr)_auto] mobile:items-end">
          <Field label="Buscar entrenadores">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nombre, apellido o email"
              className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
          </Field>

          <div className="inline-flex min-h-12 items-center rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100">
            {filteredEntrenadores.length} entrenador{filteredEntrenadores.length === 1 ? '' : 'es'}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando entrenadores...</p>
          </div>
        </Card>
      ) : filteredEntrenadores.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title={searchTerm ? 'No se encontraron entrenadores' : 'No hay entrenadores registrados'}
          description={
            searchTerm
              ? 'Prueba con otro termino de busqueda para ubicar al entrenador.'
              : 'Crea el primer entrenador para empezar a gestionar el equipo.'
          }
          action={
            !searchTerm ? (
              <Button onClick={() => openModal()}>
                <FaPlus className="mr-2" /> Crear Entrenador
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {filteredEntrenadores.map((entrenador) => (
            <Card key={entrenador.id} className="flex h-full flex-col gap-4">
              <div className="border-b border-white/10 pb-3">
                <p className="text-lg font-bold text-white">
                  {entrenador.nombre} {entrenador.apellido}
                </p>
                <p className="mt-1 break-all text-sm text-slate-300">{entrenador.email}</p>
              </div>

              <dl className="space-y-2 text-sm text-slate-200">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Telefono</dt>
                  <dd className="break-words">{entrenador.telefono || 'N/A'}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Nacimiento</dt>
                  <dd>{formatDate(entrenador.fecha_nacimiento)}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Ultimo login</dt>
                  <dd>{formatDateTime(entrenador.last_login)}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <dt className="font-semibold text-slate-300">Registro</dt>
                  <dd>{formatDate(entrenador.created_at)}</dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => openModal(entrenador)}
                  aria-label={`Editar entrenador ${entrenador.nombre} ${entrenador.apellido}`}
                >
                  <FaEdit className="mr-2" /> Editar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDelete(entrenador.id)}
                  aria-label={`Eliminar entrenador ${entrenador.nombre} ${entrenador.apellido}`}
                >
                  <FaTrash className="mr-2" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <Card
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white mobile:text-xl">
                {editingEntrenador ? (
                  <>
                    <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Editar Entrenador</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Nuevo Entrenador</span>
                  </>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal de entrenador">
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 mobile:grid-cols-2">
                <Field label="Nombre *">
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>

                <Field label="Apellido *">
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(event) => setFormData((prev) => ({ ...prev, apellido: event.target.value }))}
                    required
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>
              </div>

              <Field
                label="Email *"
                hint={
                  editingEntrenador
                    ? 'El email no puede ser modificado.'
                    : 'Se generara una contrasena temporal automaticamente.'
                }
              >
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  disabled={Boolean(editingEntrenador)}
                  className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>

              <div className="grid gap-4 mobile:grid-cols-2">
                <Field label="Telefono">
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(event) => setFormData((prev) => ({ ...prev, telefono: event.target.value }))}
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>

                <Field label="Fecha de Nacimiento">
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(event) => setFormData((prev) => ({ ...prev, fecha_nacimiento: event.target.value }))}
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                  />
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
                <Button type="button" variant="secondary" onClick={closeModal} className="w-full mobile:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full mobile:w-auto">
                  {editingEntrenador ? (
                    <>
                      <FaSave className="mr-2" /> Actualizar
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" /> Registrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

EntrenadoresManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default EntrenadoresManager;
