// src/components/admin/AtletasManager.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBroom,
  FaEdit,
  FaEnvelope,
  FaPlus,
  FaTimes,
  FaTrash,
  FaUser,
  FaUsers,
  FaVolleyballBall
} from 'react-icons/fa';
import { communicationsService } from '../../features/communications';
import { athletesService } from '../../features/athletes';
import { userProvisioningService } from '../../features/user-provisioning';
import {
  MIN_ATHLETE_AGE,
  getMaxBirthDateForAge
} from '../../utils/athleteValidation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Field from '../ui/Field';
import SectionHeader from '../ui/SectionHeader';
import { useToast } from '../../contexts/ToastContext';

const PAGE_SIZE = 9;

const CATEGORIAS = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_mujeres',
  'perfeccionamiento_hombres',
  'master_mujeres'
];

const INITIAL_FORM = {
  user_id: '',
  categoria: '',
  fecha_nacimiento: '',
  email: '',
  nombre: '',
  apellido: '',
  telefono: ''
};

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const AtletasManager = ({ user }) => {
  const modalTitleId = 'atleta-modal-title';
  const birthDateHintId = 'fecha-nacimiento-hint';
  const initialFocusRef = useRef(null);

  const [allAtletas, setAllAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { error: showErrorToast } = useToast();

  const maxBirthDate = useMemo(() => getMaxBirthDateForAge(MIN_ATHLETE_AGE), []);

  useEffect(() => {
    loadAtletas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
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

  const filteredAtletas = useMemo(() => {
    return athletesService.filterAndSortAtletas({
      athletes: allAtletas,
      filters,
    });
  }, [allAtletas, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const pagination = useMemo(
    () =>
      athletesService.paginateAtletas({
        athletes: filteredAtletas,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
    [filteredAtletas, currentPage]
  );
  const totalPages = pagination.totalPages;
  const visiblePage = pagination.currentPage;
  const paginatedAtletas = pagination.paginated;

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
      const atletasWithProfiles = await athletesService.loadAtletas();
      setAllAtletas(atletasWithProfiles);
    } catch (error) {
      console.error('Error cargando atletas:', error);
      alert(`Error al cargar los atletas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = athletesService.validateAthleteForm({ formData });
    if (!validation.isValid) {
      alert(`Error: ${validation.error}`);
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
      setErrorMessage(null);
    } catch (error) {
      console.error('Error guardando atleta:', error);

      let userFriendlyMessage = error.message;
      if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        userFriendlyMessage = `El email "${formData.email}" ya esta registrado. Usa uno diferente.`;
      } else if (error.message.includes('ya esta registrado')) {
        userFriendlyMessage = error.message;
      }

      setErrorMessage(userFriendlyMessage);
      showErrorToast(userFriendlyMessage, 7000);
    }
  };

  const createAtleta = async () => {
    if (!formData.email || !formData.email.trim()) {
      throw new Error('El email es requerido para crear el usuario');
    }

    try {
      const result = await userProvisioningService.createStudent({
        email: formData.email.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        fecha_nacimiento: formData.fecha_nacimiento,
        telefono: formData.telefono || null,
        categoria: formData.categoria
      });

      setPendingCredentials({
        email: result.credentials.email,
        password: result.credentials.password,
        loginUrl: result.credentials.loginUrl,
        canLogin: result.canLogin,
        user: result.user,
        message: result.message
      });

      const message = `Estudiante creado exitosamente.\n\nEmail: ${result.credentials.email}\nContrasena temporal: ${result.credentials.password}\nURL de ingreso: ${result.credentials.loginUrl}\n\n${result.canLogin ? 'El usuario puede ingresar inmediatamente.' : 'Puede requerir verificacion de email.'}\n\nImportante: comparte estos datos de forma segura.\n\nDeseas enviar estas credenciales por email ahora?`;
      const shouldSendEmail = globalThis.confirm(message);

      if (shouldSendEmail) {
        await handleSendCredentials();
      }

      return result;
    } catch (error) {
      console.error('Error creando estudiante:', error);
      throw error;
    }
  };

  const handleSendCredentials = async () => {
    if (!pendingCredentials) return;

    const userData = {
      email: pendingCredentials.email,
      nombre: pendingCredentials.user?.nombre || '',
      apellido: pendingCredentials.user?.apellido || '',
      full_name: `${pendingCredentials.user?.nombre || ''} ${pendingCredentials.user?.apellido || ''}`.trim(),
      password: pendingCredentials.password
    };

    try {
      const emailResult = await communicationsService.sendCredentials(userData);

      if (emailResult.success) {
        alert(`Credenciales enviadas exitosamente a ${pendingCredentials.email}`);
        setPendingCredentials(null);
        setErrorMessage(null);
      } else {
        const errorText = `No se pudo enviar el email automaticamente: ${emailResult.error || 'Error desconocido'}. Las credenciales ya fueron mostradas.`;
        console.error('Error enviando email:', emailResult.error || 'Desconocido');
        setErrorMessage(errorText);
        showErrorToast(errorText, 7000);
      }
    } catch (emailError) {
      const errorText = `Error enviando email: ${emailError.message}. Las credenciales ya fueron mostradas.`;
      console.error('Error enviando email:', emailError);
      setErrorMessage(errorText);
      showErrorToast(errorText, 7000);
    }
  };

  const updateAtleta = async () => {
    await athletesService.updateAtleta({
      editingAtleta,
      formData
    });
  };

  const deleteAtleta = async (atleta) => {
    if (!globalThis.confirm(`Estas seguro de eliminar a ${atleta.full_name}?`)) {
      return;
    }

    try {
      const result = await athletesService.deleteAtletaCompletely({ atleta });
      if (result?.userDeletionError) {
        console.warn('Error eliminando usuario relacionado:', result.userDeletionError);
      }

      loadAtletas();
      alert('Atleta y usuario eliminados exitosamente');
    } catch (error) {
      console.error('Error eliminando atleta:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const resendCredentials = async (atleta) => {
    if (!globalThis.confirm(`Deseas reenviar las credenciales de acceso a ${atleta.full_name}?`)) {
      return;
    }

    if (!atleta.user_id || !atleta.users?.email) {
      alert('Datos del atleta incompletos. No se puede reenviar credenciales.');
      return;
    }

    try {
      const result = await userProvisioningService.resendCredentials({
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

      let whatsappResult = { success: false };
      if (userData.telefono) {
        whatsappResult = await userProvisioningService.sendCredentialsByWhatsApp({
          userData,
          password: userData.password,
        });
      }

      const canalesExitosos = [];
      if (result.emailSent) canalesExitosos.push('Email');
      if (whatsappResult.success) canalesExitosos.push('WhatsApp');

      if (canalesExitosos.length > 0) {
        alert(`Nueva contrasena temporal enviada via:\n${canalesExitosos.join('\n')}\n\nEmail: ${result.credentials.email}\nContrasena: ${result.credentials.password}\nURL: ${result.credentials.loginUrl}\n\nImportante: la contrasena anterior ya no funciona.\n\n${result.message}`);
      } else {
        alert(`No se pudo enviar por Email ni WhatsApp.\n\nEmail: ${result.credentials.email}\nContrasena: ${result.credentials.password}\nURL: ${result.credentials.loginUrl}\n\nImportante: la contrasena anterior ya no funciona.\n\n${result.message}\n\nComparte esta informacion manualmente.`);
      }
    } catch (error) {
      console.error('Error reenviando credenciales:', error);
      const message = `Error reenviando credenciales: ${error.message}`;
      showErrorToast(message, 7000);
      alert(message);
    }
  };

  const cleanOrphanUsers = async () => {
    if (!globalThis.confirm('Deseas limpiar usuarios que ya no tienen atletas asociados? Esta accion no se puede deshacer.')) {
      return;
    }

    try {
      const result = await athletesService.cleanOrphanUsers();
      if (!result || (result.deletedCount === 0 && result.failedCount === 0)) {
        alert('No se encontraron usuarios huerfanos');
        return;
      }

      alert(`Limpieza completada: ${result.deletedCount} usuarios eliminados${result.failedCount > 0 ? `, ${result.failedCount} con error` : ''}`);
    } catch (error) {
      console.error('Error limpiando usuarios huerfanos:', error);
      alert(`Error: ${error.message}`);
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
    setErrorMessage(null);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const calculateAge = (birthDate) => athletesService.calculateAthleteAgeDisplay({ birthDate });
  const formatIngresoDate = (atleta) => athletesService.formatIngresoDate({ athlete: atleta });
  const formatCategoria = (categoria) => athletesService.formatCategoria({ categoria });

  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeader
        title="Gestion de Atletas"
        subtitle={`Administrar deportistas del club${user?.email ? ` - Sesion: ${user.email}` : ''}`}
        icon={<FaVolleyballBall />}
        actions={
          <div className="flex w-full flex-col gap-2 mobile:w-auto mobile:flex-row">
            <Button className="w-full mobile:w-auto" onClick={() => openModal()}>
              <FaPlus className="mr-2" /> Agregar Atleta
            </Button>
            <Button variant="outline" className="w-full mobile:w-auto" onClick={cleanOrphanUsers}>
              <FaBroom className="mr-2" /> Limpiar DB
            </Button>
          </div>
        }
      />

      {errorMessage ? (
        <div className="fixed inset-x-0 top-4 z-[11000] mx-auto w-full max-w-3xl px-4">
          <div className="rounded-2xl border border-red-500/60 bg-red-600/95 px-5 py-4 text-sm text-white shadow-xl shadow-red-900/20 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Error</p>
                <p className="mt-1 whitespace-pre-line">{errorMessage}</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                onClick={() => setErrorMessage(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingCredentials ? (
        <Card className="mb-4 border-l-4 border-rv-gold/70 bg-black/20 p-4 text-slate-200">
          <div className="mb-3">
            <p className="font-semibold text-white">Estudiante creado exitosamente.</p>
            <p>{pendingCredentials.message}</p>
          </div>
          <div className="grid gap-2 rounded-xl border border-rv-gold/20 bg-slate-950/50 p-4 text-sm text-slate-100">
            <p>
              <strong>Email:</strong> {pendingCredentials.email}
            </p>
            <p>
              <strong>Contraseña temporal:</strong> {pendingCredentials.password}
            </p>
            <p>
              <strong>URL de ingreso:</strong>{' '}
              <a href={pendingCredentials.loginUrl} className="text-rv-gold underline" target="_blank" rel="noreferrer">
                {pendingCredentials.loginUrl}
              </a>
            </p>
            <p className="text-slate-400">
              Importante: comparte estas credenciales de forma segura. Si deseas enviar el email ahora, haz clic en "Enviar credenciales por email".
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 mobile:flex-row mobile:justify-end">
            <Button className="w-full mobile:w-auto" onClick={handleSendCredentials}>
              Enviar credenciales por email
            </Button>
            <Button variant="secondary" className="w-full mobile:w-auto" onClick={() => setPendingCredentials(null)}>
              Cerrar
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-4 desktop:grid-cols-[minmax(260px,2fr)_repeat(3,minmax(180px,1fr))_auto]">
          <Field label="Busqueda">
            <input
              id="athlete-search"
              type="text"
              placeholder="Buscar por nombre, apellido, categoria o email..."
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Buscar atletas"
            />
          </Field>

          <Field label="Categoria">
            <select
              id="athlete-category-filter"
              value={filters.categoria}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoria: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas las categorias</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {formatCategoria(categoria)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ordenar por">
            <select
              id="athlete-sort-by"
              value={filters.sortBy}
              onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Ordenar por"
            >
              <option value="apellido">Ordenar por apellido</option>
              <option value="nombre">Ordenar por nombre</option>
              <option value="categoria">Ordenar por categoria</option>
              <option value="edad">Ordenar por edad</option>
              <option value="ingreso">Ordenar por fecha de ingreso</option>
            </select>
          </Field>

          <Field label="Direccion">
            <select
              id="athlete-sort-order"
              value={filters.sortOrder}
              onChange={(event) => setFilters((prev) => ({ ...prev, sortOrder: event.target.value }))}
              className={INPUT_BASE}
              aria-label="Direccion de orden"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button id="athlete-clear-filters" type="button" variant="secondary" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <p className="mb-4 text-sm text-slate-200">
        Mostrando {paginatedAtletas.length} de {filteredAtletas.length} atletas.
      </p>

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando atletas...</p>
          </div>
        </Card>
      ) : filteredAtletas.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title="No hay atletas registrados"
          description="Agrega el primer atleta al club"
          action={
            <Button onClick={() => openModal()}>
              <FaPlus className="mr-2" /> Agregar Atleta
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              Página {visiblePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
            >
              Siguiente
            </Button>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {paginatedAtletas.map((atleta) => (
              <Card key={atleta.id} variant="solid" className="flex h-full flex-col border border-rv-gold/30 text-slate-900">
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-bold leading-tight">{atleta.full_name}</h3>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="border-emerald-400/40 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25"
                      onClick={() => openModal(atleta)}
                      title="Editar"
                      aria-label={`Editar atleta ${atleta.full_name}`}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="border-blue-400/40 bg-blue-500/15 text-blue-800 hover:bg-blue-500/25"
                      onClick={() => resendCredentials(atleta)}
                      title="Reenviar credenciales"
                      aria-label={`Reenviar credenciales a ${atleta.full_name}`}
                    >
                      <FaEnvelope />
                    </Button>
                    <Button
                      size="icon"
                      variant="danger"
                      onClick={() => deleteAtleta(atleta)}
                      title="Eliminar"
                      aria-label={`Eliminar atleta ${atleta.full_name}`}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>

                <dl className="grid gap-2 text-sm text-slate-700 mobile:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Categoria</dt>
                    <dd>
                      <span className="inline-flex rounded-md bg-amber-200 px-2 py-1 text-xs font-bold text-amber-950">
                        {formatCategoria(atleta.categoria)}
                      </span>
                    </dd>
                  </div>

                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Edad</dt>
                    <dd>{calculateAge(atleta.fecha_nacimiento)} anos</dd>
                  </div>

                  <div className="flex flex-col gap-1 mobile:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Email</dt>
                    <dd className="break-all">{atleta.email}</dd>
                  </div>

                  <div className="flex flex-col gap-1 mobile:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-[0.7px] text-slate-500">Telefono</dt>
                    <dd className="break-words">{atleta.telefono || '--'}</dd>
                  </div>
                </dl>

                <div className="mt-auto border-t border-slate-200 pt-3 text-center text-xs font-semibold text-slate-500">
                  Ingreso: {formatIngresoDate(atleta)}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              Página {visiblePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeModal}>
          <Card
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-rv-gold/25 pb-3">
              <h3 id={modalTitleId} className="text-lg font-bold text-white mobile:text-xl">
                {editingAtleta ? (
                  <>
                    <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Editar Atleta</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Agregar Nuevo Atleta</span>
                  </>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal">
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
                  <FaUser className="mr-2 inline align-middle" /> Informacion Personal del Usuario
                </h4>

                <div className="grid gap-4 mobile:grid-cols-2">
                  <Field label="Nombre *">
                    <input
                      ref={initialFocusRef}
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                      required
                      placeholder="Ingrese el nombre"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Apellido *">
                    <input
                      id="apellido"
                      type="text"
                      value={formData.apellido}
                      onChange={(event) => setFormData((prev) => ({ ...prev, apellido: event.target.value }))}
                      required
                      placeholder="Ingrese el apellido"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Email *">
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                      required
                      placeholder="ejemplo@email.com"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field label="Telefono">
                    <input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(event) => setFormData((prev) => ({ ...prev, telefono: event.target.value }))}
                      placeholder="09xxxxxxxx"
                      className={INPUT_BASE}
                    />
                  </Field>

                  <Field
                    label="Fecha de Nacimiento *"
                    hint={
                      <>
                        <p id={birthDateHintId}>Edad minima permitida: {MIN_ATHLETE_AGE} anos.</p>
                        {formData.fecha_nacimiento ? (
                          <p className="mt-1 font-semibold text-rv-gold">
                            Edad calculada: {calculateAge(formData.fecha_nacimiento)} anos.
                          </p>
                        ) : null}
                      </>
                    }
                    className="mobile:col-span-2"
                  >
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, fecha_nacimiento: event.target.value }))
                      }
                      max={maxBirthDate}
                      aria-describedby={birthDateHintId}
                      required
                      className={INPUT_BASE}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
                  <FaVolleyballBall className="mr-2 inline align-middle" /> Informacion Deportiva
                </h4>

                <Field label="Categoria *">
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(event) => setFormData((prev) => ({ ...prev, categoria: event.target.value }))}
                    required
                    className={INPUT_BASE}
                  >
                    <option value="">Seleccionar categoria</option>
                    {CATEGORIAS.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {formatCategoria(categoria)}
                      </option>
                    ))}
                  </select>
                </Field>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-rv-gold/20 pt-4 mobile:flex-row mobile:justify-end">
                <Button type="button" variant="secondary" onClick={closeModal} className="w-full mobile:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full mobile:w-auto">
                  {editingAtleta ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
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



