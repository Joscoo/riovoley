# Octalysis Coverage Map

Este documento deja trazabilidad de como se estan cubriendo los 8 core drivers en Riovoley, con su justificacion y evidencia verificable.

## Cobertura

### 1. Epic Meaning & Calling
- Implementacion:
  - Ruta visual de progreso del estudiante.
  - Logro `Primer paso`.
- Justificacion:
  - Da sentido al inicio del recorrido y presenta el avance como parte de una historia deportiva.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)

### 2. Development & Accomplishment
- Implementacion:
  - XP, niveles, barra de progreso al siguiente nivel, logros por salto, por cantidad de tests y por historial de pagos.
- Justificacion:
  - El estudiante ve progreso cuantificable y metas concretas de mejora.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.test.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.test.js:1)

### 3. Empowerment of Creativity & Feedback
- Implementacion:
  - Retos activos con progreso en tiempo real.
  - Insights de salto, fuerza, tests y actividad del mes.
- Justificacion:
  - El sistema devuelve feedback inmediato y permite interpretar donde esta mejorando.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [StudentPhysicalTests.js](D:/Riovoley/riovoley/src/features/student-dashboard/presentation/components/StudentPhysicalTests.js:1)

### 4. Ownership & Possession
- Implementacion:
  - Perfil persistido de progreso.
  - Coleccion de logros desbloqueados y logros bloqueados.
  - Cobertura de mensualidad reflejada dentro del avance personal.
- Justificacion:
  - El estudiante siente que esta construyendo algo propio y acumulativo.
- Evidencia:
  - [SupabaseGamificationRepository.js](D:/Riovoley/riovoley/src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)

### 5. Social Influence & Relatedness
- Implementacion:
  - Ranking por categoria con alias.
  - Logros y retos conectados a asistencia y constancia.
- Justificacion:
  - Se incorpora comparacion social ligera sin exponer nombres reales.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)

### 6. Scarcity & Impatience
- Implementacion:
  - Retos mensuales de test y asistencia.
  - Logros por sostener pagos durante varios meses.
  - Logros de ventana temporal mensual.
- Justificacion:
  - Empuja accion dentro de una ventana limitada sin necesidad de castigo.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)

### 7. Unpredictability & Curiosity
- Implementacion:
  - Logro oculto `Logro misterioso` hasta que se cumpla una combinacion de asistencia y progreso fisico.
- Justificacion:
  - Mantiene curiosidad y exploracion sin revelar todas las reglas desde el inicio.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)

### 8. Loss & Avoidance
- Implementacion:
  - Racha activa.
  - Logro por constancia de 3 meses.
  - Logro y reto por mantener mensualidad vigente.
- Justificacion:
  - Refuerza no perder continuidad sin introducir penalizacion toxica.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)

## Pruebas y verificacion

### Pruebas automatizadas
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - valida proyeccion derivada, ranking de respaldo y persistencia
- `src/features/gamification/presentation/createGamificationService.test.js`
  - valida delegacion del servicio publico
- `src/features/attendance/application/useCases/createAttendanceUseCases.test.js`
  - valida que cambios de asistencia disparen recalculo gamificado
- `src/features/payments/application/useCases/createPaymentsUseCases.test.js`
  - valida que cambios de pago disparen recalculo gamificado

### Verificacion tecnica
- `npm run build`
  - confirma que la experiencia responsive en Tailwind compile correctamente

### Herramientas internas usadas
- Motor de proyeccion del feature `gamification`
- Vistas publicas de Supabase para lectura
- Tests unitarios con Jest
- Tailwind CSS para la experiencia responsive
