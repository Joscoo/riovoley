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
import WhatsAppBusinessService from '../../services/whatsappBusinessService';
import { athletesService } from '../../features/athletes';
import { userProvisioningService } from '../../features/user-provisioning';
import {
  MIN_ATHLETE_AGE,
  calculateAgeFromDate,
  getMaxBirthDateForAge,
  validateAthleteBirthDate
} from '../../utils/athleteValidation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Field from '../ui/Field';
import SectionHeader from '../ui/SectionHeader';

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
  const [whatsAppBusiness] = useState(new WhatsAppBusinessService());
  const [filters, setFilters] = useState({
    categoria: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);

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
    const normalizeText = (value = '') =>
      value
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

    if (filters.categoria) {
      result = result.filter((atleta) => atleta.categoria === filters.categoria);
    }

    if (filters.search) {
      const searchLower = normalizeText(filters.search);
      result = result.filter((atleta) => {
        return (
          normalizeText(atleta.full_name).includes(searchLower) ||
          normalizeText(atleta.users?.nombre).includes(searchLower) ||
          normalizeText(atleta.users?.apellido).includes(searchLower) ||
          normalizeText(atleta.categoria).includes(searchLower) ||
          normalizeText(atleta.email).includes(searchLower)
        );
      });
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredAtletas.length / PAGE_SIZE));
  const paginatedAtletas = filteredAtletas.slice(
    (currentPage - 1) * PAGE_SIZE,
    (currentPage - 1) * PAGE_SIZE + PAGE_SIZE
  );

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

    if (!formData.categoria) {
      alert('Error: La categoria deportiva es requerida para el atleta');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Error: Por favor ingrese un email valido');
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

      let errorMessage = error.message;
      if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        errorMessage = `El email "${formData.email}" ya esta registrado. Usa uno diferente.`;
      } else if (error.message.includes('ya esta registrado')) {
        errorMessage = error.message;
      }

      alert(errorMessage);
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

      const message = `Estudiante creado exitosamente.\n\nEmail: ${result.credentials.email}\nContrasena temporal: ${result.credentials.password}\nURL de ingreso: ${result.credentials.loginUrl}\n\n${result.canLogin ? 'El usuario puede ingresar inmediatamente.' : 'Puede requerir verificacion de email.'}\n\nImportante: comparte estos datos de forma segura.\n\nDeseas enviar estas credenciales por email?`;

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

          const emailResult = await communicationsService.sendCredentials(userData);

          if (emailResult.success) {
            alert(`Credenciales enviadas exitosamente a ${result.credentials.email}`);
          } else {
            alert('No se pudo enviar el email automaticamente. Las credenciales ya fueron mostradas.');
          }
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
          alert(`Error enviando email: ${emailError.message}. Las credenciales ya fueron mostradas.`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error creando estudiante:', error);
      throw error;
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
        whatsappResult = await whatsAppBusiness.sendCredentials(userData, userData.password);
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
      alert(`Error: ${error.message}`);
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
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '--';

    try {
      const age = calculateAgeFromDate(birthDate);
      if (age === null || age < 0) return '--';
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
        if (!Number.isNaN(date.getTime())) {
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
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
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
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
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
