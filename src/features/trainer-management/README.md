# trainer-management

Feature clean-lite para gestion de entrenadores desde el panel admin.

## Responsabilidades
- Cargar listado de entrenadores.
- Crear entrenadores con credenciales temporales.
- Actualizar y eliminar entrenadores sin acceso directo de UI a `supabase`.

## Capas
- `presentation/createTrainerManagementService.js`: orquesta flujos de alta/edicion/baja.
- `domain/trainerManagementError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseTrainerManagementRepository.js`: adaptador Supabase para tabla `users`.
- Provisioning de credenciales via `src/features/user-provisioning`.

## Contrato publico
- `trainerManagementService.loadEntrenadores()`
- `trainerManagementService.saveEntrenador({ editingEntrenador, formData })`
- `trainerManagementService.deleteEntrenador({ trainerId })`
