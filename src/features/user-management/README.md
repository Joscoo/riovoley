# user-management

Feature clean-lite para gestion de usuarios (atletas, entrenadores y administradores).

- `presentation/`: service facade consumida por hooks/tabs UI.
- `application/`: contratos de repositorio.
- `domain/`: errores de dominio.
- `infrastructure/`: implementacion Supabase + integraciones (creacion de usuarios, WhatsApp).
- Borrado de Auth desacoplado mediante adapter compartido `src/shared/infrastructure/auth/deleteAuthUserById.js`.
- Provisioning de usuarios/credenciales consumido via `src/features/user-provisioning`.
