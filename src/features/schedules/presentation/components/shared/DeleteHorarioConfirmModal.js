import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const DeleteHorarioConfirmModal = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <Card
        className="w-full max-w-md"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-red-200">Eliminar horario</h3>
        <p className="mt-3 text-sm text-slate-200">Estas seguro de eliminar este horario?</p>

        <div className="mt-6 flex flex-col-reverse gap-3 mobile:flex-row mobile:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full mobile:w-auto">
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} className="w-full mobile:w-auto">
            Eliminar
          </Button>
        </div>
      </Card>
    </div>
  );
};

DeleteHorarioConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteHorarioConfirmModal;

