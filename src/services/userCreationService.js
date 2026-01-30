// src/services/userCreationService.js
import supabase from '../config/supabase';

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
 * Crea un usuario completo en Supabase Auth y en las tablas personalizadas
 */
export const createCompleteUser = async (userData) => {
  const { 
    email, 
    nombre, 
    apellido, 
    fecha_nacimiento, 
    telefono, 
    role = 'estudiante' 
  } = userData;

  try {
    console.log('🔐 Iniciando creación de usuario completo...');

    // Paso 1: Verificar si el email ya existe en auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (existingAuthUser.user) {
      throw new Error(`El email "${email}" ya está registrado en el sistema de autenticación.`);
    }

    // Paso 2: Verificar si el email ya existe en public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error verificando email: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error(`El email "${email}" ya está registrado en la base de datos.`);
    }

    // Paso 3: Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();
    console.log('🔑 Contraseña temporal generada');

    // Paso 4: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: temporaryPassword,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        full_name: `${nombre} ${apellido}`,
        role: role,
        created_by_admin: true,
        temporary_password: true
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    const authUserId = authData.user.id;
    console.log('✅ Usuario creado en Auth con ID:', authUserId);

    // Paso 5: Crear usuario en public.users con el mismo ID de auth
    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authUserId, // Usar el mismo ID que auth.users
        email: email.trim(),
        password: 'hashed_by_supabase', // Placeholder, la real está en auth
        role: role,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fecha_nacimiento: fecha_nacimiento,
        telefono: telefono || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (publicUserError) {
      // Si falla, limpiar el usuario de auth
      await supabase.auth.admin.deleteUser(authUserId);
      throw new Error(`Error creando usuario en tabla pública: ${publicUserError.message}`);
    }

    console.log('✅ Usuario creado en tabla pública');

    // Paso 6: Crear perfil en user_profiles si existe esa tabla
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUserId,
          full_name: `${nombre} ${apellido}`,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('⚠️ No se pudo crear perfil (tabla user_profiles puede no existir):', profileError.message);
      } else {
        console.log('✅ Perfil creado en user_profiles');
      }
    } catch (error_) {
      console.warn('⚠️ Error creando perfil:', error_.message);
    }

    return {
      success: true,
      user: publicUserData,
      authUser: authData.user,
      temporaryPassword: temporaryPassword,
      message: `Usuario creado exitosamente. Contraseña temporal: ${temporaryPassword}`
    };

  } catch (error) {
    console.error('❌ Error en createCompleteUser:', error);
    throw error;
  }
};

/**
 * Crea un estudiante completo (usuario + registro en students)
 */
export const createCompleteStudent = async (studentData) => {
  const {
    // Datos de usuario
    email,
    nombre,
    apellido,
    fecha_nacimiento,
    telefono,
    // Datos específicos de estudiante
    categoria,
    nivel_experiencia,
    objetivos,
    contacto_emergencia_nombre,
    contacto_emergencia_telefono,
    observaciones_medicas
  } = studentData;

  try {
    console.log('👨‍🎓 Iniciando creación de estudiante completo...');

    // Paso 1: Crear usuario completo
    const userResult = await createCompleteUser({
      email,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      role: 'estudiante'
    });

    const userId = userResult.user.id;
    console.log('✅ Usuario base creado, ahora creando registro de estudiante...');

    // Paso 2: Crear registro en students
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        categoria: categoria,
        nivel_experiencia: nivel_experiencia || null,
        objetivos: objetivos || null,
        contacto_emergencia_nombre: contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: contacto_emergencia_telefono || null,
        observaciones_medicas: observaciones_medicas || null,
        estado: 'activo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (studentError) {
      // Si falla, limpiar el usuario creado
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('users').delete().eq('id', userId);
      throw new Error(`Error creando registro de estudiante: ${studentError.message}`);
    }

    console.log('✅ Registro de estudiante creado');

    return {
      success: true,
      user: userResult.user,
      student: studentRecord,
      temporaryPassword: userResult.temporaryPassword,
      message: `Estudiante creado exitosamente. Contraseña temporal: ${userResult.temporaryPassword}`
    };

  } catch (error) {
    console.error('❌ Error en createCompleteStudent:', error);
    throw error;
  }
};

/**
 * Envía las credenciales al usuario por email
 * En el futuro se puede integrar con servicios como SendGrid, Nodemailer, etc.
 */
export const sendCredentialsEmail = async (email, temporaryPassword, fullName) => {
  // Futuro: Implementar envío de email con servicios como SendGrid o Nodemailer
  console.log('[EMAIL] Enviando credenciales por email a:', email);
  console.log('Nombre:', fullName);
  console.log('Contraseña temporal:', temporaryPassword);
  
  // Por ahora solo logueamos, pero aquí se puede integrar con un servicio de email
  return {
    success: true,
    message: 'Credenciales registradas (email pendiente de implementar)'
  };
};