import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PanelUserGuide from './PanelUserGuide';

const steps = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    sectionId: 'dashboard',
    summary: 'Resumen general.',
    highlights: ['Ver indicadores', 'Abrir acciones rapidas'],
  },
  {
    id: 'users',
    title: 'Usuarios',
    sectionId: 'usuarios',
    summary: 'Gestion de usuarios.',
    highlights: ['Crear registros', 'Editar cuentas'],
  },
];

describe('PanelUserGuide', () => {
  it('navega por pasos y cambia la seccion activa', async () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();
    const onSectionChange = jest.fn();

    render(
      <PanelUserGuide
        open
        role="admin"
        panelLabel="Panel de Administracion"
        steps={steps}
        onClose={onClose}
        onComplete={onComplete}
        onSectionChange={onSectionChange}
      />
    );

    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(onSectionChange).toHaveBeenCalledWith('dashboard');

    await userEvent.click(screen.getByRole('button', { name: /Siguiente paso/i }));

    expect(screen.getAllByText('Usuarios')[0]).toBeInTheDocument();
    expect(onSectionChange).toHaveBeenLastCalledWith('usuarios');

    await userEvent.click(screen.getByRole('button', { name: /Finalizar recorrido/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('permite omitir la guia', async () => {
    const onClose = jest.fn();

    render(
      <PanelUserGuide
        open
        role="student"
        panelLabel="Panel de Estudiante"
        steps={steps}
        onClose={onClose}
        onComplete={jest.fn()}
        onSectionChange={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Omitir guia/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
