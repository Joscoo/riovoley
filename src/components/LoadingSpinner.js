// src/components/LoadingSpinner.js
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/LoadingSpinner.module.css';

const LoadingSpinner = ({ message = 'Cargando...', size = 'medium', fullScreen = false }) => {
  const sizeClass = styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`];
  
  if (fullScreen) {
    return (
      <div className={styles.fullScreenContainer}>
        <div className={styles.spinnerWrapper}>
          <div className={`${styles.spinner} ${sizeClass}`}></div>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.inlineContainer}>
      <div className={`${styles.spinner} ${sizeClass}`}></div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullScreen: PropTypes.bool
};

export default LoadingSpinner;
