import { useState, useEffect, useRef } from 'react';
import { authProfileService } from '../features/auth-profile';

export const useUserProfile = (user) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedUserRef = useRef(null);

  const loadUserProfile = async (currentUser) => {
    setLoading(true);
    setError(null);

    try {
      const resolvedProfile = await authProfileService.loadUserProfile(currentUser);
      setProfile(resolvedProfile || null);
    } catch (err) {
      console.error('Error en useUserProfile.loadUserProfile:', err);
      setError(err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id !== loadedUserRef.current) {
      loadedUserRef.current = user.id;
      loadUserProfile(user);
    } else if (!user) {
      loadedUserRef.current = null;
      setProfile(null);
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
