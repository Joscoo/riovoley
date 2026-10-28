import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import { cn } from '../../lib/cn';

const Modal = ({ title, icon, onClose, children, className }) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      const controls = Array.from(dialogRef.current.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )).filter((control) => !control.closest('[hidden]') && window.getComputedStyle(control).display !== 'none');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-start justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-sm transition-opacity mobile:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className={cn(
          'my-2 w-full max-w-3xl rounded-2xl border border-rv-gold/25 bg-slate-950/95 shadow-2xl mobile:my-6',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 mobile:px-6 mobile:py-4">
          <h3 id={titleId} className="flex min-w-0 items-center gap-2 text-base font-bold leading-tight text-white">
            {icon && <span className="text-rv-gold">{icon}</span>}
            <span className="min-w-0 break-words">{title}</span>
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
            aria-label="Cerrar modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4 mobile:max-h-[82vh] mobile:p-6">{children}</div>
      </div>
    </div>,
    document.body
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
