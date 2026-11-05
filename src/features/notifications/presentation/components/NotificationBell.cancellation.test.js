import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';
const mockLoad = jest.fn();
jest.mock('../../notificationsService', () => ({ notificationsService: { loadBellNotifications: (...args) => mockLoad(...args) } }));
beforeEach(() => { mockLoad.mockReset(); mockLoad.mockReturnValue(new Promise(() => {})); });
test('desmontar cancela la carga pendiente de la campana', async () => {
  const view = render(<NotificationBell userRole="administrador" userId="fixture-a" />);
  await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1));
  const signal = mockLoad.mock.calls[0][0].signal;
  expect(signal).toBeInstanceOf(AbortSignal); expect(signal.aborted).toBe(false);
  view.unmount(); expect(signal.aborted).toBe(true);
});
test('cambiar usuario cancela la carga anterior y conserva activa la nueva', async () => {
  const view = render(<NotificationBell userRole="administrador" userId="fixture-a" />);
  await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1));
  const first = mockLoad.mock.calls[0][0].signal;
  view.rerender(<NotificationBell userRole="entrenador" userId="fixture-b" />);
  await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2));
  expect(first).toBeInstanceOf(AbortSignal); expect(first.aborted).toBe(true);
  expect(mockLoad.mock.calls[1][0].signal.aborted).toBe(false);
});
test('resolver una carga obsoleta no reemplaza las notificaciones vigentes', async () => {
  let resolveOld, resolveCurrent;
  mockLoad.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { resolveCurrent = resolve; }));
  const view = render(<NotificationBell userRole="administrador" userId="fixture-a" />);
  view.rerender(<NotificationBell userRole="entrenador" userId="fixture-b" />);
  await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2));
  await act(async () => { resolveCurrent([{ id: 'current-1', isRead: false }, { id: 'current-2', isRead: false }]); });
  expect(screen.getByLabelText('Notificaciones')).toHaveTextContent('2');
  await act(async () => { resolveOld([]); });
  expect(screen.getByLabelText('Notificaciones')).toHaveTextContent('2');
});
