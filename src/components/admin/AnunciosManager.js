// src/components/admin/AnunciosManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/AnunciosManager.module.css';

const AnunciosManager = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    is_active: 'all',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: ['all'],
    is_active: true,
    expires_at: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const priorities = [
    { value: 'low', label: 'Baja', color: '#4ade80' },
    { value: 'normal', label: 'Normal', color: '#60a5fa' },
    { value: 'high', label: 'Alta', color: '#fb923c' },
    { value: 'urgent', label: 'Urgente', color: '#f87171' }
  ];

  const audiences = [
    { value: 'all', label: 'Todos' },
    { value: 'estudiantes', label: 'Estudiantes' },
    { value: 'entrenadores', label: 'Entrenadores' },
    { value: 'administradores', label: 'Administradores' }
  ];

  useEffect(() => {
    loadAnuncios();
  }, [filters]);

  const loadAnuncios = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('announcements_with_creator')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.is_active !== 'all') {
        query = query.eq('is_active', filters.is_active === 'true');
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error) {
      console.error('Error al cargar anuncios:', error);
      showMessage('error', 'Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleOpenModal = (anuncio = null) => {
    if (anuncio) {
      setEditingAnuncio(anuncio);
      setFormData({
        title: anuncio.title,
        content: anuncio.content,
        priority: anuncio.priority,
        target_audience: anuncio.target_audience || ['all'],
        is_active: anuncio.is_active,
        expires_at: anuncio.expires_at ? anuncio.expires_at.split('T')[0] : ''
      });
    } else {
      setEditingAnuncio(null);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        target_audience: ['all'],
        is_active: true,
        expires_at: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnuncio(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_audience: ['all'],
      is_active: true,
      expires_at: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAudienceChange = (audienceValue) => {
    setFormData(prev => {
      let newAudience = [...prev.target_audience];
      
      if (audienceValue === 'all') {
        // Si se selecciona "Todos", solo mantener ese
        newAudience = ['all'];
      } else {
        // Remover "all" si está presente
        newAudience = newAudience.filter(a => a !== 'all');
        
        if (newAudience.includes(audienceValue)) {
          // Remover si ya está seleccionado
          newAudience = newAudience.filter(a => a !== audienceValue);
        } else {
          // Agregar si no está seleccionado
          newAudience.push(audienceValue);
        }
        
        // Si no hay nada seleccionado, agregar "all"
        if (newAudience.length === 0) {
          newAudience = ['all'];
        }
      }
      
      return { ...prev, target_audience: newAudience };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      showMessage('error', 'El título y contenido son obligatorios');
      return;
    }

    try {
      const anuncioData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        target_audience: formData.target_audience,
        is_active: formData.is_active,
        expires_at: formData.expires_at || null
      };

      if (editingAnuncio) {
        // Actualizar anuncio existente
        const { error } = await supabase
          .from('announcements')
          .update(anuncioData)
          .eq('id', editingAnuncio.id);

        if (error) throw error;
        showMessage('success', 'Anuncio actualizado correctamente');
      } else {
        // Crear nuevo anuncio
        anuncioData.created_by = user.id;
        
        const { error } = await supabase
          .from('announcements')
          .insert([anuncioData]);

        if (error) throw error;
        showMessage('success', 'Anuncio creado correctamente');
      }

      handleCloseModal();
      loadAnuncios();
    } catch (error) {
      console.error('Error al guardar anuncio:', error);
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const handleToggleActive = async (anuncio) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !anuncio.is_active })
        .eq('id', anuncio.id);

      if (error) throw error;
      showMessage('success', `Anuncio ${!anuncio.is_active ? 'activado' : 'desactivado'}`);
      loadAnuncios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showMessage('error', 'Error al cambiar estado del anuncio');
    }
  };

  const handleDelete = async (anuncioId) => {
    if (!window.confirm('¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', anuncioId);

      if (error) throw error;
      showMessage('success', 'Anuncio eliminado correctamente');
      loadAnuncios();
    } catch (error) {
      console.error('Error al eliminar anuncio:', error);
      showMessage('error', 'Error al eliminar anuncio');
    }
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📢 Gestión de Anuncios</h1>
          <p className={styles.subtitle}>
            Crea y administra anuncios para estudiantes, entrenadores y administradores
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary}>
          ➕ Nuevo Anuncio
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="🔍 Buscar por título o contenido..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className={styles.searchInput}
        />
        
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className={styles.select}
        >
          <option value="">Todas las prioridades</option>
          {priorities.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <select
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          className={styles.select}
        >
          <option value="all">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando anuncios...</p>
        </div>
      ) : anuncios.length === 0 ? (
        <div className={styles.empty}>
          <p>📢 No hay anuncios para mostrar</p>
          <button onClick={() => handleOpenModal()} className={styles.btnSecondary}>
            Crear primer anuncio
          </button>
        </div>
      ) : (
        <div className={styles.anunciosList}>
          {anuncios.map(anuncio => {
            const priorityInfo = getPriorityInfo(anuncio.priority);
            const expired = isExpired(anuncio.expires_at);
            
            return (
              <div 
                key={anuncio.id} 
                className={`${styles.anuncioCard} ${!anuncio.is_active ? styles.inactive : ''} ${expired ? styles.expired : ''}`}
              >
                {/* Header del card */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <span 
                      className={styles.priorityBadge}
                      style={{ backgroundColor: priorityInfo.color }}
                    >
                      {priorityInfo.label}
                    </span>
                    {!anuncio.is_active && (
                      <span className={styles.statusBadge}>Inactivo</span>
                    )}
                    {expired && (
                      <span className={styles.expiredBadge}>Expirado</span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleToggleActive(anuncio)}
                      className={styles.btnIcon}
                      title={anuncio.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {anuncio.is_active ? '🔕' : '🔔'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(anuncio)}
                      className={styles.btnIcon}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(anuncio.id)}
                      className={styles.btnIcon}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                <h3 className={styles.cardTitle}>{anuncio.title}</h3>
                <p className={styles.cardContent}>{anuncio.content}</p>

                {/* Footer del card */}
                <div className={styles.cardFooter}>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      👤 {anuncio.creator_name || 'Usuario'}
                    </span>
                    <span className={styles.metaItem}>
                      📅 {formatDate(anuncio.created_at)}
                    </span>
                    {anuncio.expires_at && (
                      <span className={styles.metaItem}>
                        ⏰ Expira: {formatDate(anuncio.expires_at)}
                      </span>
                    )}
                  </div>
                  <div className={styles.audienceTags}>
                    {anuncio.target_audience?.map(audience => (
                      <span key={audience} className={styles.audienceTag}>
                        {audiences.find(a => a.value === audience)?.label || audience}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}</h2>
              <button onClick={handleCloseModal} className={styles.btnClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Título */}
              <div className={styles.formGroup}>
                <label htmlFor="title">Título *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título del anuncio"
                  required
                  maxLength="255"
                />
              </div>

              {/* Contenido */}
              <div className={styles.formGroup}>
                <label htmlFor="content">Contenido *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Describe el anuncio..."
                  required
                  rows="6"
                />
              </div>

              {/* Prioridad */}
              <div className={styles.formGroup}>
                <label htmlFor="priority">Prioridad</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Audiencia objetivo */}
              <div className={styles.formGroup}>
                <label>Audiencia Objetivo</label>
                <div className={styles.checkboxGroup}>
                  {audiences.map(audience => (
                    <label key={audience.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.target_audience.includes(audience.value)}
                        onChange={() => handleAudienceChange(audience.value)}
                      />
                      <span>{audience.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fecha de expiración */}
              <div className={styles.formGroup}>
                <label htmlFor="expires_at">Fecha de Expiración (opcional)</label>
                <input
                  type="date"
                  id="expires_at"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Estado activo */}
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Anuncio activo</span>
                </label>
              </div>

              {/* Botones */}
              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingAnuncio ? 'Actualizar' : 'Crear'} Anuncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

AnunciosManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default AnunciosManager;
