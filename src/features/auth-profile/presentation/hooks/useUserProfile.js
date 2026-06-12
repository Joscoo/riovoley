import { useState, useEffect, useRef } from 'react';
import { authProfileService } from '../../authProfileService';

export const useUserProfile = (user) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedUserRef = useRef(null);
  const requestVersionRef = useRef(0);

  const loadUserProfile = async (currentUser) => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setError(null);

    try {
      const resolvedProfile = await authProfileService.loadUserProfile(currentUser);
      if (requestVersion !== requestVersionRef.current) return;
      setProfile(resolvedProfile || null);
    } catch (err) {
      if (requestVersion !== requestVersionRef.current) return;
      console.error('Error en useUserProfile.loadUserProfile:', err);
      setError(err);
      setProfile(null);
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id !== loadedUserRef.current) {
      loadedUserRef.current = user.id;
      loadUserProfile(user);
    } else if (!user) {
      requestVersionRef.current += 1;
      loadedUserRef.current = null;
      setProfile(null);
      setLoading(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refreshProfile = async () => {
    if (!user) return;
    loadedUserRef.current = null;
    await loadUserProfile(user);
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
        administrador: '#dc3545',
        entrenador: '#fd7e14',
        estudiante: '#28a745',
        usuario: '#28a745',
      };
      return roleColors[profile?.role?.toLowerCase()] || '#17a2b8';
    },
  };
};


