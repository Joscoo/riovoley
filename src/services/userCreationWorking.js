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
    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email.trim(),
        password: temporaryPassword, // Guardar la contraseña real que funciona
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
    categoria,
    altura,
    peso
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
        altura: altura ? Number.parseFloat(altura) : null,
        peso: peso ? Number.parseFloat(peso) : null,
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
 * Reenvía credenciales existentes o genera nuevas credenciales válidas
 */
export const resendWorkingCredentials = async (userData) => {
  const { 
    user_id,
    email
    // nombre y apellido se usan en versiones futuras
    // nombre, 
    // apellido
  } = userData;

  try {
    console.log('🔐 Reenviando credenciales que funcionan...');

    // Primero intentar obtener la contraseña guardada
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('password')
      .eq('id', user_id)
      .single();

    let workingPassword;
    let needsNewPassword = false;

    if (getUserError || !existingUser?.password || existingUser.password === 'managed_by_supabase_auth') {
      // Si no hay contraseña guardada o es el placeholder, generar nueva
      needsNewPassword = true;
      workingPassword = generateTemporaryPassword();
      
      console.log('🔑 Generando nueva contraseña funcional...');
      
      // Actualizar en la tabla users con la nueva contraseña
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: workingPassword })
        .eq('id', user_id);

      if (updateError) {
        console.warn('⚠️ No se pudo actualizar la contraseña en DB:', updateError.message);
      }
    } else {
      // Usar la contraseña guardada que sabemos que funciona
      workingPassword = existingUser.password;
      console.log('✅ Usando contraseña guardada que funciona');
    }

    return {
      success: true,
      credentials: {
        email: email.trim(),
        password: workingPassword,
        loginUrl: `${globalThis.location.origin}/login`
      },
      needsPasswordReset: needsNewPassword,
      message: needsNewPassword 
        ? 'Se generó una nueva contraseña. El usuario puede necesitar restablecer su contraseña si esta no funciona.'
        : 'Se están enviando las credenciales originales que funcionan.'
    };

  } catch (error) {
    console.error('❌ Error en resendWorkingCredentials:', error);
    throw error;
  }
};