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
        .select('id, role, organization_id, full_name')
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
    isAdmin: () => profile?.role?.toLowerCase() === 'admin',
    isModerator: () => ['admin', 'moderador'].includes(profile?.role?.toLowerCase()),
    getRoleColor: () => {
      const roleColors = {
        'admin': '#dc3545',
        'moderador': '#fd7e14', 
        'usuario': '#28a745',
        'premium': '#6f42c1',
        'invitado': '#6c757d'
      };
      return roleColors[profile?.role?.toLowerCase()] || '#17a2b8';
    }
  };
};