// src/services/userCreationWorking.js
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { withEncryptedUserContactFields } from '../utils/piiCrypto';
import { MIN_ATHLETE_AGE, validateAthleteBirthDate } from '../utils/athleteValidation';

const createIsolatedAuthClient = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Cliente aislado para no modificar la sesion del usuario actual en la app.
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const getResendErrorMessage = (invokeError, data) => {
  const backendCode = data?.code;
  const backendMessage = data?.message || data?.error;
  const rawMessage = invokeError?.message || backendMessage || 'Error desconocido';
  const lowered = rawMessage.toLowerCase();

  if (backendCode === 'AUTH_REQUIRED' || lowered.includes('token') || lowered.includes('autoriz')) {
    return 'Tu sesión expiró o no es válida. Inicia sesión nuevamente y vuelve a intentarlo.';
  }

  if (backendCode === 'ROLE_NOT_ALLOWED' || backendCode === 'PROFILE_NOT_FOUND' || lowered.includes('permis')) {
    return 'No tienes permisos para reenviar credenciales. Se requiere rol administrador o entrenador.';
  }

  if (backendCode === 'INVALID_REQUEST' || backendCode === 'MISSING_FIELDS' || lowered.includes('required')) {
    return 'Los datos del usuario están incompletos para reenviar credenciales.';
  }

  return backendMessage || rawMessage;
};

/**
 * Genera una contraseña temporal segura
 */
export const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  
  // Asegurar al menos una mayúscula, minúscula, número y símbolo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%'[Math.floor(Math.random() * 5)];
  
  // Completar hasta 12 caracteres
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Crea un usuario usando exactamente el mismo método que funciona en confirm-fix
 */
export const createUserWorking = async (userData) => {
  const { 
    email, 
    nombre, 
    apellido, 
    fecha_nacimiento, 
    telefono, 
    role = 'estudiante' 
  } = userData;

  try {
    console.log('🔐 Creando usuario con método que funciona...');
    const isolatedAuthClient = createIsolatedAuthClient();

    // Verificar si el email ya existe en core.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error verificando email: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error(`El email "${email}" ya está registrado.`);
    }

    // Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();
    console.log('🔑 Contraseña temporal generada');

    // MÉTODO QUE FUNCIONA: signUp simple como en confirm-fix
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
    console.log('✅ Usuario creado en Auth con ID:', authUserId);

    // Crear usuario en core.users con el mismo ID
    // NOTA: NO guardamos password aquí por seguridad (Supabase Auth lo maneja)
    const userInsertPayload = await withEncryptedUserContactFields({
      id: authUserId,
      email: email.trim(),
      // password: NO se guarda por seguridad
      first_login: true,
      role: role,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fecha_nacimiento: fecha_nacimiento,
      telefono: telefono || null
    });

    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert(userInsertPayload)
      .select()
      .single();

    if (publicUserError) {
      console.error('❌ Error creando usuario en tabla pública:', publicUserError);
      throw new Error(`Error creando usuario en tabla pública: ${publicUserError.message}`);
    }

    console.log('✅ Usuario creado en tabla pública');

    // Crear perfil en user_profiles con el rol correspondiente
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUserId,
          full_name: `${nombre.trim()} ${apellido.trim()}`,
          role: role
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.warn('⚠️ No se pudo crear perfil en user_profiles:', profileError.message);
      } else {
        console.log('✅ Perfil creado en user_profiles con rol:', role);
      }
    } catch (profileError) {
      console.warn('⚠️ Error al crear perfil en user_profiles:', profileError);
    }

    // VERIFICAR QUE FUNCIONA: Probar login inmediato
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
      temporaryPassword: temporaryPassword,
      canLogin: canLogin,
      loginError: loginError?.message,
      message: `Usuario creado exitosamente. Contraseña temporal: ${temporaryPassword}`,
      credentials: {
        email: email.trim(),
        password: temporaryPassword,
        loginUrl: 'https://riovoley.com/login'
      }
    };

  } catch (error) {
    console.error('❌ Error en createUserWorking:', error);
    throw error;
  }
};

/**
 * Crea un estudiante completo usando el método que funciona
 */
export const createStudentWorking = async (studentData) => {
  const {
    email,
    nombre,
    apellido,
    fecha_nacimiento,
    telefono,
    categoria
  } = studentData;

  try {
    console.log('👨‍🎓 Creando estudiante con método que funciona...');

    const birthDateValidation = validateAthleteBirthDate(fecha_nacimiento, MIN_ATHLETE_AGE);
    if (!birthDateValidation.isValid) {
      throw new Error(birthDateValidation.error);
    }

    // Crear usuario base
    const userResult = await createUserWorking({
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      role: 'estudiante'
    });

    const userId = userResult.user.id;

    // Crear registro de estudiante
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        categoria: categoria,
        fecha_nacimiento: fecha_nacimiento
      })
      .select()
      .single();

    if (studentError) {
      console.error('❌ Error creando estudiante:', studentError);

      // Rollback best-effort en tablas de app para evitar registros parciales.
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
        await supabase.from('users').delete().eq('id', userId);
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback de tablas app tras fallo en students:', rollbackError);
      }

      throw new Error(`Error creando registro de estudiante: ${studentError.message}`);
    }

    console.log('✅ Estudiante creado completamente');

    return {
      success: true,
      user: userResult.user,
      student: studentRecord,
      temporaryPassword: userResult.temporaryPassword,
      canLogin: userResult.canLogin,
      loginError: userResult.loginError,
      credentials: userResult.credentials,
      message: `Estudiante creado exitosamente. ${userResult.canLogin ? 'Puede hacer login inmediatamente.' : 'Puede requerir confirmación de email.'}`
    };

  } catch (error) {
    console.error('❌ Error en createStudentWorking:', error);
    throw error;
  }
};

