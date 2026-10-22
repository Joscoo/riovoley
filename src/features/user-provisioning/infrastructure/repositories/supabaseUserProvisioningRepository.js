import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../config/supabase';
import { withEncryptedUserContactFields } from '../../../../utils/piiCrypto';
import { MIN_ATHLETE_AGE, validateAthleteBirthDate } from '../../../../utils/athleteValidation';
import { generateRandomPassword as generateTemporaryPassword } from '../../../../utils/passwordUtils';
import { readFunctionError } from '../../../../shared/infrastructure/http/functionError';
import { communicationsService } from '../../../communications';
import { APP_LOGIN_URL } from '../../../../config/appUrls';

const createIsolatedAuthClient = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: noopStorage,
      storageKey: 'sb-isolated-auth-token'
    },
  });
};

const getResendErrorMessage = (invokeError, data) => {
  const backendCode = data?.code;
  const backendMessage = data?.message || data?.error;
  const rawMessage = invokeError?.message || backendMessage || 'Error desconocido';
  const lowered = rawMessage.toLowerCase();

  if (backendCode === 'AUTH_REQUIRED' || lowered.includes('token') || lowered.includes('autoriz')) {
    return 'Tu sesión expiro o no es valida. Inicia sesión nuevamente y vuelve a intentarlo.';
  }

  if (backendCode === 'ROLE_NOT_ALLOWED' || backendCode === 'PROFILE_NOT_FOUND' || lowered.includes('permis')) {
    return 'No tienes permisos para reenviar credenciales. Se requiere rol administrador o entrenador.';
  }

  if (backendCode === 'INVALID_REQUEST' || backendCode === 'MISSING_FIELDS' || lowered.includes('required')) {
    return 'Los datos del usuario estan incompletos para reenviar credenciales.';
  }

  return backendMessage || rawMessage;
};

export class SupabaseUserProvisioningRepository {
  async createUser(userData) {
    const {
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      role = 'estudiante'
    } = userData;

    const isolatedAuthClient = createIsolatedAuthClient();

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error verificando email: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error(`El email "${email}" ya esta registrado.`);
    }

    const temporaryPassword = generateTemporaryPassword();
    const authClient = isolatedAuthClient || supabase;

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: email.trim(),
      password: temporaryPassword,
      options: {
        data: {
          full_name: `${nombre.trim()} ${apellido.trim()}`,
          role
        }
      }
    });

    if (authError) {
      const authMessage = authError.message || '';
      if (authMessage.toLowerCase().includes('user already registered')) {
        throw new Error(
          'Error creando usuario en Auth: User already registered. Existe un usuario en auth.users con ese email (posible huerfano). Eliminalo de auth.users o sincronizalo en core.users antes de reintentar.'
        );
      }
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    const authUserId = authData.user.id;

    const userInsertPayload = await withEncryptedUserContactFields({
      id: authUserId,
      email: email.trim(),
      first_login: true,
      role,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fecha_nacimiento,
      telefono: telefono || null
    });

    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert(userInsertPayload)
      .select()
      .single();

    if (publicUserError) {
      throw new Error(`Error creando usuario en tabla publica: ${publicUserError.message}`);
    }

    try {
      await supabase
        .from('user_profiles')
        .upsert({
          id: authUserId,
          full_name: `${nombre.trim()} ${apellido.trim()}`,
          role
        }, { onConflict: 'id' })
        .select()
        .single();
    } catch (profileError) {
      console.warn('No se pudo crear perfil en user_profiles:', profileError?.message || profileError);
    }

    const { data: loginTest, error: loginError } = await authClient.auth.signInWithPassword({
      email: email.trim(),
      password: temporaryPassword
    });

    const canLogin = !loginError;
    if (loginTest?.user) {
      await authClient.auth.signOut();
    }

    return {
      success: true,
      user: publicUserData,
      authUser: authData.user,
      temporaryPassword,
      canLogin,
      loginError: loginError?.message,
      message: `Usuario creado exitosamente. Contraseña temporal: ${temporaryPassword}`,
      credentials: {
        email: email.trim(),
        password: temporaryPassword,
        loginUrl: APP_LOGIN_URL
      }
    };
  }

  async createStudent(studentData) {
    const {
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      categoria
    } = studentData;

    const birthDateValidation = validateAthleteBirthDate(fecha_nacimiento, MIN_ATHLETE_AGE);
    if (!birthDateValidation.isValid) {
      throw new Error(birthDateValidation.error);
    }

    const userResult = await this.createUser({
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      role: 'estudiante'
    });

    const userId = userResult.user.id;

    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        categoria,
        fecha_nacimiento
      })
      .select()
      .single();

    if (studentError) {
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
        await supabase.from('users').delete().eq('id', userId);
      } catch (rollbackError) {
        console.error('Error en rollback de tablas app tras fallo en students:', rollbackError);
      }

      throw new Error(`Error creando registro de estudiante: ${studentError.message}`);
    }

    return {
      success: true,
      user: userResult.user,
      student: studentRecord,
      temporaryPassword: userResult.temporaryPassword,
      canLogin: userResult.canLogin,
      loginError: userResult.loginError,
      credentials: userResult.credentials,
      message: `Estudiante creado exitosamente. ${userResult.canLogin ? 'Puede hacer login inmediatamente.' : 'Puede requerir confirmacion de email.'}`
    };
  }

  async resendCredentials(userData) {
    const {
      user_id,
      email,
      nombre = 'Usuario',
      apellido = '',
      channels = ['email']
    } = userData;

    if (!user_id) {
      throw new Error('No se encontro el identificador del usuario para reenviar credenciales.');
    }

    if (!email || !email.includes('@')) {
      throw new Error('El email del usuario es inválido o esta vacio.');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No se encontro un token de sesión valido. Vuelve a iniciar sesión.');
    }
    const newPassword = generateTemporaryPassword();

    const { data: updateData, error: updateAuthError } = await supabase.functions.invoke(
      'update-user-password',
      {
        body: {
          userId: user_id,
          newPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    if (updateAuthError || !updateData?.success) {
      const backendError = await readFunctionError(updateAuthError, updateData);
      const readableError = getResendErrorMessage(backendError, { code: backendError.code, message: backendError.message });
      throw new Error(`Error actualizando contraseña: ${readableError}`);
    }

    let firstLoginUpdated = updateData?.firstLoginUpdated === true;
    if (!firstLoginUpdated) {
      try {
        const { error } = await supabase.from('users').update({ first_login: true }).eq('id', user_id);
        firstLoginUpdated = !error;
      } catch (_error) {
        firstLoginUpdated = false;
      }
    }

    const loginUrl = APP_LOGIN_URL;
    const targetEmail = updateData?.email || email.trim();
    let emailResult = null;
    if (channels.includes('email')) {
      try {
        emailResult = await communicationsService.sendCredentials({ email: targetEmail, nombre, apellido, password: newPassword, isResend: true });
      } catch (error) {
        emailResult = { success: false, error: error.message || 'No se pudo confirmar el envío del correo.' };
      }
    }

    return {
      success: true,
      credentials: {
        email: targetEmail,
        password: newPassword,
        loginUrl
      },
      emailSent: emailResult?.success === true,
      emailError: emailResult?.error,
      firstLoginUpdated,
      message: emailResult?.success
        ? 'Nueva contraseña temporal generada. El proveedor aceptó el correo.'
        : 'La contraseña fue actualizada. Conserva las credenciales: el correo no fue enviado.',
      isNewPassword: true
    };
  }
}
