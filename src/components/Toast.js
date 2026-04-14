// src/components/Toast.js
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';
import { cn } from '../lib/cn';

const toastTypeStyles = {
  success: 'bg-gradient-to-br from-emerald-500/95 to-emerald-600/95 border-emerald-500 text-white',
  error: 'bg-gradient-to-br from-red-500/95 to-red-600/95 border-red-500 text-white',
  warning: 'bg-gradient-to-br from-amber-400/95 to-amber-500/95 border-amber-400 text-blue-900',
  info: 'bg-gradient-to-br from-blue-500/95 to-blue-600/95 border-blue-500 text-white'
};

const iconByType = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle
};

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const Icon = iconByType[type] || FaInfoCircle;

  return (
    <div
      className={cn(
        'fixed right-5 top-[90px] z-[10000] flex min-w-[320px] max-w-[500px] animate-[slide-in-right_0.4s_cubic-bezier(0.34,1.56,0.64,1)] items-center gap-3 rounded-xl border-2 px-5 py-4 font-medium shadow-[0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-[20px]',
        'max-[768px]:left-2.5 max-[768px]:right-2.5 max-[768px]:top-[75px] max-[768px]:min-w-0 max-[768px]:max-w-none',
        'mobile:px-4 mobile:py-3.5',
        toastTypeStyles[type] || toastTypeStyles.info
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="shrink-0 text-[1.5rem] mobile:text-[1.3rem]" />
      <span className="flex-1 text-[0.95rem] leading-[1.4] mobile:text-[0.9rem]">{message}</span>
      <button 
        className="flex shrink-0 items-center justify-center rounded-md p-1 opacity-80 transition-all duration-200 hover:bg-black/20 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        <FaTimes className="text-[1.2rem] mobile:text-[1.1rem]" />
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
