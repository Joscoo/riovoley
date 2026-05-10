import { useMemo } from 'react';

const PERMISSION_MATRIX = {
  // Administrador sobre Atletas
  administrador: {
    atleta: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: true
    },
    // Administrador sobre Entrenadores
    entrenador: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: true
    },
    // Administrador sobre Administradores
    administrador: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: true
    }
  },
  // Entrenador sobre Atletas
  entrenador: {
    atleta: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: false
    },
    // Entrenador sobre otros tipos (sin acceso)
    entrenador: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: false
    },
    administrador: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: false
    }
  }
};

export const useUserPermissions = ({ userRole, targetUserType }) => {
  const permissions = useMemo(() => {
    const normalizedRole = (userRole || '').toLowerCase();
    const normalizedTarget = (targetUserType || '').toLowerCase();

    // Si no hay rol o tipo de usuario, retornar permisos vacíos
    if (!normalizedRole || !normalizedTarget) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSuspend: false,
        canResendCredentials: false,
        canChangeRole: false
      };
    }

    // Obtener permisos de la matriz
    const rolePermissions = PERMISSION_MATRIX[normalizedRole];
    
    if (!rolePermissions) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSuspend: false,
        canResendCredentials: false,
        canChangeRole: false
      };
    }

    return rolePermissions[normalizedTarget] || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: false
    };
  }, [userRole, targetUserType]);

  return permissions;
};

export default useUserPermissions;