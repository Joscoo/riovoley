import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trainerManagementService } from '../../trainerManagementService';
import { SORT_DIRECTION, createTableQuery } from '../../../../shared/lib/tableQuery';

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
};

const EMPTY_MESSAGE = { type: '', text: '' };

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  sortBy: 'apellido',
  sortOrder: 'asc',
};

const buildTrainersQuery = ({ filters }) =>
  createTableQuery({
    filters: {
      search: filters?.search || '',
      status: filters?.status || 'all',
    },
    sort: {
      field: filters?.sortBy || 'apellido',
      direction: filters?.sortOrder === 'desc' ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
    },
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

export const useEntrenadoresManager = () => {
  const timeoutRef = useRef(null);

  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntrenador, setEditingEntrenador] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState(EMPTY_MESSAGE);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, trainerId: null });

  const clearMessageTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showMessage = useCallback((type, text) => {
    clearMessageTimer();
    setMessage({ type, text });
    timeoutRef.current = setTimeout(() => {
      setMessage((current) => (current.text === text ? EMPTY_MESSAGE : current));
      timeoutRef.current = null;
    }, 4500);
  }, [clearMessageTimer]);

  useEffect(() => () => clearMessageTimer(), [clearMessageTimer]);

  const loadEntrenadores = useCallback(async ({ currentFilters } = {}) => {
    setLoading(true);
    try {
      const data = await trainerManagementService.loadEntrenadores({
        query: buildTrainersQuery({ filters: currentFilters || filters }),
      });
      setEntrenadores(data || []);
    } catch (error) {
      console.error('Error cargando entrenadores:', error);
      showMessage('error', `Error al cargar entrenadores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, showMessage]);

  useEffect(() => {
    loadEntrenadores({ currentFilters: filters });
  }, [filters, loadEntrenadores]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setEditingEntrenador(null);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  const openModal = useCallback((entrenador = null) => {
    if (entrenador) {
      setEditingEntrenador(entrenador);
      setFormData({
        nombre: entrenador.nombre || '',
        apellido: entrenador.apellido || '',
        email: entrenador.email || '',
        telefono: entrenador.telefono || '',
        fecha_nacimiento: entrenador.fecha_nacimiento || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  }, [resetForm]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    try {
      const { mode, userResult } = await trainerManagementService.saveEntrenador({
        editingEntrenador,
        formData,
      });

      if (mode === 'updated') {
        showMessage('success', 'Entrenador actualizado correctamente');
      } else {
        showMessage('success', 'Entrenador creado correctamente');
        setPendingCredentials({
          email: userResult.credentials.email,
          password: userResult.credentials.password,
          loginUrl: userResult.credentials.loginUrl,
          canLogin: userResult.canLogin,
        });
      }

      closeModal();
      await loadEntrenadores();
    } catch (error) {
      console.error('Error guardando entrenador:', error);

      if (error.message.includes('ya esta registrado')) {
        showMessage('error', `El email "${formData.email}" ya esta registrado. Usa un email diferente.`);
        return;
      }

      showMessage('error', `Error al guardar entrenador: ${error.message}`);
    }
  }, [closeModal, editingEntrenador, formData, loadEntrenadores, showMessage]);

  const copyPendingCredentials = useCallback(async () => {
    if (!pendingCredentials) return;

    const credentialsText = [
      `Email: ${pendingCredentials.email}`,
      `Contraseña: ${pendingCredentials.password}`,
      `URL: ${pendingCredentials.loginUrl}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(credentialsText);
      showMessage('success', 'Credenciales copiadas al portapapeles');
    } catch {
      showMessage('error', 'No se pudieron copiar las credenciales automaticamente');
    }
  }, [pendingCredentials, showMessage]);

  const closeCredentialsCard = useCallback(() => {
    setPendingCredentials(null);
  }, []);

  const requestDelete = useCallback((trainerId) => {
    setDeleteDialog({ open: true, trainerId });
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteDialog({ open: false, trainerId: null });
  }, []);

  const confirmDelete = useCallback(async () => {
    const trainerId = deleteDialog.trainerId;
    cancelDelete();
    if (!trainerId) return;

    try {
      await trainerManagementService.deleteEntrenador({ trainerId });
      showMessage('success', 'Entrenador eliminado correctamente');
      await loadEntrenadores();
    } catch (error) {
      console.error('Error eliminando entrenador:', error);
      showMessage('error', `Error al eliminar entrenador: ${error.message}`);
    }
  }, [cancelDelete, deleteDialog.trainerId, loadEntrenadores, showMessage]);

  const filteredEntrenadores = useMemo(() => entrenadores, [entrenadores]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    loading,
    showModal,
    editingEntrenador,
    filters,
    setFilters,
    resetFilters,
    formData,
    setFormData,
    message,
    pendingCredentials,
    deleteDialog,
    filteredEntrenadores,
    openModal,
    closeModal,
    handleSubmit,
    copyPendingCredentials,
    closeCredentialsCard,
    requestDelete,
    cancelDelete,
    confirmDelete,
    formatDate,
    formatDateTime,
  };
};

export default useEntrenadoresManager;

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);
