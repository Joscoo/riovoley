# Ensayo local de barrera SQL de mantenimiento

> Implementación directa con verificación por tarea. No ejecutar cambios institucionales.

**Objetivo:** demostrar una barrera SQL limitada y reversible sobre fixtures, sin afirmar aislamiento de todos los servicios Supabase.

**Arquitectura:** base PostgreSQL nueva en 127.0.0.1:55322 con marcador propio. Disparadores BEFORE STATEMENT para INSERT, UPDATE, DELETE y TRUNCATE en siete relaciones de prueba, incluidas particiones. La excepción permite solo la conexión postgres sin SET ROLE; comprueba session_user y el rol de sesión para no confundir SECURITY DEFINER con origen administrativo. El disparador es SECURITY INVOKER y no lee una bandera MVCC que una transacción antigua pudiera ver desactualizada.

**Alternativas consideradas:** una página Vercel no controla los endpoints directos de Supabase; un hook de PostgREST no cubre Auth ni Storage; revocar permisos no asegura impedir RPC SECURITY DEFINER. Se elige ensayar disparadores únicamente como capa SQL, sin presentarla como solución completa de mantenimiento.

**Límites:** las tablas son sintéticas y no se copian políticas o filas institucionales. No cubre bytes Storage, llamadas externas, nuevos objetos no inventariados, DDL privilegiado, secuencias, large objects ni escritores postgres. No se modifican roles globales, contraseñas, Supabase gestionado o los cuatro SQL de producción. Cualquier integración futura debe revisar huellas y repetir avance/retorno.

## Archivos

- scripts/audit/maintenance/lab.cjs: contexto, conexiones fijas, fixture y snapshots.
- scripts/audit/maintenance/gate.cjs: instalación y retirada transaccionales, solo sobre la base marcada.
- tests/integration/maintenance-gate.local.test.cjs: controles reales de permisos, rechazo, RPC, particiones, concurrencia y retorno.
- scripts/audit/maintenance/report.cjs y finalize.cjs: documentos y sellado reproducibles.

## Ejecución y evidencia

1. Crear contexto y base únicos; verificar servidor local y roles antes de escribir.
2. Ejecutar baseline permisivo y prueba RED de rechazo, conservando salida y código.
3. Añadir barrera mínima. Ensayar instalación atómica con lock_timeout, DML por identidades reales, SECURITY DEFINER, vista, particiones, transacción anterior, lecturas y bypass administrativo explícito.
4. Retirar exclusivamente los objetos nuevos de la barrera en una transacción; demostrar retorno de escrituras y conservación de fixtures. Mantener la base para revisión.
5. Revisión independiente según requesting-code-review; resolver hallazgos antes de sellar.
6. Generar informe, matriz y texto académico, diferenciando integración PostgreSQL real de HTTP/Auth/Storage no ejercitados; comprobar privacidad, hashes anteriores y SQL intactos; subir a la rama autorizada y verificar CI.

## Criterios de aceptación

- El control abierto permite las operaciones que luego se rechazan con SQLSTATE propio.
- Ningún éxito se atribuye a RLS o falta de permisos; se verifica código y mensaje de barrera.
- Un fallo de instalación no deja barrera parcial.
- Se cubren sesiones existentes y una transacción REPEATABLE READ anterior.
- La igualdad de snapshots se comprueba al terminar; ningún efecto externo se considera probado.
