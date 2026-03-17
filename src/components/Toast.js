// src/components/Toast.js
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';
import styles from '../styles/Toast.module.css';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className={styles.icon} />;
      case 'error':
        return <FaTimesCircle className={styles.icon} />;
      case 'warning':
        return <FaExclamationTriangle className={styles.icon} />;
      default:
        return <FaInfoCircle className={styles.icon} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {getIcon()}
      <span className={styles.message}>{message}</span>
      <button 
        className={styles.closeButton} 
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        <FaTimes />
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired
};

export default Toast;
