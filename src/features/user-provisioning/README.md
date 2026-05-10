# user-provisioning

Feature clean-lite para aprovisionamiento de usuarios y credenciales.

## Responsabilidades
- Crear usuarios con credenciales temporales.
- Crear estudiantes (usuario + registro en `students`).
- Reenviar credenciales regenerando contrasena temporal.

## Capas
- `presentation/createUserProvisioningService.js`: contrato publico del feature.
- `application/useCases/createUserProvisioningUseCases.js`: casos de uso de aprovisionamiento.
- `domain/userProvisioningError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseUserProvisioningRepository.js`: implementacion Supabase del aprovisionamiento y reenvio de credenciales.

## Contrato publico
- `userProvisioningService.createUser(payload)`
- `userProvisioningService.createStudent(payload)`
- `userProvisioningService.resendCredentials(payload)`
