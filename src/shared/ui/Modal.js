import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import { cn } from '../../lib/cn';

const Modal = ({ title, icon, onClose, children, className }) => {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm transition-opacity mobile:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          'my-6 w-full max-w-3xl rounded-2xl border border-rv-gold/25 bg-slate-950/95 shadow-2xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            {icon && <span className="text-rv-gold">{icon}</span>}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[82vh] overflow-y-auto p-6">{children}</div>
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
