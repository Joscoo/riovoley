# payments

Feature clean-lite para gestión de pagos.

- `presentation/createPaymentsService`: orquesta carga, filtros y acciones de pago.
- `infrastructure/repositories`: acceso Supabase encapsulado.
- Notificaciones:
  - correo via `src/features/communications`
  - WhatsApp via `whatsappService`/`whatsappBusinessService`
