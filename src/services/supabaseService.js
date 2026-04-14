// src/services/supabaseService.js
import { supabase } from '../config/supabase';
import { getEcuadorISOString } from '../utils/dateUtils';
import { withEncryptedUserContactFields } from '../utils/piiCrypto';

// ==================== OPERACIONES DE PERFILES DE USUARIO ====================

/**
 * Obtener el perfil completo del usuario autenticado (incluye rol)
 */
export const getUserProfile = async () => {
  try {
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) {
      return { data: null, error: { message: 'Usuario no autenticado' } };
    }

    // Obtener perfil del usuario con rol
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, role, organization_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error };
    }

    console.log('[USER] Perfil del usuario:', data);
    return { data: { ...data, auth_user: user }, error: null };
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error);
    return { data: null, error };
  }
};

/**
 * Obtener solo el rol del usuario autenticado
 */
export const getUserRole = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) {
      return { data: null, error: { message: 'Usuario no autenticado' } };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return { data: null, error };
    }

    return { data: data.role, error: null };
  } catch (error) {
    console.error('Error al obtener rol del usuario:', error);
    return { data: null, error };
  }
};

/**
 * Crear o actualizar el perfil del usuario
 */
export const upsertUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: getEcuadorISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear/actualizar perfil:', error);
    return { data: null, error };
  }
};

/**
 * Obtener todos los usuarios (requiere RLS configurado)
 */
export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { data: null, error };
  }
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return { data: null, error };
  }
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (userData) => {
  try {
    const userPayload = await withEncryptedUserContactFields(userData);

    const { data, error } = await supabase
      .from('users')
      .insert([userPayload])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { data: null, error };
  }
};

/**
 * Actualizar un usuario
 */
export const updateUser = async (id, userData) => {
  try {
    const userPayload = await withEncryptedUserContactFields(userData);

    const { data, error } = await supabase
      .from('users')
      .update(userPayload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { data: null, error };
  }
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { data: null, error };
  }
};

// ==================== OPERACIONES GENÉRICAS ====================

/**
 * Ejecutar una consulta personalizada
 */
export const executeQuery = async (tableName, query) => {
  try {
    let supabaseQuery = supabase.from(tableName);
    
    // Aplicar filtros si existen
    if (query.select) {
      supabaseQuery = supabaseQuery.select(query.select);
    } else {
      supabaseQuery = supabaseQuery.select('*');
    }
    
    if (query.eq) {
      Object.entries(query.eq).forEach(([key, value]) => {
        supabaseQuery = supabaseQuery.eq(key, value);
      });
    }
    
    if (query.neq) {
      Object.entries(query.neq).forEach(([key, value]) => {
        supabaseQuery = supabaseQuery.neq(key, value);
      });
    }
    
    if (query.gt) {
      Object.entries(query.gt).forEach(([key, value]) => {
        supabaseQuery = supabaseQuery.gt(key, value);
      });
    }
    
    if (query.lt) {
      Object.entries(query.lt).forEach(([key, value]) => {
        supabaseQuery = supabaseQuery.lt(key, value);
      });
    }
    
    if (query.order) {
      supabaseQuery = supabaseQuery.order(query.order.column, { 
        ascending: query.order.ascending ?? true 
      });
    }
    
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en consulta personalizada:', error);
    return { data: null, error };
  }
};

/**
 * Insertar datos en cualquier tabla
 */
export const insertData = async (tableName, data) => {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error(`Error al insertar en ${tableName}:`, error);
    return { data: null, error };
  }
};

/**
 * Actualizar datos en cualquier tabla
 */
export const updateData = async (tableName, id, data) => {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error(`Error al actualizar en ${tableName}:`, error);
    return { data: null, error };
  }
};

/**
 * Eliminar datos de cualquier tabla
 */
export const deleteData = async (tableName, id) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error al eliminar de ${tableName}:`, error);
    return { data: null, error };
  }
};

// ==================== SUSCRIPCIONES EN TIEMPO REAL ====================

/**
 * Suscribirse a cambios en una tabla
 */
export const subscribeToTable = (tableName, callback, filters = {}) => {
  let subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: tableName,
        ...filters 
      }, 
      callback
    )
    .subscribe();
    
  return subscription;
};

/**
 * Desuscribirse de una suscripción
 */
export const unsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};