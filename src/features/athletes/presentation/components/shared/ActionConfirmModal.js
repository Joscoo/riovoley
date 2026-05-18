import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const TONE_CLASS = {
  danger: 'text-red-300',
  primary: 'text-rv-gold',
};

const ActionConfirmModal = ({ isOpen, title, message, confirmLabel, tone, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <Card
        className="w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className={`text-lg font-bold ${TONE_CLASS[tone] || TONE_CLASS.primary}`}>{title}</h3>
        <p className="mt-3 whitespace-pre-line text-sm text-slate-200">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 mobile:flex-row mobile:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full mobile:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="w-full mobile:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};

ActionConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  tone: PropTypes.oneOf(['danger', 'primary']),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ActionConfirmModal.defaultProps = {
  confirmLabel: 'Confirmar',
  tone: 'primary',
};

export default ActionConfirmModal;

