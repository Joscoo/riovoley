# Propuesta SQL institucional y retorno

**Preparada y ensayada únicamente en local. No aplicada ni autorizada para producción.**

El paquete parte del catálogo institucional leído el 31 de octubre de 2026. Está fuera de `supabase/migrations` para impedir su aplicación automática. El nombre de avance fue generado con `supabase migration new`; el retorno es un artefacto del mismo paquete, no una migración pendiente que deba ejecutarse después del avance.

- [Avance propuesto](20261031211612_riovoley_security_production_proposal.sql).
- [Retorno propuesto](20261031211612_riovoley_security_return_proposal.sql).
- [Informe, comandos e incidencias](../../../docs/tesis/evidencias/verificacion-tecnica/20261031-211520-ensayo-sql-7665556/INFORME_VERIFICACION_TECNICA.md).
- [Hashes del paquete final](../../../docs/tesis/evidencias/verificacion-tecnica/20261031-211520-ensayo-sql-7665556/seguridad/paquete-ensayado-05.json).
- [Runbook de producción](../../../docs/produccion/RUNBOOK.md).

El cierre registra **29/29 pruebas SQL locales** y **6/6 contratos de herramientas**, sin sumarlos. Antes del guard adicional del propietario, otra base creada desde cero reprodujo **28/28**. Se probaron tanto el retorno real como la reaplicación. Las propuestas finales tienen copias inmutables dentro del expediente.

Git conserva los bytes de estos dos archivos SQL para que sus hashes coincidan con las copias de evidencia, incluidos los finales de línea de cuerpos de funciones capturados. Una regeneración en otro contexto produce su propio paquete y retorno: comprobar sus hashes y no mezclar el avance de una ejecución con el retorno de otra.

## Cambio previsto

Se adapta el [endurecimiento local anterior](../local/README.md) a las firmas y permisos institucionales observados. La propuesta conserva las operaciones administrativas legítimas y restringe escalamiento de rol, escritura de XP/resultados por atletas, fuentes deportivas, compras bloqueadas y actores suspendidos. Incluye pagos UUID SECURITY INVOKER, retiro web de las firmas bigint y RPC de ocho XP diarios sin parámetros de actor, fecha o cantidad. Fija un `search_path` explícito en las 19 funciones de aplicación que carecían de él y retira a `anon` la ejecución de `admin_insert_user`.

No se revocan indiscriminadamente todas las funciones SECURITY DEFINER. El laboratorio conserva 13 ejecutables por `anon`; sus contratos restantes no se declaran completamente auditados. Las alertas de `pg_net`, versión PostgreSQL y protección contra contraseñas filtradas requieren trabajos separados. Este paquete todavía no corrige los avisos de la base institucional porque no se ha aplicado.

## Condiciones obligatorias antes de una ejecución institucional

1. Aprobar expresamente estos archivos y sus SHA-256, el destino `mayvvlkvheagkojunzzb`, los responsables y la ventana.
2. Verificar un respaldo institucional recuperable y ensayar la restauración fuera de producción. El catálogo de este expediente no contiene datos y no sirve como backup. Incluir Auth, referencias y objetos de Storage según su propio procedimiento, además de configuración y secretos fuera del repositorio.
3. Preparar y revisar cliente web, APK/Capgo, Edge Functions y artefactos de retorno. Retirar o impedir operaciones de clientes antiguos; su recompensa directa y contratos anteriores son incompatibles. Un marcador SQL no implementa este cierre ni prueba que un dispositivo haya recibido una OTA.
4. Repetir los SELECT de catálogo, precondiciones y permisos. Reconstruir y revisar el paquete si la huella cambia. No sustituir la huella esperada para forzar la aprobación.
5. Confirmar cero duplicados, referencias diarias válidas y roles canónicos. Resolver cualquier excepción mediante un procedimiento separado autorizado, sin corrección automática de datos.
6. Ejecutar como **postgres**: lo exige el guard para conservar propietarios y ACL previstas. Los marcadores `riovoley.release.approval` y `riovoley.release.window` son comprobaciones contra errores; no constituyen una autorización ni acreditan la identidad del servicio. Debe verificarse el destino mediante la conexión del operador.
7. Planificar bloqueos: se crean índices únicos ordinarios en una transacción, con `lock_timeout=5s` y `statement_timeout=120s` por sentencia. No hay ensayo con volumen productivo, creación concurrente ni promesa de cero interrupción. Ante error, hacer ROLLBACK y revisar antes de otro intento.
8. Mantener cerrada la ventana hasta verificar contratos, autorización por rol y despliegue coordinado, con cuentas y datos descartables expresamente autorizados.

