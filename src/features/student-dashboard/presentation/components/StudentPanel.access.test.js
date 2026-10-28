import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudentPanel from './StudentPanel';
import { useUserProfile } from '../../../auth-profile';
import { studentDashboardService } from '../../studentDashboardService';

jest.mock('../../../auth-profile', () => ({ useUserProfile: jest.fn() }));
jest.mock('react-router-dom', () => ({ useLocation: () => ({ search: '' }) }), { virtual: true });
jest.mock('../../../announcements/presentation/components/AnunciosViewer', () => () => <div>Comunicados de prueba</div>);
jest.mock('../../../gamification/presentation/components/StudentGamificationPanel', () => ({ onRefresh }) => <button onClick={onRefresh}>Actualizar gamificación</button>);
jest.mock('../../studentDashboardService', () => ({ studentDashboardService: {
  loadStudentPanelData: jest.fn(), subscribeToPaymentChanges: jest.fn(() => () => {}),
} }));

const view = user => <StudentPanel user={user} />;
beforeEach(() => {
  jest.clearAllMocks();
  useUserProfile.mockReturnValue({ profile: null, loading: false });
  studentDashboardService.loadStudentPanelData.mockResolvedValue({ studentData: null });
});

test('deniega al visitante anónimo sin quedar cargando ni consultar datos', () => {
  render(view(null));
  expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument();
  expect(screen.queryByText('Cargando informacion...')).not.toBeInTheDocument();
  expect(studentDashboardService.loadStudentPanelData).not.toHaveBeenCalled();
});

test.each(['administrador', 'entrenador'])('deniega %s sin consultar el panel de estudiante', role => {
  useUserProfile.mockReturnValue({ profile: { role }, loading: false });
  render(view({ id: 'staff-test' }));
  expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument();
  expect(studentDashboardService.loadStudentPanelData).not.toHaveBeenCalled();
});

test('espera la resolución del perfil antes de consultar datos de estudiante', () => {
  useUserProfile.mockReturnValue({ profile: null, loading: true });
  render(view({ id: 'student-test' }));
  expect(screen.getByText('Cargando informacion...')).toBeInTheDocument();
  expect(studentDashboardService.loadStudentPanelData).not.toHaveBeenCalled();
});

test('un usuario sin perfil autorizado recibe denegación explícita', () => {
  render(view({ id: 'without-profile' }));
  expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument();
  expect(studentDashboardService.loadStudentPanelData).not.toHaveBeenCalled();
});

test('al cerrar sesión oculta el panel aunque finalice una petición anterior', async () => {
  let resolveLoad;
  studentDashboardService.loadStudentPanelData.mockReturnValue(new Promise(resolve => { resolveLoad = resolve; }));
  useUserProfile.mockReturnValue({ profile: { role: 'estudiante' }, loading: false });
  const { rerender } = render(view({ id: 'student-test' }));
  await waitFor(() => expect(studentDashboardService.loadStudentPanelData).toHaveBeenCalledWith('student-test'));
  useUserProfile.mockReturnValue({ profile: null, loading: false });
  rerender(view(null));
  expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument();
  resolveLoad({ studentData: { id: 'previous-student', users: { nombre: 'Anterior' } } });
  await waitFor(() => expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument());
  expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
});

test('una recarga silenciosa intercalada libera la carga normal vigente', async () => {
  localStorage.setItem('riovoley:panel-guide:student', JSON.stringify({ version: '2026-06-22', status: 'dismissed' }));
  const data = { studentData: { id: 's1', users: { nombre: 'Fixture' } } };
  useUserProfile.mockReturnValue({ profile: { role: 'estudiante' }, loading: false });
  studentDashboardService.loadStudentPanelData.mockResolvedValueOnce(data);
  render(view({ id: 'u1' }));
  await screen.findByRole('heading', { name: 'Panel de Estudiante' });
  fireEvent.click(document.querySelector('[data-guide-id="student-menu-progreso"]'));
  const refresh = await screen.findByRole('button', { name: 'Actualizar gamificación' });
  let resolveNormal, resolveSilent;
  studentDashboardService.loadStudentPanelData
    .mockImplementationOnce(() => new Promise(resolve => { resolveNormal = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { resolveSilent = resolve; }));
  fireEvent.click(refresh);
  await waitFor(() => expect(studentDashboardService.loadStudentPanelData).toHaveBeenCalledTimes(2));
  act(() => window.dispatchEvent(new Event('riovoley:dashboard-refresh')));
  await waitFor(() => expect(studentDashboardService.loadStudentPanelData).toHaveBeenCalledTimes(3));
  await act(async () => { resolveSilent(data); resolveNormal(data); });
  expect(screen.queryByText('Cargando informacion...')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Panel de Estudiante' })).toBeInTheDocument();
});
