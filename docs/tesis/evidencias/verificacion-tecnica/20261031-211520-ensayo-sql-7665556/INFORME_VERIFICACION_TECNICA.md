# Verificación técnica complementaria: paquete SQL de producción

## 1. Proyecto y revisión evaluada

RIOVOLEY, repositorio https://github.com/Joscoo/riovoley. Commit base **76655561d6632df42237d9a0c2da5d6eddf9d1ba**, rama fix/seguridad-local-20261029. El paquete y las herramientas eran cambios locales durante las ejecuciones; [FUENTES_EVALUADAS.json](FUENTES_EVALUADAS.json) identifica sus bytes mediante SHA-256. El commit base no contiene por sí solo esos cambios. No se modificaron fuentes React, dependencias, Android ni evidencias selladas anteriores.

## 2. Fecha, entorno y herramientas

Expediente iniciado 2026-10-31T21:15:20.564Z (UTC; Ecuador UTC−5). Windows 11 Pro 64 bits, versión 10.0.26300; Node v24.18.0; npm 11.16.0; Supabase CLI 2.122.0 y driver pg 8.23.1 ya instalados. PostgreSQL institucional 17.4 (plataforma 17.4.1.064); PostgreSQL local **17.11**. Conexiones de ensayo fijadas a 127.0.0.1:55322, API local auxiliar a 127.0.0.1:55321; no se publican claves. El contexto original y la [segunda base creada desde cero](integracion/reproduccion-limpia.json) se conservan.

## 3. Alcance y metodología

Se capturaron solo catálogos y recuentos agregados institucionales, dentro de BEGIN TRANSACTION READ ONLY / ROLLBACK, sin filas personales. Se reconstruyeron 47 tablas, 38 funciones, 139 políticas y 44 vistas de aplicación en una base local nueva, sin copiar registros institucionales. Las funciones auth.uid/role/jwt proceden del Supabase local verificado; auth.users es una estructura mínima. Las pruebas usan PostgreSQL, RLS, triggers, transacciones y persistencia reales, con contexto JWT **simulado mediante SET LOCAL ROLE y request.jwt.claims**. No se emitieron ni validaron sesiones HTTP en este ensayo.

Se prepararon [20261031211612_riovoley_security_production_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql) y [20261031211612_riovoley_security_return_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql), fuera de supabase/migrations. El avance adapta el endurecimiento previamente probado en local y fija search_path en las 19 funciones de aplicación detectadas sin configuración. Restringe anon en admin_insert_user, preserva pagos UUID, renombra/revoca bigint, añade recompensa diaria, protecciones de roles, resultados, fuentes deportivas, wallet y tienda. No recalcula todo XP en PostgreSQL ni elimina la autoridad administrativa legítima.

La huella de deriva cubre funciones/configuración/ACL, vistas, RLS/políticas, triggers/estado, columnas, constraints, índices/validez, enums, secuencias, propietarios y permisos de relaciones/esquemas/columnas y ACL predeterminadas de funciones del propietario postgres. No representa todos los ajustes de Supabase, membresías de roles globales, extensiones o datos. Existe una normalización **exacta y limitada** de dos formas equivalentes del CHECK legado announcements_priority_check al reconstruir PG17.4 en PG17.11; P03d demuestra que cambiar sus literales sigue siendo rechazado.

## 4. Comandos y reproducción

[COMANDOS.json](COMANDOS.json) registra argumentos, inicio/fin, duración y códigos de salida de procesos; cada comando conserva stdout/stderr y .meta.json. Las llamadas MCP no tienen código de proceso: el resultado se registra como operación de lectura, no como exit 0 inventado. La consulta inicial de huella tuvo error de tipado 42725; se corrigieron casts explícitos de los tipos internos char antes de usarla.

Comandos principales ejecutados: node scripts/audit/production/sql-packet.cjs; node scripts/audit/production/sql-lab.cjs; node --test --test-reporter=tap tests/integration/production-sql.local.test.cjs; node --test --test-reporter=tap tests/integration/production-sql-packet.test.cjs scripts/e2e/local/schema.test.cjs. Se usó sql-context.cjs run para conservar los registros. [README del paquete](../../../../../database/security/production-proposal/README.md) explica la reproducción en un contexto nuevo y los requisitos. No ejecutar los scripts locales sobre producción.