La huella protege los metadatos indicados en el informe; no incluye todos los ajustes gestionados, membresías globales, versiones de extensiones ni filas. Acepta únicamente dos representaciones equivalentes del CHECK legado de prioridades, reconstruido de PG17.4 a PG17.11. El caso P03d verifica que modificar sus literales sigue abortando el avance.

## Retorno

El retorno exige su propia decisión operativa y ventana, propietario `postgres` y huella del estado aplicado. Recupera las definiciones y permisos capturados, incluidas opciones de concesión, y comprueba la huella original antes del COMMIT. No debe ejecutarse por un simple fallo visual sin investigar primero la causa.

**No restaura datos ni borra los XP, recompensas, compras o pagos posteriores al avance.** No reconcilia esos datos con clientes antiguos. Reintroduce los permisos previos y elimina la RPC de recompensa del nuevo cliente: coordinar el retorno de web, Android, Edge y canales antes de abrir operaciones. El ensayo SQL de retorno no sustituye una restauración de backup ni demuestra recuperación frente a pérdida de datos.

## Reproducir de forma local

Seguir primero la [preparación del Supabase local](../../../scripts/e2e/local/README.md). Se necesita el entorno sintético `riovoley-e2e-local` en API 55321 / PostgreSQL 55322, el driver `pg` privado y la CLI indicados en el informe. El driver verifica la correspondencia entre el administrador de Auth local y PostgreSQL antes de crear una **base nueva**; no reinicia ni elimina las bases existentes.

En un contexto de auditoría nuevo, copiar el catálogo, precondiciones ampliadas y avisos publicados a los archivos privados de entrada, sin aportar credenciales institucionales:

```powershell
$sqlEvidence = 'docs/tesis/evidencias/verificacion-tecnica/20261031-211520-ensayo-sql-7665556/seguridad'
New-Item -ItemType Directory -Force '.e2e-local/production-migration'
Copy-Item -LiteralPath "$sqlEvidence/catalogo-aplicacion.json" -Destination '.e2e-local/production-migration/catalog.json'
Copy-Item -LiteralPath "$sqlEvidence/precondiciones-institucionales-ampliadas.json" -Destination '.e2e-local/production-migration/preconditions.json'
Copy-Item -LiteralPath "$sqlEvidence/advisores-institucionales-finales.json" -Destination '.e2e-local/production-migration/advisors.json'
node scripts/audit/production/sql-context.cjs init
node scripts/audit/production/sql-context.cjs run seguridad/construir scripts/audit/production/sql-packet.cjs
node scripts/audit/production/sql-context.cjs run integracion/reconstruir scripts/audit/production/sql-lab.cjs
node scripts/audit/production/sql-context.cjs run integracion/ensayo --test --test-reporter=tap tests/integration/production-sql.local.test.cjs
node scripts/audit/production/sql-context.cjs run unitarias/contratos --test --test-reporter=tap tests/integration/production-sql-packet.test.cjs scripts/e2e/local/schema.test.cjs
```

No sobrescribir entradas privadas ni contextos de una sesión existente: archivar primero su directorio privado con el responsable o usar una copia de trabajo nueva. El inicializador rechaza reutilizar un contexto y las herramientas rechazan escribir en un expediente sellado. Los scripts `upgrade-sql-packet`, `refresh-sql-packet`, `fresh-sql-replay` y `rehearse-sql` conservan decisiones de esta sesión; no forman parte de la secuencia normal de reproducción. Los generadores del informe están ligados a los nombres y denominadores de este expediente.

La reproducción utiliza PostgreSQL real, pero simula el contexto JWT en SQL y una tabla Auth mínima. No representa login HTTP, PostgREST, proveedores, Android o un despliegue Supabase gestionado. No usar `.env.e2e`, que corresponde a producción, ni cambiar puertos/destinos para apuntar estos aplicadores a Cloud.
