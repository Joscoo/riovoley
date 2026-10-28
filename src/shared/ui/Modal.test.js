import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

test('labels the dialog, focuses it, traps Tab, handles Escape and restores the opener', () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const onClose = jest.fn();
  const { unmount } = render(<Modal title="Editar estudiante" onClose={onClose}><input aria-label="Nombre" /></Modal>);
  const dialog = screen.getByRole('dialog', { name: 'Editar estudiante' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  const close = screen.getByRole('button', { name: 'Cerrar modal' });
  expect(close).toHaveFocus();
  const input = screen.getByLabelText('Nombre');
  input.focus();
  fireEvent.keyDown(dialog, { key: 'Tab' });
  expect(close).toHaveFocus();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
  unmount();
  expect(opener).toHaveFocus();
  opener.remove();
});
