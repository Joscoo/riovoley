# payments

Feature clean-lite para gestion de pagos.

## Capas
- `application/useCases/createPaymentsUseCases.js`: reglas de negocio para carga, filtros y acciones de pago.
- `presentation/createPaymentsService.js`: fachada consumida por componentes de UI.
- `domain/paymentsError.js`: error funcional del feature.
- `infrastructure/repositories/supabasePaymentsRepository.js`: acceso a datos de pagos y atletas.

## Integraciones
- Correo via `src/features/communications`.
- WhatsApp via `whatsappService` y `whatsappBusinessService`.
