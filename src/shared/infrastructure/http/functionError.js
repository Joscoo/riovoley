// functions.invoke puts non-2xx response bodies in error.context, not data.
export const readFunctionError = async (error, data, fallback = 'No se pudo completar la solicitud') => {
  let body = data;
  const response = error?.context;
  if (response && typeof response.json === 'function') {
    try {
      body = await (typeof response.clone === 'function' ? response.clone() : response).json();
    } catch (_error) {
      // A proxy/network error may not have a JSON response.
    }
  }
  const status = response?.status;
  const code = body?.code || body?.error_code || '';
  let message = body?.message || (typeof body?.error === 'string' ? body.error : null) || error?.message || fallback;
  if (status === 401 || ['AUTH_REQUIRED', 'AUTH_INVALID', 'INVALID_JWT'].includes(code)) {
    message = 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
  } else if (status === 403 || ['ROLE_NOT_ALLOWED', 'PROFILE_NOT_FOUND', 'TARGET_NOT_ALLOWED'].includes(code)) {
    message = 'No tienes permisos para realizar esta operación.';
  } else if (status === 429) {
    message = 'Se alcanzó el límite de envíos. Espera unos minutos antes de intentarlo nuevamente.';
  }
  return { code, message, status };
};
