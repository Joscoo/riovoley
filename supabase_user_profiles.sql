-- Crear tabla user_profiles en Supabase
-- Ejecuta este script en tu dashboard de Supabase (SQL Editor)

-- Crear la tabla user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'usuario' CHECK (role IN ('admin', 'moderador', 'usuario', 'premium', 'invitado')),
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON user_profiles(organization_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para que los administradores puedan ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para insertar perfiles (cuando se registra un usuario)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'usuario');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar algunos perfiles de ejemplo (opcional)
-- Reemplaza los UUIDs con los IDs reales de tus usuarios existentes

-- Ejemplo de cómo insertar perfiles manualmente:
-- INSERT INTO user_profiles (id, full_name, role) 
-- VALUES 
--   ('uuid-del-usuario-1', 'Administrador', 'admin'),
--   ('uuid-del-usuario-2', 'Moderador Test', 'moderador'),
--   ('uuid-del-usuario-3', 'Usuario Normal', 'usuario');

-- Para encontrar los UUIDs de tus usuarios existentes, ejecuta:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;