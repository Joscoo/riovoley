export const PRIMARY_ADMIN_USER_ID = 'ed007c47-be26-4df4-9395-0b67664b66a4';

export const isPrimaryAdminUserId = (userId) =>
  Boolean(userId && userId === PRIMARY_ADMIN_USER_ID);
