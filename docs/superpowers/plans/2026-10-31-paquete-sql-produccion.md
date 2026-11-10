# Paquete SQL de producción: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para ejecutar este plan en la sesión actual. No aplicar el paquete a producción.

**Goal:** Preparar un cambio SQL y un retorno concretos, comparados con metadatos actuales de RIOVOLEY y ensayados en PostgreSQL local descartable.

**Architecture:** Capturar únicamente catálogos y recuentos agregados institucionales mediante transacciones de lectura. Reconstruir los esquemas de aplicación en una base nueva del servidor local ya verificado; simular exclusivamente el contexto JWT de PostgreSQL, sin presentarlo como autenticación HTTP. Generar el paquete fuera de `supabase/migrations`, con precondiciones y rechazo ante deriva del catálogo.

**Tech Stack:** PostgreSQL 17, Supabase, Node.js 24, driver pg, SQL, node:test.

**Spec:** [Runbook de producción](../../produccion/RUNBOOK.md), [seguridad local](../../../database/security/local/README.md) y restricciones de la auditoría solicitada.

## Global Constraints

- Producción: solo SELECT y metadatos; ninguna RPC de negocio, login, cambio de permisos, datos o esquema.
- Preservar las bases locales existentes, los cambios del usuario y las evidencias selladas.
- No desplegar, promover, publicar OTA/APK ni incorporar automáticamente la propuesta al historial de migraciones.
- Retorno de esquema no equivale a restauración de datos ni a recuperación de un backup.
- No publicar credenciales, datos de usuarios ni cuerpos de funciones sin revisión de secretos.

## Review Focus

- Deriva del catálogo: el SQL debe rechazar una base diferente de la captura evaluada.
- Duplicados: fallar antes de crear índices únicos; no corregir registros automáticamente.
- Privilegios: conservar propietario, ACL y opciones al retornar; probar denegaciones y operaciones legítimas.
- Concurrencia: un solo premio diario con persistencia PostgreSQL real ante solicitudes paralelas.
- Operación: documentar bloqueos, clientes antiguos, respaldo, ventana y pruebas gestionadas todavía pendientes.

### Tarea 1: Captura y paquete revisable

Archivos: `scripts/audit/production/sql-packet.cjs`, `database/security/production-proposal/`, expediente nuevo en `docs/tesis/evidencias/verificacion-tecnica/`.

- [x] Capturar catálogo institucional en lectura, ACL completas y precondiciones agregadas.
- [x] Revisar los cuerpos afectados y generar avance/retorno con huellas verificables.
- [x] Documentar alertas que el paquete aborda y las que requieren acciones separadas.

### Tarea 2: Ensayo aislado

Archivos: `scripts/audit/production/rehearse-sql.cjs`, `tests/integration/production-sql.local.test.cjs`.

- [x] Verificar la identidad del servidor local y crear una base nueva con nombre exclusivo.
- [x] Reconstruir estructura de aplicación y soporte Auth de laboratorio sin copiar filas institucionales.
- [x] Probar precondiciones, aplicación, roles, pagos, premio diario y concurrencia.
- [x] Ejecutar retorno real, comparar metadatos y volver a aplicar; conservar incidencias de cada intento.

### Tarea 3: Revisión, evidencia y entrega

- [x] Solicitar revisión independiente del paquete completo y resolver hallazgos verificables.
- [x] Generar informe, matriz y texto académico complementarios con denominadores separados.
- [x] Revisar secretos, enlaces, cifras y hashes; sellar únicamente al finalizar.
- [x] Actualizar runbook y preparar la publicación de los avances en la misma rama autorizada, sin merge ni despliegue; verificar la subida al finalizar.

## Registro de decisiones

- La base de ensayo será nueva; no se reconstruirá sobre la base E2E ya endurecida porque no representa el catálogo institucional actual.
- El soporte Auth del ensayo permite probar RLS y funciones SQL con roles reales; la emisión y validación de sesiones por Supabase Auth quedan fuera de este ensayo y se distinguen de las pruebas HTTP locales anteriores.
- La huella ampliada protege también vistas, ACL, propietarios, constraints, estado de triggers e índices, enums y secuencias. Solo normaliza dos representaciones equivalentes de un CHECK legado entre PG17.4 y PG17.11; cambiar sus literales sigue fallando.
- Las ACL predeterminadas de funciones se comparan para postgres, propietario exigido por el paquete. No se requiere modificar defaults de roles administrados que no crean las funciones de este cambio.
- Los intentos con preparación de fixtures fallida, error del retorno y colisión de nombres de evidencia se conservan; el cierre posterior aprobó 29/29 casos SQL y 6/6 contratos de herramientas. Una segunda base reconstruida desde cero aprobó 28/28 antes del guard adicional del propietario.
