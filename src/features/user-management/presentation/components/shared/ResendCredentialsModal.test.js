import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResendCredentialsModal from './ResendCredentialsModal';

const user = { id: 'u1', email: 'ana@demo.com', nombre: 'Ana' };

it('un doble envio solo ejecuta una rotacion de contrasena y bloquea cerrar durante el envio', async () => {
  const onConfirm = jest.fn(() => new Promise(() => {}));
  const onCancel = jest.fn();
  const { container } = render(<ResendCredentialsModal user={user} onConfirm={onConfirm} onCancel={onCancel} />);
  const form = container.querySelector('form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: /Enviando/i })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
  expect(onCancel).not.toHaveBeenCalled();
});

it('muestra las nuevas credenciales para entrega manual si falla el correo', async () => {
  render(<ResendCredentialsModal user={user} onCancel={jest.fn()} onConfirm={async () => ({
    success: true, deliverySuccess: false, deliveryStatus: 'failed', emailError: 'Dominio no verificado',
    message: 'La contraseña fue actualizada, pero el correo no fue enviado.',
    credentials: { email: user.email, password: 'Temporary123!', loginUrl: 'https://riovoley.com/login' },
  })} />);
  fireEvent.click(screen.getByRole('button', { name: /Enviar Credenciales/i }));
  await waitFor(() => expect(screen.getByText('Temporary123!')).toBeInTheDocument());
  expect(screen.getByText(/Dominio no verificado/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Enviar Credenciales/i })).not.toBeInTheDocument();
});
