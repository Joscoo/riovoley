import { createClient } from '@supabase/supabase-js';
import { createSqlAuditLogger } from '../shared/infrastructure/audit/sqlAuditLogger';

// Obtain env vars with dev defaults
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Config Debug:');
  console.log('URL:', supabaseUrl ? 'OK' : 'Missing');
  console.log('Key:', supabaseAnonKey ? 'OK' : 'Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Configuracion de Supabase incompleta:\n- URL: ${supabaseUrl ? 'OK' : 'FALTANTE'}\n- Anon Key: ${supabaseAnonKey ? 'OK' : 'FALTANTE'}\n\nVerifica que el archivo .env.local contenga:\nREACT_APP_SUPABASE_URL=tu-url\nREACT_APP_SUPABASE_ANON_KEY=tu-clave\n\nY reinicia el servidor de desarrollo (npm start).`;

  console.error(errorMsg);
  throw new Error(errorMsg);
}

const rawSupabase = createClient(supabaseUrl, supabaseAnonKey);

const sqlAuditLogger = createSqlAuditLogger({
  supabaseUrl,
  supabaseAnonKey,
  baseClient: rawSupabase,
});

// Export the audited client so app actions are logged to audit.sql_executions / audit.sql_errors
export const supabase = sqlAuditLogger.createAuditedClient(rawSupabase);

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    if (error.name !== 'AuthSessionMissingError') {
      console.error('Error al obtener el usuario:', error);
    }
    return null;
  }
  return user;
};

export const getCurrentUserWithProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error al obtener el usuario:', userError);
      return null;
    }

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, organization_id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      return { ...user, profile: null, role: null };
    }

    return { ...user, profile, role: profile.role };
  } catch (error) {
    console.error('Error en getCurrentUserWithProfile:', error);
    return null;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesion:', error);
  }
  return { error };
};