/**
 * Reenvía credenciales generando una NUEVA contraseña temporal y enviando email
 * NOTA: No se puede recuperar la contraseña anterior de Supabase Auth por seguridad
 */
export const resendWorkingCredentials = async (userData) => {
  const { 
    user_id,
    email,
    nombre = 'Usuario',
    apellido = ''
  } = userData;

  try {
    if (!user_id) {
      throw new Error('No se encontró el identificador del usuario para reenviar credenciales.');
    }

    if (!email || !email.includes('@')) {
      throw new Error('El email del usuario es inválido o está vacío.');
    }

    console.log('🔐 Generando nueva contraseña temporal para reenviar credenciales...');
    const requestId = `resend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // SIEMPRE generar nueva contraseña (no se puede recuperar la anterior)
    const newPassword = generateTemporaryPassword();
    
    console.log('🔑 Nueva contraseña temporal generada');

    // Obtener el token de sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa. Debes estar autenticado.');
    }

    if (!session.access_token) {
      throw new Error('No se encontró un token de sesión válido. Vuelve a iniciar sesión.');
    }

    // Actualizar la contraseña usando Edge Function
    const { data: updateData, error: updateAuthError } = await supabase.functions.invoke(
      'update-user-password',
      {
        body: { 
          userId: user_id, 
          newPassword: newPassword 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    console.log('📊 Respuesta de Edge Function update-user-password:', {
      requestId,
      success: updateData?.success,
      code: updateData?.code,
      status: updateAuthError?.context?.response?.status,
      hasError: !!updateAuthError
    });

    if (updateAuthError || !updateData?.success) {
      console.error('❌ Error detallado:', {
        requestId,
        error: updateAuthError,
        data: updateData,
        fullError: JSON.stringify({ updateAuthError, updateData }, null, 2)
      });

      const readableError = getResendErrorMessage(updateAuthError, updateData);
      throw new Error(`Error actualizando contraseña: ${readableError}`);
    }

    console.log('✅ Contraseña actualizada en Supabase Auth');

    // Marcar que debe cambiar contraseña en el próximo ingreso.
    const { error: updateFirstLoginError } = await supabase
      .from('users')
      .update({ first_login: true })
      .eq('id', user_id);

    if (updateFirstLoginError) {
      console.warn('⚠️ No se pudo marcar first_login=true tras reenviar credenciales:', updateFirstLoginError.message);
    }

    // Enviar email con las credenciales usando Resend
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    // Usar la URL de producción
    const loginUrl = 'https://riovoley.com/login';
    
    const emailHtml = `
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
              <h1>🏐 Bienvenido a Rio Voley</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombreCompleto}</strong>,</p>
              <p>Tus credenciales de acceso al sistema han sido actualizadas. A continuación encontrarás tu nueva contraseña temporal:</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>🔑 Contraseña temporal:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${newPassword}</code></p>
              </div>

              <p><strong>⚠️ IMPORTANTE:</strong> Por favor, cambia esta contraseña temporal después de iniciar sesión por primera vez.</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Iniciar Sesión</a>
              </div>

              <p>Si tienes problemas para iniciar sesión, contacta al administrador.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
              <p>&copy; 2026 Rio Voley - Sistema de Gestión de Atletas</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('📧 Enviando email con credenciales...');

    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'send-email',
      {
        body: {
          to: email,
          subject: '🔑 Tus credenciales de acceso - Rio Voley',
          html: emailHtml
        }
      }
    );

    console.log('📊 Respuesta de Edge Function send-email:', {
      requestId,
      success: emailData?.success,
      hasError: !!emailError,
      status: emailError?.context?.response?.status
    });

    if (emailError) {
      console.warn('⚠️ Error enviando email:', emailError);
      // No lanzar error, solo advertir - el usuario fue creado exitosamente
    }

    return {
      success: true,
      credentials: {
        email: email.trim(),
        password: newPassword,
        loginUrl: loginUrl
      },
      emailSent: !emailError,
      emailError: emailError?.message,
      message: `Nueva contraseña temporal generada. ${!emailError ? 'Email enviado exitosamente.' : 'Email no pudo ser enviado, pero la contraseña fue actualizada.'}`,
      isNewPassword: true // Siempre es nueva
    };

  } catch (error) {
    console.error('❌ Error en resendWorkingCredentials:', error);
    throw error;
  }
};