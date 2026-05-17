# attendance

Feature clean-lite para control de asistencias.

- Carga de atletas, asistencias y metodos de pago via casos de uso del feature.
- Registro/edicion/eliminacion de asistencia encapsulados fuera de UI.
- Compatible con flujo de reportes persistidos existente.

## Capas
- `application/useCases/createAttendanceUseCases.js`: reglas de negocio y orquestacion del modulo.
- `presentation/createAttendanceService.js`: fachada consumida por componentes.
- `domain/attendanceError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAttendanceRepository.js`: acceso a tablas `attendances`, `students`, `payment_types`.
