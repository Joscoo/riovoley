import { supabase } from '../../../config/supabase';

const getDeleteAuthErrorMessage = (invokeError, data) => {
  const backendCode = data?.code;
  const backendMessage = data?.message || data?.error;
  const rawMessage = invokeError?.message || backendMessage || 'Error desconocido';
  const lowered = rawMessage.toLowerCase();

  if (backendCode === 'AUTH_REQUIRED' || lowered.includes('token') || lowered.includes('autoriz')) {
    return 'Tu sesión expiro o no es valida. Inicia sesión nuevamente e intenta otra vez.';
  }

  if (backendCode === 'ROLE_NOT_ALLOWED' || backendCode === 'PROFILE_NOT_FOUND' || lowered.includes('permis')) {
    return 'No tienes permisos para eliminar usuarios de autenticacion.';
  }

  if (backendCode === 'MISSING_FIELDS' || backendCode === 'INVALID_REQUEST') {
    return 'No se recibio un identificador de usuario valido para eliminar en Auth.';
  }

  if (backendCode === 'AUTH_DELETE_FAILED') {
    return backendMessage || 'No se pudo eliminar el usuario de Auth.';
  }

  return backendMessage || rawMessage;
};

export const deleteAuthUserById = async (userId) => {
  if (!userId) {
    throw new Error('No se proporciono userId para eliminar en Auth.');
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No hay sesión activa para autorizar la eliminacion en Auth.');
  }

  const { data, error } = await supabase.functions.invoke('delete-auth-user', {
    body: { userId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error || !data?.success) {
    const readableError = getDeleteAuthErrorMessage(error, data);
    throw new Error(readableError);
  }

  return data;
};
