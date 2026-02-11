// src/services/userCreationWorking.js
import { supabase } from '../config/supabase';

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

    // Verificar si el email ya existe en public.users
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: temporaryPassword
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    const authUserId = authData.user.id;
    console.log('✅ Usuario creado en Auth con ID:', authUserId);

    // Crear usuario en public.users con el mismo ID
    // NOTA: NO guardamos password aquí por seguridad (Supabase Auth lo maneja)
    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email.trim(),
        // password: NO se guarda por seguridad
        role: role,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fecha_nacimiento: fecha_nacimiento,
        telefono: telefono || null
      })
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
        .insert({
          id: authUserId,
          full_name: `${nombre.trim()} ${apellido.trim()}`,
          role: role
        })
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

    // Cerrar sesión automática
    await supabase.auth.signOut();

    // VERIFICAR QUE FUNCIONA: Probar login inmediato
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: temporaryPassword
    });

    const canLogin = !loginError;
    
    if (loginTest?.user) {
      await supabase.auth.signOut();
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
        loginUrl: `${globalThis.location.origin}/login`
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
 * Reenvía credenciales generando una NUEVA contraseña temporal
 * NOTA: No se puede recuperar la contraseña anterior de Supabase Auth por seguridad
 */
export const resendWorkingCredentials = async (userData) => {
  const { 
    user_id,
    email
    // nombre y apellido disponibles si se necesitan en el futuro
  } = userData;

  try {
    console.log('🔐 Generando nueva contraseña temporal para reenviar credenciales...');

    // SIEMPRE generar nueva contraseña (no se puede recuperar la anterior)
    const newPassword = generateTemporaryPassword();
    
    console.log('🔑 Nueva contraseña temporal generada');

    // Obtener el token de sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa. Debes estar autenticado.');
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

    console.log('📊 Respuesta de Edge Function:', { updateData, updateAuthError });

    if (updateAuthError || !updateData?.success) {
      console.error('❌ Error detallado:', {
        error: updateAuthError,
        data: updateData,
        fullError: JSON.stringify({ updateAuthError, updateData }, null, 2)
      });
      throw new Error(`Error actualizando contraseña: ${updateAuthError?.message || updateData?.error || 'Error desconocido'}`);
    }

    console.log('✅ Contraseña actualizada en Supabase Auth');

    // Verificar que la nueva contraseña funciona
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: newPassword
    });

    const canLogin = !loginError;
    
    if (loginTest?.user) {
      await supabase.auth.signOut();
    }

    return {
      success: true,
      credentials: {
        email: email.trim(),
        password: newPassword,
        loginUrl: `${globalThis.location.origin}/login`
      },
      canLogin: canLogin,
      loginError: loginError?.message,
      message: `Nueva contraseña temporal generada. ${canLogin ? 'Login verificado.' : 'Puede requerir confirmación.'}`,
      isNewPassword: true // Siempre es nueva
    };

  } catch (error) {
    console.error('❌ Error en resendWorkingCredentials:', error);
    throw error;
  }
};