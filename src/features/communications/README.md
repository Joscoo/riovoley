# communications

Feature clean-lite para notificaciones por correo.

## Capas
- `presentation/createCommunicationsService`: API publica para envio de correos.
- `application/useCases/createCommunicationsUseCases`: casos de uso para envio de comunicaciones.
- `domain/communicationsError`: error funcional del feature.
- `infrastructure/repositories/supabaseCommunicationsRepository`: implementacion Supabase/Edge Functions para correo.

## Contrato publico
- `communicationsService.sendCredentials(userData)`
- `communicationsService.sendPaymentConfirmation(paymentData)`
- `communicationsService.sendPasswordReset(userData)`

`sendCredentials` devuelve `{ success, data }` o `{ success: false, error, code }`.
La confirmación del proveedor indica aceptación para envío; la recepción se verifica
con el destinatario o los eventos del proveedor. Los datos de la plantilla se escapan
como HTML para preservar la contraseña y evitar interpretar contenido del usuario.

Las credenciales usan la función `send-email` con Resend. Los enlaces de recuperación
usan Supabase Auth y su configuración SMTP; son canales de envío independientes.
Ver [validación y despliegue](../../../docs/CREDENCIALES_RECUPERACION_2026-10-22.md).
