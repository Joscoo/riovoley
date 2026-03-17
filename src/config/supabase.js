import { createClient } from '@supabase/supabase-js'

// Obtener las variables de entorno con valores por defecto para desarrollo
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

// Debug solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Config Debug:')
  console.log('URL:', supabaseUrl ? '✅ OK' : '❌ Missing')
  console.log('Key:', supabaseAnonKey ? '✅ OK' : '❌ Missing')
}

// Verificar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Configuración de Supabase incompleta:
- URL: ${supabaseUrl ? 'OK' : 'FALTANTE'}
- Anon Key: ${supabaseAnonKey ? 'OK' : 'FALTANTE'}

Verifica que el archivo .env.local contenga:
REACT_APP_SUPABASE_URL=tu-url
REACT_APP_SUPABASE_ANON_KEY=tu-clave

Y reinicia el servidor de desarrollo (npm start).`
  
  console.error(errorMsg)
  throw new Error(errorMsg)
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función de utilidad para verificar si el usuario está autenticado
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    if (error.name !== 'AuthSessionMissingError') {
      console.error('Error al obtener el usuario:', error)
    }
    return null
  }
  return user
}

// Función para obtener el usuario con su perfil y rol
export const getCurrentUserWithProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error al obtener el usuario:', userError)
      return null
    }
    
    if (!user) return null

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error al obtener perfil:', profileError)
      // Retornar usuario sin perfil si no existe
      return { ...user, profile: null, role: null }
    }

    return { ...user, profile, role: profile.role }
  } catch (error) {
    console.error('Error en getCurrentUserWithProfile:', error)
    return null
  }
}

// Función de utilidad para cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error al cerrar sesión:', error)
  }
  return { error }
}