# student-dashboard

Feature clean-lite para el panel del estudiante.

## Responsabilidades
- Cargar perfil de estudiante, estado de pago, asistencias y tests fisicos.
- Exponer operaciones desacopladas para refrescos parciales en la UI.
- Mantener consultas a Supabase encapsuladas en repositorio.

## Capas
- `presentation/createStudentDashboardService.js`: orquesta carga total y cargas parciales.
- `domain/studentDashboardError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseStudentDashboardRepository.js`: adaptador Supabase.

## Contrato publico
- `studentDashboardService.loadStudentPanelData(userId)`
  - retorna: `{ studentData, paymentStatus, attendanceStats, physicalTests }`
- `studentDashboardService.loadStudentViewData(userId)`
  - retorna: `{ studentData, payments, physicalTests }`
- `studentDashboardService.loadPaymentStatus(studentId)`
- `studentDashboardService.loadPaymentsHistory(studentId)`
- `studentDashboardService.loadAttendanceStats(studentId)`
- `studentDashboardService.loadPhysicalTests(studentId)`

