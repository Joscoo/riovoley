import WhatsAppBusinessService from './whatsappBusinessService';

it('incluye nombre, email y contraseña en orden en la plantilla de credenciales', async () => {
  const service = new WhatsAppBusinessService();
  service.accessToken = 'test-token';
  service.phoneNumberId = 'test-phone';
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ messages: [{ id: 'message-1' }] }) }));
  try {
    await service.sendCredentials({ nombre: 'Nuevo', apellido: 'Usuario', email: 'new@example.com', telefono: '+593999999999' }, 'Generated123!');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.template.components.find((component) => component.type === 'body').parameters).toEqual([
      { type: 'text', text: 'Nuevo Usuario' }, { type: 'text', text: 'new@example.com' }, { type: 'text', text: 'Generated123!' },
    ]);
  } finally { global.fetch = originalFetch; }
});
