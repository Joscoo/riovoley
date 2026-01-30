// src/components/AnunciosViewer.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import styles from '../styles/AnunciosViewer.module.css';
import { FaBullhorn, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

const AnunciosViewer = ({ userRole = 'all', limit = null, showFilters = false }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');

  const priorities = [
    { value: 'low', label: 'Baja', color: '#4ade80', icon: <FaExclamationCircle /> },
    { value: 'normal', label: 'Normal', color: '#60a5fa', icon: <FaBullhorn /> },
    { value: 'high', label: 'Alta', color: '#fb923c', icon: <FaExclamationCircle /> },
    { value: 'urgent', label: 'Urgente', color: '#f87171', icon: <FaExclamationTriangle /> }
  ];

  useEffect(() => {
    loadAnuncios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, selectedPriority]);

  const loadAnuncios = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('announcements_with_creator')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      // Filtrar por audiencia
      if (userRole !== 'all') {
        query = query.or(`target_audience.cs.{all},target_audience.cs.{${userRole}}`);
      }

      // Filtrar anuncios no expirados
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      // Filtrar por prioridad seleccionada
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority);
      }

      // Limitar resultados si se especifica
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error) {
      console.error('Error al cargar anuncios:', error);
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '';
    if (diffDays === 0) return 'Expira hoy';
    if (diffDays === 1) return 'Expira mañana';
    if (diffDays <= 7) return `Expira en ${diffDays} días`;
    
    return `Válido hasta ${date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })}`;
  };

  const formatCreatedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando anuncios...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showFilters && (
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${selectedPriority === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedPriority('all')}
          >
            Todos
          </button>
          {priorities.map(p => (
            <button
              key={p.value}
              className={`${styles.filterBtn} ${selectedPriority === p.value ? styles.active : ''}`}
              onClick={() => setSelectedPriority(p.value)}
              style={{ 
                borderColor: selectedPriority === p.value ? p.color : 'transparent'
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {anuncios.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📢</span>
          <p>No hay anuncios {selectedPriority !== 'all' ? `de prioridad ${priorities.find(p => p.value === selectedPriority)?.label.toLowerCase()}` : ''} en este momento</p>
        </div>
      ) : (
        <div className={styles.anunciosList}>
          {anuncios.map(anuncio => {
            const priorityInfo = getPriorityInfo(anuncio.priority);
            const expirationText = formatDate(anuncio.expires_at);
          
          return (
            <div 
              key={anuncio.id} 
              className={styles.anuncioCard}
              style={{
                borderLeftColor: priorityInfo.color
              }}
            >
              {/* Header */}
              <div className={styles.cardHeader}>
                <div className={styles.priorityInfo}>
                  <span className={styles.priorityIcon}>
                    {priorityInfo.icon}
                  </span>
                  <span 
                    className={styles.priorityLabel}
                    style={{ color: priorityInfo.color }}
                  >
                    {priorityInfo.label}
                  </span>
                </div>
                {expirationText && (
                  <span className={styles.expirationBadge}>
                    ⏰ {expirationText}
                  </span>
                )}
              </div>

              {/* Contenido */}
              <h3 className={styles.cardTitle}>{anuncio.title}</h3>
              <p className={styles.cardContent}>{anuncio.content}</p>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <span className={styles.creatorInfo}>
                  👤 {anuncio.creator_name || 'Riovoley'}
                </span>
                <span className={styles.dateInfo}>
                  {formatCreatedDate(anuncio.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

AnunciosViewer.propTypes = {
  userRole: PropTypes.oneOf(['all', 'estudiantes', 'entrenadores', 'administradores']),
  limit: PropTypes.number,
  showFilters: PropTypes.bool
};

export default AnunciosViewer;
