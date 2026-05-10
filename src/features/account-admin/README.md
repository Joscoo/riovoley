# account-admin

Feature clean-lite para administracion de cuentas y configuracion de perfil.

## Responsabilidades
- Gestionar usuarios (listar, editar, suspender/reactivar, eliminar).
- Gestionar datos de perfil del usuario autenticado.
- Gestionar cambio de contrasena desde un servicio desacoplado.

## Capas
- `presentation/createAccountAdminService.js`: casos de uso para admin de cuentas.
- `domain/accountAdminError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAccountAdminRepository.js`: adaptador Supabase (`users`, `user_profiles`, `auth`).
- Integracion de borrado Auth centralizada en `src/shared/infrastructure/auth/deleteAuthUserById.js`.

## Contrato publico
- `accountAdminService.loadUsuarios({ filters })`
- `accountAdminService.updateManagedUser({ editingUser, formData })`
- `accountAdminService.deleteManagedUser({ userId })`
- `accountAdminService.suspendManagedUser({ userId, reason, until })`
- `accountAdminService.reactivateManagedUser({ userId })`
- `accountAdminService.loadProfileData({ user })`
- `accountAdminService.updateProfileData({ user, userProfile, formData })`
- `accountAdminService.changePassword({ user, passwordData })`
