-- Script SQL simplificado para crear la tabla user_profiles
-- Ejecuta esto en tu Supabase SQL Editor

-- Verificar si la tabla existe y eliminarla si es necesario
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Crear la tabla user_profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'usuario' CHECK (role IN ('admin', 'administrador', 'moderador', 'usuario', 'premium', 'invitado')),
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para mejor performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios pueden ver y editar su propio perfil
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Insertar perfil para el usuario que ya tienes
-- Reemplaza el UUID con el ID real de tu usuario
INSERT INTO user_profiles (id, full_name, role) 
VALUES ('ed007c47-be26-4df4-9395-0b67664b66a4', 'Admin Usuario', 'admin')
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;