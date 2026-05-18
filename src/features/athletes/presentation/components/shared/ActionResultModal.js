import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const ActionResultModal = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-rv-gold">{title}</h3>
        <p className="mt-3 whitespace-pre-line rounded-lg border border-rv-gold/20 bg-black/25 p-3 text-sm text-slate-100">
          {message}
        </p>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </div>
      </Card>
    </div>
  );
};

ActionResultModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ActionResultModal;

