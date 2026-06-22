import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const sizeMap = {
  sm: 'h-6 w-6 border-[3px]',
  md: 'h-10 w-10 border-4',
  lg: 'h-14 w-14 border-4',
};

const LoadingSpinner = ({ message, size = 'md', className }) => {
  return (
    <div
      className={cn(
        'flex min-h-[20dvh] flex-col items-center justify-center gap-4 text-white',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'animate-spin rounded-full border-white/20 border-t-rv-gold',
          sizeMap[size] || sizeMap.md
        )}
      />
      {message ? (
        <p className="text-sm font-semibold text-slate-200">{message}</p>
      ) : null}
      <span className="sr-only">Cargando</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default LoadingSpinner;
