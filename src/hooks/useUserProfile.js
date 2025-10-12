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
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role, organization_id, full_name, created_at')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        // Si no existe el perfil, crear uno básico
        if (profileError.code === 'PGRST116') {
          console.log('📝 Perfil no encontrado, creando uno nuevo...');
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
        } else {
          console.error('Error al obtener perfil:', profileError);
          setError(profileError);
          setProfile(null);
        }
      } else {
        console.log('👤 Perfil encontrado:', data);
        setProfile(data);
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
    isUser: () => profile?.role?.toLowerCase() === 'usuario',
    getRoleColor: () => {
      const roleColors = {
        'administrador': '#dc3545',  // Rojo para administrador
        'entrenador': '#fd7e14',     // Naranja para entrenador  
        'usuario': '#28a745'         // Verde para usuario
      };
      return roleColors[profile?.role?.toLowerCase()] || '#17a2b8';
    }
  };
};