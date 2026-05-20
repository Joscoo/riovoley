export const deferAuthEvent = (handler, scheduler = (callback) => window.setTimeout(callback, 0)) => {
  if (typeof handler !== 'function') {
    throw new TypeError('deferAuthEvent requiere un handler funcion');
  }

  return (event, session) => {
    scheduler(() => {
      Promise.resolve()
        .then(() => handler(event, session))
        .catch((error) => {
        console.error('Error procesando evento de autenticacion diferido:', error);
        });
    });
  };
};
