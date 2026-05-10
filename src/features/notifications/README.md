# notifications

Feature clean-lite para notificaciones de pagos y anuncios.

## Responsabilidades
- Calcular notificaciones de vencimientos de pagos.
- Componer notificaciones para campana global y vista administrativa.
- Encapsular consultas a pagos, estudiantes y anuncios.

## Capas
- `presentation/createNotificationsService.js`: reglas de composicion y prioridad.
- `domain/notificationsError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseNotificationsRepository.js`: adaptador Supabase.

## Contrato publico
- `notificationsService.loadBellNotifications({ userRole })`
- `notificationsService.loadPaymentNotifications()`
