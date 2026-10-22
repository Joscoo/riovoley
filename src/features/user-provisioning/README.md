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

El reenvío acepta `channels: ['email', 'whatsapp']` (por defecto solo email).
`success` confirma la generación de la contraseña; `deliverySuccess` y
`deliveryStatus` (`sent`, `partial`, `failed`) describen los canales seleccionados.
Los errores de entrega conservan `credentials` para compartirlas manualmente.
La contraseña anterior queda invalidada aunque el proveedor no confirme el correo.
Las solicitudes simultáneas al mismo usuario se agrupan dentro de la instancia del servicio.

Ver [validación y despliegue](../../../docs/CREDENCIALES_RECUPERACION_2026-10-22.md).
