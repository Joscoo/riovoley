import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../config/supabase';
import { withEncryptedUserContactFields } from '../../../../utils/piiCrypto';
import { MIN_ATHLETE_AGE, validateAthleteBirthDate } from '../../../../utils/athleteValidation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(['administrador', 'entrenador', 'estudiante', 'usuario']);

const sanitizeText = (value, maxLength = 120) =>
  String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);

const normalizeEmail = (value) => sanitizeText(value, 120).toLowerCase();

const validateUserPayload = ({ email, nombre, apellido, fecha_nacimiento, role }) => {
  const normalizedEmail = normalizeEmail(email);
  const safeNombre = sanitizeText(nombre, 60);
  const safeApellido = sanitizeText(apellido, 60);
  const safeRole = sanitizeText(role || 'estudiante', 30).toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Email invalido. Verifica el formato antes de continuar.');
  }

  if (!safeNombre || !safeApellido) {
    throw new Error('Nombre y apellido son obligatorios.');
  }

  if (!fecha_nacimiento) {
    throw new Error('La fecha de nacimiento es obligatoria.');
  }

  if (!ALLOWED_ROLES.has(safeRole)) {
    throw new Error('Rol invalido para provision de usuario.');
  }

  return {
    normalizedEmail,
    safeNombre,
    safeApellido,
    safeRole,
  };
};

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

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%';

  const randomInt = (max) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  const pick = (pool) => pool[randomInt(pool.length)];

  const passwordParts = [
    pick(uppercase),
    pick(lowercase),
    pick(digits),
    pick(symbols),
  ];

  for (let i = passwordParts.length; i < 12; i += 1) {
    passwordParts.push(pick(chars));
  }

  for (let i = passwordParts.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [passwordParts[i], passwordParts[j]] = [passwordParts[j], passwordParts[i]];
  }

  return passwordParts.join('');
};

const buildCredentialsEmailHtml = ({ nombreCompleto, email, newPassword, loginUrl }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenido a Rio Voley</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreCompleto}</strong>,</p>
          <p>Tus credenciales de acceso al sistema han sido actualizadas. A continuacion encontraras tu nueva contraseña temporal:</p>

          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña temporal:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${newPassword}</code></p>
          </div>

          <p><strong>IMPORTANTE:</strong> Por favor, cambia esta contraseña temporal despues de iniciar sesión por primera vez.</p>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Iniciar Sesión</a>
          </div>

          <p>Si tienes problemas para iniciar sesión, contacta al administrador.</p>
        </div>
        <div class="footer">
          <p>Este es un correo automatico, por favor no responder.</p>
          <p>&copy; 2026 Rio Voley - Sistema de Gestion de Atletas</p>
        </div>
      </div>
    </body>
  </html>
`;

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

    const {
      normalizedEmail,
      safeNombre,
      safeApellido,
      safeRole,
    } = validateUserPayload({
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      role,
    });
    const safeTelefono = sanitizeText(telefono, 30);

    const isolatedAuthClient = createIsolatedAuthClient();

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error verificando email: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error(`El email "${normalizedEmail}" ya esta registrado.`);
    }

    const temporaryPassword = generateTemporaryPassword();
    const authClient = isolatedAuthClient || supabase;

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: normalizedEmail,
      password: temporaryPassword,
      options: {
        data: {
          full_name: `${safeNombre} ${safeApellido}`,
          role: safeRole
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
      email: normalizedEmail,
      first_login: true,
      role: safeRole,
      nombre: safeNombre,
      apellido: safeApellido,
      fecha_nacimiento,
      telefono: safeTelefono || null
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
          full_name: `${safeNombre} ${safeApellido}`,
          role: safeRole
        }, { onConflict: 'id' })
        .select()
        .single();
    } catch (profileError) {
      console.warn('No se pudo crear perfil en user_profiles:', profileError?.message || profileError);
    }

    const { data: loginTest, error: loginError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
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
        email: normalizedEmail,
        password: temporaryPassword,
        loginUrl: 'https://riovoley.com/login'
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
      apellido = ''
    } = userData;

    if (!user_id) {
      throw new Error('No se encontro el identificador del usuario para reenviar credenciales.');
    }

    const safeEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(safeEmail)) {
      throw new Error('El email del usuario es invalido o esta vacio.');
    }

    const randomSuffix = (() => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buffer = new Uint8Array(6);
        crypto.getRandomValues(buffer);
        return Array.from(buffer, (item) => item.toString(16).padStart(2, '0')).join('');
      }
      return Math.random().toString(36).slice(2, 14);
    })();

    const requestId = `resend-${Date.now()}-${randomSuffix}`;
    const newPassword = generateTemporaryPassword();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No se encontro un token de sesion valido. Vuelve a iniciar sesion.');
    }

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
      const readableError = getResendErrorMessage(updateAuthError, updateData);
      throw new Error(`Error actualizando contrasena: ${readableError}`);
    }

    const { error: updateFirstLoginError } = await supabase
      .from('users')
      .update({ first_login: true })
      .eq('id', user_id);

    if (updateFirstLoginError) {
      console.warn('No se pudo marcar first_login=true tras reenviar credenciales:', updateFirstLoginError.message);
    }

    const nombreCompleto = `${sanitizeText(nombre, 60)} ${sanitizeText(apellido, 60)}`.trim();
    const loginUrl = 'https://riovoley.com/login';
    const emailHtml = buildCredentialsEmailHtml({
      nombreCompleto,
      email: safeEmail,
      newPassword,
      loginUrl
    });

    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'send-email',
      {
        body: {
          to: safeEmail,
          subject: 'Tus credenciales de acceso - Rio Voley',
          html: emailHtml
        }
      }
    );

    if (emailError) {
      console.warn('Error enviando email:', {
        requestId,
        message: emailError.message
      });
    }

    return {
      success: true,
      credentials: {
        email: safeEmail,
        password: newPassword,
        loginUrl
      },
      emailSent: Boolean(emailData?.success) && !emailError,
      emailError: emailError?.message,
      message: `Nueva contrasena temporal generada. ${!emailError ? 'Email enviado exitosamente.' : 'Email no pudo ser enviado, pero la contrasena fue actualizada.'}`,
      isNewPassword: true
    };
  }
}
