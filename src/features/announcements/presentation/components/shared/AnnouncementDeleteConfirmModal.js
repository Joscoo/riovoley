import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const AnnouncementDeleteConfirmModal = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <Card
        className="w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-red-200">Eliminar anuncio</h3>
        <p className="mt-3 text-sm text-slate-200">
          Estas seguro de eliminar este anuncio? Esta accion no se puede deshacer.
        </p>
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

AnnouncementDeleteConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default AnnouncementDeleteConfirmModal;

