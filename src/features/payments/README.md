# payments

Feature clean-lite para gestion de pagos.

## Capas
- `application/useCases/createPaymentsUseCases.js`: reglas de negocio para carga, filtros y acciones de pago.
- `presentation/createPaymentsService.js`: fachada consumida por componentes de UI.
- `domain/paymentsError.js`: error funcional del feature.
- `infrastructure/repositories/supabasePaymentsRepository.js`: acceso a datos de pagos, atletas, tipos de mensualidad y preview de periodo.

## Reglas clave de negocio
- El registro de pago usa `student_id`, `membership_type_id` y `fecha_pago`.
- `monto`, `fecha_inicio`, `fecha_fin` y `estado` se derivan automaticamente en base de datos.
- El formulario muestra preview del siguiente periodo a pagar por atleta.

## Integraciones
- Correo via `src/features/communications`.
- WhatsApp via `whatsappService` y `whatsappBusinessService`.
- Gamificacion via `refreshStudentProgress` para reflejar pagos dentro del progreso del estudiante.