## 5. Resultados finales

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| SQL-01 | Integración PostgreSQL local, paquete final | 29 | 29 | 0 | 0 | APROBADO, alcance local | [TAP](integracion/ensayo-07-propietario.stdout.log) |
| CON-01 | Contratos de generador y reconstrucción de esquema, node:test | 6 | 6 | 0 | 0 | APROBADO | [TAP](unitarias/contratos-cierre.stdout.log) |
| REP-01 | Reproducción en otra base local nueva, antes de añadir guard del propietario | 28 | 28 | 0 | 0 | APROBADO, versión anterior del guard | [TAP](integracion/ensayo-06-reproduccion.stdout.log) |
| SEG-01 | Catálogo y advisores institucionales | — | — | — | — | EJECUTADO: avisos pendientes | [Advisores](seguridad/advisores-institucionales-finales.json) |
| SEG-02 | Deriva institucional al cierre | — | — | — | — | EJECUTADO: huella coincide | [Lectura](seguridad/lectura-institucional-final.json) |
| PROD-01 | Aplicación y retorno institucionales | 0 | 0 | 0 | 0 | BLOQUEADO: autorización, respaldo, ventana y clientes | [Gates](../../../../../database/security/production-proposal/README.md) |
| JEST-01 | Jest/Testing Library en esta fase SQL | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |
| E2E-01 | Playwright nuevo | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |
| WEB-01 | Compilación web nueva | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |
| AND-01 | Compilación o dispositivo Android nuevos | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |

No sumar estos denominadores: REP-01 repite casos, CON-01 corresponde a herramientas y SQL-01 prueba persistencia local. No se calculó cobertura Jest nueva. Los builds y E2E previos conservan sus fechas, artefactos y limitaciones originales.

## 6. Qué comprueban los 29 casos SQL

P01–P06 y P02a/P03a–e comprueban reconstrucción, propietario, marcadores, deriva, duplicados, referencias diarias nulas y aplicación real. P07–P12 revisan search_path, ACL, escalamiento de rol, XP directo, pagos autorizados/denegados, auditoría y firmas bigint. P13–P15 y P23 verifican ocho XP diarios, fecha Ecuador, idempotencia, seis solicitudes concurrentes, suspensión y persistencia tras reaplicar. P16–P19 prueban compra, equipamiento, desequipamiento, propiedad, bloqueo de cosmético y conservación de gasto. P20–P21 comprueban operaciones legítimas del entrenador y alta administrativa canónica. P22 ejecuta el retorno y compara la huella original, conservando XP creado durante el ensayo.

No se comprobaron nuevamente avatares, todos los tipos de desbloqueo cosmético, ranking completo, notificaciones externas, asistencia/evaluación desde interfaces, ni el flujo de autenticación gestionado. Las seis pruebas de herramientas usan fixtures de metadatos, sin servicios remotos.

## 7. Intentos e incidencias conservados

| Registro | Casos reportados por node:test | Aprobados | Fallidos | Fallos por hook previo | Duración s |
| --- | ---: | ---: | ---: | ---: | ---: |
| [ensayo-01.stdout.log](integracion/ensayo-01.stdout.log) | 23 | 0 | 23 | 23 | 0.350 |
| [ensayo-02.stdout.log](integracion/ensayo-02.stdout.log) | 23 | 21 | 2 | 0 | 0.979 |
| [ensayo-03.stdout.log](integracion/ensayo-03.stdout.log) | 23 | 23 | 0 | 0 | 1.347 |
| [ensayo-04-ampliado.stdout.log](integracion/ensayo-04-ampliado.stdout.log) | 28 | 27 | 1 | 0 | 1.814 |
| [ensayo-05-final.stdout.log](integracion/ensayo-05-final.stdout.log) | 28 | 28 | 0 | 0 | 1.783 |
| [ensayo-06-reproduccion.stdout.log](integracion/ensayo-06-reproduccion.stdout.log) | 28 | 28 | 0 | 0 | 1.584 |
| [ensayo-07-propietario.stdout.log](integracion/ensayo-07-propietario.stdout.log) | 29 | 29 | 0 | 0 | 2.038 |

El primer intento no llegó al cuerpo de los 23 casos: faltaba la categoría sintética requerida por FK; no representa 23 fallos funcionales comprobados. Se completó la fixture y se hizo transaccional. El segundo encontró una colisión entre variable record y alias SQL del retorno; el fallo del caso siguiente fue consecuencia de la transacción abortada. El retorno corregido se ejecutó realmente y recuperó la huella. El cuarto intento falló al archivar un borrador con nombre existente, aunque las operaciones SQL y el retorno en memoria aprobaron; se corrigió el nombre del artefacto y se repitió.

También se conservan fallos de reconstrucción por tipo de columna Auth, falta de permiso local para cambiar defaults de supabase_admin, diferencias de representación de un CHECK entre versiones y un argumento de ruta npm con espacios. Se corrigieron sin modificar producción. La comparación de defaults se limita justificadamente a postgres, propietario exigido del paquete. El registro TDD rojo corresponde a módulo aún inexistente durante desarrollo; no se cuenta como prueba de producto. Los borradores tienen nombres explícitos y no se presentan como artefactos finales.

## 8. Seguridad institucional observada

