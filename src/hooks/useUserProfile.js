// src/hooks/useUserProfile.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

export const useUserProfile = (user) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedUserRef = useRef(null);

  useEffect(() => {
    // Evitar cargar el mismo usuario múltiples veces
    if (user && user.id !== loadedUserRef.current) {
      loadedUserRef.current = user.id;
      loadUserProfile(user);
    } else if (!user) {
      loadedUserRef.current = null;
      setProfile(null);
      setError(null);
    }
  }, [user?.id]); // Solo reaccionar al cambio de ID del usuario

  const loadUserProfile = async (currentUser) => {
    setLoading(true);
    setError(null);
    
    try {
      // Primero intentar obtener desde user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role, organization_id, full_name, created_at')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error al obtener perfil desde user_profiles:', profileError);
      }

      // Si existe en user_profiles, usar ese rol
      if (profileData) {
        console.log('👤 Perfil encontrado en user_profiles:', profileData);
        setProfile(profileData);
        setLoading(false);
        return;
      }

      // Si no existe en user_profiles, buscar en la tabla users
      console.log('🔍 Buscando rol en tabla users...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, nombre, apellido')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('Error al obtener usuario desde users:', userError);
        setError(userError);
        setProfile(null);
      } else if (userData && userData.role) {
        // Crear perfil básico con el rol de la tabla users
        console.log('✅ Rol encontrado en tabla users:', userData);
        const basicProfile = {
          id: userData.id,
          role: userData.role,
          full_name: `${userData.nombre || ''} ${userData.apellido || ''}`.trim(),
          organization_id: null,
          created_at: null
        };
        setProfile(basicProfile);
        
        // Opcionalmente, crear el registro en user_profiles para futuras consultas
        try {
          await supabase
            .from('user_profiles')
            .insert(basicProfile);
          console.log('📝 Perfil sincronizado en user_profiles');
        } catch (syncError) {
          console.log('ℹ️ No se pudo sincronizar a user_profiles (puede que ya exista)');
        }
      } else {
        // No se encontró en ninguna tabla, crear perfil básico
        console.log('📝 No se encontró rol, creando perfil básico...');
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || null,
            role: 'usuario'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error al crear perfil:', insertError);
          setError(insertError);
          setProfile(null);
        } else {
          console.log('✅ Perfil creado:', newProfile);
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Error en loadUserProfile:', err);
      setError(err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) {
      loadUserProfile(user);
    }
  };

  return {
    profile,
    loading,
    error,
    refreshProfile,
    hasRole: (role) => profile?.role?.toLowerCase() === role?.toLowerCase(),
    isAdmin: () => profile?.role?.toLowerCase() === 'administrador',
    isModerator: () => ['administrador', 'entrenador'].includes(profile?.role?.toLowerCase()),
    isCoach: () => profile?.role?.toLowerCase() === 'entrenador',
    isStudent: () => ['estudiante', 'usuario'].includes(profile?.role?.toLowerCase()),
    isUser: () => profile?.role?.toLowerCase() === 'usuario',
    getRoleColor: () => {
      const roleColors = {
        'administrador': '#dc3545',  // Rojo para administrador
        'entrenador': '#fd7e14',     // Naranja para entrenador
        'estudiante': '#28a745',     // Verde para estudiante
        'usuario': '#28a745'         // Verde para usuario (tratado como estudiante)
      };
      return roleColors[profile?.role?.toLowerCase()] || '#17a2b8';
    }
  };
};