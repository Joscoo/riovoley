import { useMemo } from 'react';
import { userManagementService } from '../../../userManagementService';

export const useUserPermissions = ({ userRole, targetUserType }) => {
  const permissions = useMemo(
    () =>
      userManagementService.getPermissions({
        userRole,
        targetUserType,
      }),
    [userRole, targetUserType]
  );

  return permissions;
};

export default useUserPermissions;



