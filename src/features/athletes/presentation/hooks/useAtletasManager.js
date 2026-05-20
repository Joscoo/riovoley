import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { athletesService } from '../../athletesService';
import { userProvisioningService } from '../../../user-provisioning';
import { MIN_ATHLETE_AGE, getMaxBirthDateForAge } from '../../../../utils/athleteValidation';
import { SORT_DIRECTION, createTableQuery } from '../../../../shared/lib/tableQuery';
import { useToast } from '../../../../contexts/ToastContext';
import { useAthleteCredentials } from './useAthleteCredentials';

const PAGE_SIZE = 9;

const INITIAL_FORM = {
  user_id: '',
  categoria: '',
  fecha_nacimiento: '',
  email: '',
  nombre: '',
  apellido: '',
  telefono: '',
};

const toFriendlyError = (error, email) => {
  if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
    return `El email "${email}" ya esta registrado. Usa uno diferente.`;
  }

  return error.message;
};

const buildAthletesQuery = ({ filters }) =>
  createTableQuery({
    filters: {
      categoria: filters?.categoria || '',
    },
    sort: {
      field: null,
      direction: SORT_DIRECTION.NONE,
    },
    pagination: {
      page: 1,
      pageSize: PAGE_SIZE,
    },
  });

export const useAtletasManager = ({ categories }) => {
  const initialFocusRef = useRef(null);
  const confirmActionRef = useRef(null);

  const [allAtletas, setAllAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [sendCredentialsOnCreate, setSendCredentialsOnCreate] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    tone: 'danger',
  });

  const [actionResult, setActionResult] = useState(null);

  const {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
  } = useToast();

  const {
    pendingCredentials,
    credentialsReport,
    setPendingCredentialsFromCreation,
    clearPendingCredentials,
    clearCredentialsReport,
    sendPendingCredentialsByEmail,
    resendCredentialsForAthlete,
  } = useAthleteCredentials({
    onError: (message) => {
      setErrorMessage(message);
      showErrorToast(message, 7000);
    },
    onSuccess: (message) => {
      showSuccessToast(message, 5000);
    },
  });

  const maxBirthDate = useMemo(() => getMaxBirthDateForAge(MIN_ATHLETE_AGE), []);

  const filteredAtletas = useMemo(
    () =>
      athletesService.filterAndSortAtletas({
        athletes: allAtletas,
        filters,
      }),
    [allAtletas, filters]
  );

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

  const loadAtletas = useCallback(async ({ currentFilters } = {}) => {
    setLoading(true);

    try {
      const atletasWithProfiles = await athletesService.loadAtletas({
        query: buildAthletesQuery({ filters: currentFilters || {} }),
      });
      setAllAtletas(atletasWithProfiles);
    } catch (error) {
      const message = `Error al cargar los atletas: ${error.message}`;
      setErrorMessage(message);
      showErrorToast(message, 7000);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    loadAtletas({ currentFilters: filters });
  }, [filters.categoria, loadAtletas]);

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

  useEffect(() => {
    if (credentialsReport) {
      setActionResult(credentialsReport);
    }
  }, [credentialsReport]);

  const resetFilters = useCallback(() => {
    setFilters({
      categoria: '',
      search: '',
      sortBy: 'apellido',
      sortOrder: 'asc',
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
  }, []);

  const openModal = useCallback((atleta = null) => {
    if (atleta) {
      setEditingAtleta(atleta);
      setSendCredentialsOnCreate(false);
      setFormData({
        user_id: atleta.user_id,
        categoria: atleta.categoria || '',
        fecha_nacimiento: atleta.fecha_nacimiento || '',
        email: atleta.users?.email || '',
        nombre: atleta.users?.nombre || '',
        apellido: atleta.users?.apellido || '',
        telefono: atleta.users?.telefono || '',
      });
    } else {
      setEditingAtleta(null);
      setSendCredentialsOnCreate(false);
      resetForm();
    }

    setShowModal(true);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setErrorMessage(null);
  }, []);

  const openConfirmDialog = useCallback(({ title, message, confirmLabel = 'Confirmar', tone = 'danger', onConfirm }) => {
    confirmActionRef.current = onConfirm;
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel,
      tone,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    confirmActionRef.current = null;
  }, []);

  const confirmDialogAction = useCallback(async () => {
    const action = confirmActionRef.current;
    closeConfirmDialog();
    if (action) {
      await action();
    }
  }, [closeConfirmDialog]);

  const closeActionResult = useCallback(() => {
    setActionResult(null);
    clearCredentialsReport();
  }, [clearCredentialsReport]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    let createdEmail = '';

    const validation = athletesService.validateAthleteForm({ formData });
    if (!validation.isValid) {
      const message = `Error: ${validation.error}`;
      setErrorMessage(message);
      showErrorToast(message, 7000);
      return;
    }

    try {
      if (editingAtleta) {
        await athletesService.updateAtleta({
          editingAtleta,
          formData,
        });
        showSuccessToast('Estudiante actualizado correctamente.', 5000);
      } else {
        createdEmail = formData.email?.trim() || '';
        if (!createdEmail) {
          throw new Error('El email es requerido para crear el usuario');
        }

        const result = await userProvisioningService.createStudent({
          email: createdEmail,
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          fecha_nacimiento: formData.fecha_nacimiento,
          telefono: formData.telefono || null,
          categoria: formData.categoria,
        });

        setPendingCredentialsFromCreation(result);
        showSuccessToast('Estudiante creado exitosamente.', 5000);
        if (sendCredentialsOnCreate) {
          await sendPendingCredentialsByEmail();
        } else {
          showInfoToast('Puedes enviar las credenciales ahora o despues desde la tarjeta informativa.', 5500);
        }
      }

      closeModal();
      resetForm();
      setErrorMessage(null);
      await loadAtletas();

    } catch (error) {
      const message = toFriendlyError(error, formData.email);
      setErrorMessage(message);
      showErrorToast(message, 7000);
    }
  }, [
    closeModal,
    editingAtleta,
    formData,
    loadAtletas,
    resetForm,
    sendCredentialsOnCreate,
    sendPendingCredentialsByEmail,
    setPendingCredentialsFromCreation,
    showErrorToast,
    showInfoToast,
    showSuccessToast,
  ]);

  const handleSendCredentials = useCallback(async () => {
    const result = await sendPendingCredentialsByEmail();
    if (result.success) {
      setErrorMessage(null);
    }
  }, [sendPendingCredentialsByEmail]);

  const requestDeleteAtleta = useCallback((atleta) => {
    openConfirmDialog({
      title: 'Eliminar estudiante',
      message: `Estas seguro de eliminar a ${atleta.full_name}? Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const result = await athletesService.deleteAtletaCompletely({ atleta });
          if (result?.userDeletionError) {
            showWarningToast('Estudiante eliminado, pero hubo un problema eliminando el usuario relacionado.', 7000);
          } else {
            showSuccessToast('Estudiante y usuario eliminados exitosamente.', 5000);
          }

          await loadAtletas();
        } catch (error) {
          const message = `Error eliminando estudiante: ${error.message}`;
          setErrorMessage(message);
          showErrorToast(message, 7000);
        }
      },
    });
  }, [loadAtletas, openConfirmDialog, showErrorToast, showSuccessToast, showWarningToast]);

  const requestResendCredentials = useCallback((atleta) => {
    openConfirmDialog({
      title: 'Reenviar credenciales',
      message: `Deseas reenviar las credenciales de acceso a ${atleta.full_name}?`,
      confirmLabel: 'Reenviar',
      tone: 'primary',
      onConfirm: async () => {
        try {
          await resendCredentialsForAthlete(atleta);
        } catch {
          // errores manejados en el hook de credenciales
        }
      },
    });
  }, [openConfirmDialog, resendCredentialsForAthlete]);

  const requestCleanOrphanUsers = useCallback(() => {
    openConfirmDialog({
      title: 'Limpiar usuarios huerfanos',
      message: 'Deseas limpiar usuarios que ya no tienen atletas asociados? Esta accion no se puede deshacer.',
      confirmLabel: 'Limpiar DB',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const result = await athletesService.cleanOrphanUsers();
          if (!result || (result.deletedCount === 0 && result.failedCount === 0)) {
            showInfoToast('No se encontraron usuarios huerfanos.', 5000);
            return;
          }

          const details = `Limpieza completada: ${result.deletedCount} usuarios eliminados${result.failedCount > 0 ? `, ${result.failedCount} con error` : ''}`;
          setActionResult({
            title: 'Resultado de limpieza',
            message: details,
          });
          showSuccessToast('Limpieza finalizada.', 5000);
        } catch (error) {
          const message = `Error limpiando usuarios huerfanos: ${error.message}`;
          setErrorMessage(message);
          showErrorToast(message, 7000);
        }
      },
    });
  }, [openConfirmDialog, showErrorToast, showInfoToast, showSuccessToast]);

  const calculateAge = useCallback(
    (birthDate) => athletesService.calculateAthleteAgeDisplay({ birthDate }),
    []
  );

  const formatIngresoDate = useCallback(
    (atleta) => athletesService.formatIngresoDate({ athlete: atleta }),
    []
  );

  const formatCategoria = useCallback(
    (categoria) => athletesService.formatCategoria({ categoria }),
    []
  );

  return {
    categories,
    initialFocusRef,
    allAtletas,
    loading,
    showModal,
    editingAtleta,
    filters,
    setFilters,
    resetFilters,
    currentPage,
    setCurrentPage,
    formData,
    setFormData,
    sendCredentialsOnCreate,
    setSendCredentialsOnCreate,
    maxBirthDate,
    errorMessage,
    setErrorMessage,
    pendingCredentials,
    clearPendingCredentials,
    handleSendCredentials,
    filteredAtletas,
    paginatedAtletas,
    totalPages: pagination.totalPages,
    visiblePage: pagination.currentPage,
    openModal,
    closeModal,
    handleSubmit,
    requestDeleteAtleta,
    requestResendCredentials,
    requestCleanOrphanUsers,
    confirmDialog,
    closeConfirmDialog,
    confirmDialogAction,
    actionResult,
    closeActionResult,
    calculateAge,
    formatIngresoDate,
    formatCategoria,
  };
};

export default useAtletasManager;

