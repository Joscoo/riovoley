import { useState, useCallback } from 'react';
import { userManagementService } from '../../../userManagementService';

export const useUserActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const runAction = useCallback(async (action, fallbackMessage) => {
    setLoading(true);
    setError(null);

    try {
      return await action();
    } catch (err) {
      const errorMessage = err?.message || fallbackMessage;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = useCallback(
    async (formData, userType) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'create',
            payload: { formData, userType },
          }),
        'Error al crear usuario'
      ),
    [runAction],
  );

  const handleEdit = useCallback(
    async (userId, formData, userType) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'edit',
            payload: { userId, formData, userType },
          }),
        'Error al editar usuario'
      ),
    [runAction],
  );

  const handleDelete = useCallback(
    async (userId, userType) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'delete',
            payload: { userId, userType },
          }),
        'Error al eliminar usuario'
      ),
    [runAction],
  );

  const handleSuspend = useCallback(
    async (userId, reason, until) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'suspend',
            payload: { userId, reason, until },
          }),
        'Error al suspender usuario'
      ),
    [runAction],
  );

  const handleReactivate = useCallback(
    async (userId) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'reactivate',
            payload: { userId },
          }),
        'Error al reactivar usuario'
      ),
    [runAction],
  );

  const handleResendCredentials = useCallback(
    async (userId, channels = ['email']) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'resend_credentials',
            payload: { userId, channels },
          }),
        'Error al reenviar credenciales'
      ),
    [runAction],
  );

  const handleChangeRole = useCallback(
    async (userId, newRole) =>
      runAction(
        () =>
          userManagementService.performAction({
            actionType: 'change_role',
            payload: { userId, newRole },
          }),
        'Error al cambiar rol'
      ),
    [runAction],
  );

  return {
    handleCreate,
    handleEdit,
    handleDelete,
    handleSuspend,
    handleReactivate,
    handleResendCredentials,
    handleChangeRole,
    loading,
    error,
    clearError,
  };
};

export default useUserActions;


