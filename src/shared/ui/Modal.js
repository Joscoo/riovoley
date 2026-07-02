import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import { cn } from '../../lib/cn';

const Modal = ({ title, icon, onClose, children, className }) => {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-sm transition-opacity mobile:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          'my-2 w-full max-w-3xl rounded-2xl border border-rv-gold/25 bg-slate-950/95 shadow-2xl mobile:my-6',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 mobile:px-6 mobile:py-4">
          <h3 className="flex min-w-0 items-center gap-2 text-base font-bold leading-tight text-white">
            {icon && <span className="text-rv-gold">{icon}</span>}
            <span className="min-w-0 break-words">{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            aria-label="Cerrar modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4 mobile:max-h-[82vh] mobile:p-6">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Modal;
