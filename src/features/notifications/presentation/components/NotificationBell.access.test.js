import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';

const mockLoadBellNotifications = jest.fn();

jest.mock('../../notificationsService', () => ({
  notificationsService: {
    loadBellNotifications: (...args) => mockLoadBellNotifications(...args)
  }
}));

describe('NotificationBell access by role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadBellNotifications.mockResolvedValue([]);
  });

  test('no renderiza para estudiantes ni carga notificaciones', async () => {
    render(<NotificationBell userRole="estudiante" />);

    expect(screen.queryByLabelText('Notificaciones')).not.toBeInTheDocument();

    await Promise.resolve();
    expect(mockLoadBellNotifications).not.toHaveBeenCalled();
  });

  test('renderiza para entrenadores y carga notificaciones', async () => {
    render(<NotificationBell userRole="entrenador" />);

    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockLoadBellNotifications).toHaveBeenCalledWith({ userRole: 'entrenador' });
    });
  });
});
