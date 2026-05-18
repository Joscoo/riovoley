import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { announcementsService } from '../../announcementsService';

const MESSAGE_TIMEOUT_MS = 4000;

const INITIAL_FORM_DATA = {
  title: '',
  content: '',
  priority: 'normal',
  target_audience: ['all'],
  is_active: true,
  expires_at: '',
};

export const useAnnouncementsManager = ({ user }) => {
  const timerRef = useRef(null);
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    is_active: 'all',
    search: '',
  });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, anuncioId: null });

  const clearMessageTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showTimedMessage = useCallback((type, text) => {
    clearMessageTimer();
    setMessage({ type, text });
    timerRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' });
      timerRef.current = null;
    }, MESSAGE_TIMEOUT_MS);
  }, [clearMessageTimer]);

  useEffect(() => () => clearMessageTimer(), [clearMessageTimer]);

  const resetFormData = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  const loadAnuncios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await announcementsService.loadAdminAnnouncements({ filters });
      setAnuncios(data || []);
    } catch (error) {
      console.error('Error al cargar anuncios:', error);
      showTimedMessage('error', 'Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  }, [filters, showTimedMessage]);

  useEffect(() => {
    loadAnuncios();
  }, [loadAnuncios]);

  const handleOpenModal = useCallback((anuncio = null) => {
    if (anuncio) {
      setEditingAnuncio(anuncio);
      setFormData({
        title: anuncio.title,
        content: anuncio.content,
        priority: anuncio.priority,
        target_audience: anuncio.target_audience || ['all'],
        is_active: anuncio.is_active,
        expires_at: anuncio.expires_at ? anuncio.expires_at.split('T')[0] : '',
      });
    } else {
      setEditingAnuncio(null);
      resetFormData();
    }
    setShowModal(true);
  }, [resetFormData]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingAnuncio(null);
    resetFormData();
  }, [resetFormData]);

  const handleInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleAudienceChange = useCallback((audienceValue) => {
    setFormData((prev) => {
      let newAudience = [...prev.target_audience];

      if (audienceValue === 'all') {
        newAudience = ['all'];
      } else {
        newAudience = newAudience.filter((audience) => audience !== 'all');

        if (newAudience.includes(audienceValue)) {
          newAudience = newAudience.filter((audience) => audience !== audienceValue);
        } else {
          newAudience.push(audienceValue);
        }

        if (newAudience.length === 0) {
          newAudience = ['all'];
        }
      }

      return { ...prev, target_audience: newAudience };
    });
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      showTimedMessage('error', 'El titulo y contenido son obligatorios');
      return;
    }

    try {
      const { mode } = await announcementsService.saveAnnouncement({
        editingAnuncio,
        formData,
        userId: user.id,
      });

      if (mode === 'updated') {
        showTimedMessage('success', 'Anuncio actualizado correctamente');
      } else {
        showTimedMessage('success', 'Anuncio creado correctamente');
      }

      handleCloseModal();
      await loadAnuncios();
    } catch (error) {
      console.error('Error al guardar anuncio:', error);
      showTimedMessage('error', `Error: ${error.message}`);
    }
  }, [editingAnuncio, formData, handleCloseModal, loadAnuncios, showTimedMessage, user.id]);

  const handleToggleActive = useCallback(async (anuncio) => {
    try {
      await announcementsService.toggleAnnouncementActive({ anuncio });
      showTimedMessage('success', `Anuncio ${!anuncio.is_active ? 'activado' : 'desactivado'}`);
      await loadAnuncios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showTimedMessage('error', 'Error al cambiar estado del anuncio');
    }
  }, [loadAnuncios, showTimedMessage]);

  const requestDelete = useCallback((anuncioId) => {
    setConfirmDelete({ open: true, anuncioId });
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmDelete({ open: false, anuncioId: null });
  }, []);

  const confirmDeleteAnnouncement = useCallback(async () => {
    const announcementId = confirmDelete.anuncioId;
    cancelDelete();
    if (!announcementId) return;

    try {
      await announcementsService.removeAnnouncement({ announcementId });
      showTimedMessage('success', 'Anuncio eliminado correctamente');
      await loadAnuncios();
    } catch (error) {
      console.error('Error al eliminar anuncio:', error);
      showTimedMessage('error', 'Error al eliminar anuncio');
    }
  }, [cancelDelete, confirmDelete.anuncioId, loadAnuncios, showTimedMessage]);

  const helpers = useMemo(() => ({
    formatDate: (dateString) => {
      if (!dateString) return 'Sin fecha';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    isExpired: (expiresAt) => {
      if (!expiresAt) return false;
      return new Date(expiresAt) < new Date();
    },
  }), []);

  return {
    anuncios,
    loading,
    showModal,
    editingAnuncio,
    filters,
    setFilters,
    formData,
    message,
    confirmDelete,
    helpers,
    handleOpenModal,
    handleCloseModal,
    handleInputChange,
    handleAudienceChange,
    handleSubmit,
    handleToggleActive,
    requestDelete,
    cancelDelete,
    confirmDeleteAnnouncement,
  };
};

export default useAnnouncementsManager;

