// src/components/LoadingSpinner.js
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../lib/cn';

const LoadingSpinner = ({ message = 'Cargando...', size = 'medium', fullScreen = false }) => {
  const spinnerSizeClass = {
    small: 'h-6 w-6 border-[3px]',
    medium: 'h-10 w-10 border-4',
    large: 'h-[60px] w-[60px] border-[5px] mobile:h-[50px] mobile:w-[50px] mobile:border-4'
  }[size];

  const spinnerClassName = cn(
    'animate-spin rounded-full border-solid border-white/20 border-t-rv-gold',
    spinnerSizeClass
  );
  
  if (fullScreen) {
    return (
      <div className="rv-panel-bg flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className={spinnerClassName}></div>
          {message && <p className="m-0 text-center text-[1.1rem] font-medium text-white/90 mobile:text-base">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-5 py-10">
      <div className={spinnerClassName}></div>
      {message && <p className="m-0 text-center text-[1.1rem] font-medium text-white/90 mobile:text-base">{message}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullScreen: PropTypes.bool
};

export default LoadingSpinner;
