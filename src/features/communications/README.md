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