RLS sigue habilitado en gamification.xp_ledger y login_rewards; cada una tenía una política en la captura institucional. La RPC claim_daily_login_reward seguía ausente y pagos conservaban sus cuatro sobrecargas UUID/bigint SECURITY DEFINER. No se ejecutaron esas RPC en producción. Los recuentos agregados fueron cero para identidades duplicadas, XP diario duplicado, referencias diarias nulas y roles fuera de la lista revisada; son condiciones observadas, no prueba de toda la integridad institucional.

| Aviso del proveedor, producción | Hallazgos | Nivel |
| --- | ---: | --- |
| function_search_path_mutable | 19 | WARN |
| extension_in_public | 1 | WARN |
| anon_security_definer_function_executable | 17 | WARN |
| authenticated_security_definer_function_executable | 19 | WARN |
| auth_leaked_password_protection | 1 | WARN |
| vulnerable_postgres_version | 1 | WARN |

En el laboratorio, las 47 funciones de aplicación resultantes tienen search_path explícito; el recuento sin configuración es 0. Siguen existiendo 13 funciones SECURITY DEFINER ejecutables por anon en ese catálogo local: no se revocaron contratos por un recuento general ni se declara su revisión exhaustiva. Los avisos institucionales **no se consideran corregidos** porque el paquete no se aplicó. Reubicar pg_net, actualizar PostgreSQL y activar protección de contraseñas requieren revisión y acciones separadas; no se ejecutaron. Esto no es una prueba de penetración completa.

## 9. Vercel, Edge y producción

La [inspección Vercel anterior](../20261031-204703-vercel-lectura-f9f6d4c/INFORME_VERIFICACION_VERCEL.md) identificó main e469db5 en producción y ausencia del candidato. No se lanzó otro deployment. Se inventariaron nueve Edge Functions activas, todas con verify_jwt=true y referencias de versión/bundle en [edge-inventario.json](seguridad/edge-inventario.json); esto no valida el código desplegado, JWT efectivos ni proveedores externos. No se contactaron SMTP, FCM, usuarios ni notificaciones.

## 10. Android y compilación

No hubo compilación React ni Gradle nueva en esta fase: solo se cambiaron propuestas SQL, pruebas, herramientas y documentación. Las compilaciones y pruebas Android anteriores se enlazan como antecedentes; no acreditan que un APK publicado esté usando estos contratos. No se publicó APK, OTA, aplicación web ni función Edge.

## 11. Operación y retorno

El avance exige current_user=postgres, marcadores operativos y huella exacta; los marcadores son controles contra errores, no autorización institucional ni mecanismo que cierre clientes. Usa transacción, lock_timeout de 5 s y statement_timeout de 120 s por sentencia. Crea índices únicos ordinarios dentro de la transacción: puede bloquear escrituras; no se midieron tiempos con volumen productivo ni se promete cero interrupción.

El retorno restaura definiciones, propietarios, ACL/opciones de concesión, políticas/triggers previos, índices y uso del esquema security comprobado por huella. Conserva datos creados posteriormente, por lo que **no equivale a restauración de backup** ni reconcilia XP/wallets. Reabre los permisos antiguos y elimina la RPC nueva: requiere decisión expresa y clientes coordinados. Las funciones y metadatos no sustituyen un backup de datos, Auth, objetos Storage ni secretos operativos.

## 12. Pendientes y límites de conclusión

Faltan respaldo institucional comprobado y ensayo de restauración fuera de producción; inventario/control de clientes web/APK/Capgo antiguos; artefactos Edge y retorno gestionado revisados; configuración Auth/SMTP/FCM/Storage/scheduler; tratamiento autorizado de avisos Supabase; ventana, responsables y aprobación expresa. Después se requerirá aplicación coordinada y verificación del servicio real con datos descartables autorizados. No se afirma que todo funcione en producción ni se atribuyen usabilidad, motivación, USE o UES-SF a estos resultados.

## 13. Evidencias y referencias

[Resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [comandos](COMANDOS.json), [fuentes y huellas](FUENTES_EVALUADAS.json), [SQL final de avance](seguridad/avance-propuesto-final.sql), [SQL final de retorno](seguridad/retorno-propuesto-final.sql), [metadatos locales](seguridad/metadatos-locales-finales.json), [catálogo institucional sin filas](seguridad/catalogo-aplicacion.json), [precondiciones ampliadas](seguridad/precondiciones-institucionales-ampliadas.json), [revisión independiente](seguridad/REVISION_INDEPENDIENTE.md), [matriz](MATRIZ_VERIFICACIONES_TESIS.md) y [propuesta académica](RESULTADOS_PARA_TESIS_4_5.md). El manifiesto de cierre se genera después de revisar enlaces, privacidad y cifras.

Criterios consultados: [funciones Supabase](https://supabase.com/docs/guides/database/functions), [CREATE FUNCTION de PostgreSQL17](https://www.postgresql.org/docs/17/sql-createfunction.html) y [alcance de backups Supabase](https://supabase.com/docs/guides/platform/backups). Su documentación orienta la preparación; no demuestra configuración o backups disponibles en esta cuenta.
