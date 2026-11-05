import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { initializeOtaUpdates, notifyOtaAppReady, subscribeToOtaState } from './shared/platform';
import { getCurrentUser } from './config/supabase';

let mockOtaState;
const originalFlag = process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS;

// CRA/Jest 27 does not resolve React Router 7's react-router/dom export.
// Simulate navigation here; this suite verifies App's diagnostic visibility.
jest.mock('react-router-dom', () => {
  const React = require('react');
  const navigate = jest.fn();
  return {
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => React.Children.toArray(children).find(child => child.props.path === globalThis.window.location.pathname) || null,
    Route: ({ element }) => element,
    useLocation: () => ({ pathname: globalThis.window.location.pathname }),
    useNavigate: () => navigate,
  };
}, { virtual: true });

jest.mock('./components/Navbar', () => () => null);
jest.mock('./components/HomePage', () => {
  const React = require('react');
  return () => React.createElement('h1', null, 'Portada de prueba');
});
jest.mock('./features/auth-session/presentation/components/Login', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('h1', null, 'Ingreso de prueba') };
});
jest.mock('./config/supabase', () => ({ getCurrentUser: jest.fn().mockResolvedValue(null) }));
jest.mock('./features/auth-profile', () => ({ useUserProfile: () => ({ profile: null }) }));
jest.mock('./shared/infrastructure/mobile', () => ({ mobileDeviceRepository: {} }));
jest.mock('./shared/ui', () => {
  const React = require('react');
  return {
    RenderProfileProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    Card: ({ children }) => React.createElement('section', null, children),
    Button: ({ children, onClick, disabled }) => React.createElement('button', { onClick, disabled }, children),
  };
});
jest.mock('./contexts/ToastContext', () => {
  const React = require('react');
  const toast = { info: jest.fn(), warning: jest.fn(), error: jest.fn() };
  return {
    ToastProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useToast: () => toast,
  };
});
jest.mock('./shared/platform', () => ({
  initializeMobileAppBridge: jest.fn().mockResolvedValue(undefined),
  initializeOtaUpdates: jest.fn().mockResolvedValue(undefined),
  notifyOtaAppReady: jest.fn().mockResolvedValue(undefined),
  subscribeToOtaState: jest.fn(callback => { callback({ ...mockOtaState }); return () => {}; }),
  subscribeToDeepLinks: jest.fn(() => () => {}),
  subscribeToPushRegistration: jest.fn(() => () => {}),
  subscribeToForegroundPushNotifications: jest.fn(() => () => {}),
  initializePushForAuthenticatedUser: jest.fn().mockResolvedValue(undefined),
  teardownPushForAuthenticatedUser: jest.fn().mockResolvedValue(undefined),
  checkForAppUpdate: jest.fn(),
  downloadAppUpdate: jest.fn(),
  applyAppUpdate: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState(null, '', '/');
  mockOtaState = { supported: true, status: 'idle', currentChannel: 'production' };
  // CRA resets jest.fn implementations before each test; restore this fixture.
  subscribeToOtaState.mockImplementation(callback => { callback({ ...mockOtaState }); return () => {}; });
  getCurrentUser.mockResolvedValue(null);
  delete process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS;
});
afterAll(() => {
  if (originalFlag === undefined) delete process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS;
  else process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = originalFlag;
});
const home = async () => {
  render(<App />);
  await screen.findByRole('heading', { name: 'Portada de prueba' });
};

test('la portada normal no ofrece controles tecnicos OTA aunque la plataforma los soporte', async () => {
  await home();
  expect(screen.queryByRole('button', { name: /^OTA$/ })).not.toBeInTheDocument();
});
test('el valor false mantiene oculto el diagnostico nativo', async () => {
  process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = 'false';
  await home();
  expect(screen.queryByRole('button', { name: /^OTA$/ })).not.toBeInTheDocument();
});
test('un valor distinto de true no activa controles manuales', async () => {
  process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = '1';
  await home();
  expect(screen.queryByRole('button', { name: /^OTA$/ })).not.toBeInTheDocument();
});
test('una compilacion de diagnostico explicita permite abrir el panel en portada', async () => {
  process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = 'true';
  await home();
  fireEvent.click(screen.getByRole('button', { name: /^OTA$/ }));
  expect(screen.getByRole('heading', { name: 'Estado OTA Android' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Buscar update' })).toBeInTheDocument();
});
test('la activacion explicita no agrega el panel fuera de la portada', async () => {
  process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = 'true';
  window.history.replaceState(null, '', '/login');
  render(<App />);
  await screen.findByRole('heading', { name: 'Ingreso de prueba' });
  expect(screen.queryByRole('button', { name: /^OTA$/ })).not.toBeInTheDocument();
});
test('una plataforma sin soporte no muestra el panel ni con activacion explicita', async () => {
  process.env.REACT_APP_ENABLE_OTA_DIAGNOSTICS = 'true';
  mockOtaState.supported = false;
  await home();
  expect(screen.queryByRole('button', { name: /^OTA$/ })).not.toBeInTheDocument();
});
test('ocultar el diagnostico conserva el bootstrap y la confirmacion de app lista', async () => {
  mockOtaState.status = 'available';
  mockOtaState.availableUpdate = { version: 'fixture-update' };
  await home();
  await waitFor(() => expect(notifyOtaAppReady).toHaveBeenCalledTimes(1));
  expect(initializeOtaUpdates).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: /OTA/ })).not.toBeInTheDocument();
});
