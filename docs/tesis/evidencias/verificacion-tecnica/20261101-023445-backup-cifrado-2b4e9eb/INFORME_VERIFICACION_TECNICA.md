# Verificación técnica complementaria: respaldo cifrado

## Identificación, fecha y alcance

RIOVOLEY, repositorio Joscoo/riovoley. Commit base **2b4e9ebf0f114d15065e689199042054ce625b1d**, con archivos nuevos/modificados de herramientas y documentación durante la ejecución. Inicio UTC **2026-11-01T02:34:45.433Z**; el inventario FUENTES_EVALUADAS.json identifica por SHA-256 las fuentes evaluadas antes del commit de entrega. No se modificaron lógica de negocio, registros institucionales, esquema, políticas, credenciales o despliegues.

Esta fase prepara la exportación lógica cifrada y su operación local. No repite las suites del producto ni sustituye [la auditoría anterior](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md). No es una auditoría de penetración, evaluación de usabilidad o estudio de motivación.

## Entorno y configuración

Microsoft Windows NT 10.0.26300.0; PowerShell 5.1.26100.9711; Node v24.18.0; npm 11.16.0; pg_dump (PostgreSQL) 17.11; pg_restore (PostgreSQL) 17.11; gpg (GnuPG) 2.4.9. [Registro de herramientas](seguridad/entorno.json). Clientes nativos extraídos de ZIP oficial, sin instalar servidor/servicio Windows. [Origen y hashes de herramientas](seguridad/herramientas-descargadas.json). El hash local del ZIP no equivale a checksum del fabricante comprobado independientemente.

Origen previsto: proyecto mayvvlkvheagkojunzzb, host directo IPv6, PostgreSQL postgres:5432, usuario postgres, TLS verify-full y CA pública del proveedor. Solo se publican [parámetros no secretos](seguridad/origen-configurado.json). La contraseña actual pertenece al usuario y aún no se introdujo en el asistente. El backend configurado en .env.e2e se trata como producción y no se utilizó para login o mutaciones. La CLI de Supabase no tenía sesión disponible ([resultado](seguridad/sesion-cli.json)); el acceso MCP de lectura no suministra una contraseña TCP para pg_dump.

## Metodología y comandos

- node --test --test-reporter=tap tests/unit/production-backup.test.cjs: controles puros del origen, TLS obligatorio y entorno filtrado; sin conexión real.
- node scripts/audit/production/test-encrypted-backup.cjs: un flujo con PostgreSQL local marcado, clientes PG y GnuPG reales; datos sintéticos, sin repositorio simulado. Ocho controles: catálogo en READ ONLY, rechazo de deriva, rechazo de versión, exportación/cifrado/inspección, clave exportada independiente, frase incorrecta, fallo de dump y corrupción.
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/audit/production/check-backup-tools.ps1: sintaxis del asistente, tres entradas ocultas y versiones; no solicita secretos.
- Helper privado de SSLRequest/TLS: conexión sin autenticar contra el host institucional y validación de CA/nombre. Los registros identifican el comando y resultado; no se redistribuye un exportador de secretos.

[COMANDOS.json](COMANDOS.json) conserva comandos, inicio/fin, duración y códigos de todas las ejecuciones registradas. Reproducción y requisitos en [la guía operativa](../../../../produccion/RESPALDO_Y_RESTAURACION.md).

## Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| B01 | Contratos Node de respaldo | 10 | 10 | 0 | 0 | APROBADO | [TAP](unitarias/backup-final.stdout.log), [metadatos](unitarias/backup-final.meta.json) |
| B02 | Flujo cifrado real sintético, ocho controles | 1 flujo | 1 | 0 | 0 | APROBADO | [JSON](integracion/backup-cifrado-entrega.json), [ejecución](integracion/cifrado-backup-entrega.meta.json) |
| B03 | TLS sin autenticación PostgreSQL | 1 | 1 | 0 | 0 | APROBADO | [TLS](seguridad/tls-verificado.json), [salida](seguridad/tls-sin-credenciales-corregido.meta.json) |
| B04 | Sintaxis y herramientas PowerShell | 1 comprobación | 1 | 0 | 0 | APROBADO | [Entorno](seguridad/entorno.json), [ejecución](seguridad/herramientas-asistente.meta.json) |
| B05 | Exportación institucional cifrada | 0 | 0 | 0 | 0 | BLOQUEADO: entrada local de secretos pendiente | [Estado](RESULTADOS_AUTOMATIZADOS.json) |
| B06 | Restauración institucional aislada | 0 | 0 | 0 | 0 | NO EJECUTADO: falta la copia institucional | [Estado](RESULTADOS_AUTOMATIZADOS.json) |
| B07 | Jest/componentes del producto | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md) |
| B08 | Playwright | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Mismo antecedente; sin login institucional |
| B09 | Compilación web | — | — | — | — | NO EJECUTADO en esta fase | Mismo antecedente; fuentes frontend sin cambios |
| B10 | Compilación Android | — | — | — | — | NO EJECUTADO en esta fase | Mismo antecedente; fuentes Android sin cambios |

No sumar estos denominadores ni contar ejecuciones intermedias como casos adicionales. Las duraciones originales constan en cada meta.json. La cobertura de código no se calculó: los diez contratos son Node, no la suite CRA con instrumentación.

## Integración, seguridad e incidencias

El flujo de entrega generó un archivo privado de **53308 bytes**, con **877 entradas** inspeccionadas en su tabla de contenido. Se usó RSA3072 y cifrado AES256; pg_dump y GPG terminaron con código cero. El SHA-256 y los resultados negativos constan en [la evidencia](integracion/backup-cifrado-entrega.json). La clave secreta protegida por frase se importó en otro llavero y permitió descifrar; una frase incorrecta fue rechazada. No se persistió el dump en claro ni se publicaron filas. La corrupción intencional y el fallo controlado de dump son denegaciones esperadas aprobadas, no fallos del cierre.

GnuPG se drena hasta el final aunque pg_restore --list cierre antes la entrada; se comprueba así la integridad del mensaje cifrado. **Listar el archivo no restaura sus filas ni valida todos sus bloques comprimidos mediante carga en una base**. No se ejecutó una restauración institucional y no se acredita recuperación integral de Auth, Storage, roles globales, claves PII/Vault, configuración de proveedores o servicios gestionados.

Se conservaron intentos fallidos: prueba inicial sin módulo; primer flujo con error de sintaxis; generación GPG por rutas Windows; importación de recuperación por ruta de socket demasiado larga. Se corrigieron rutas MSYS y ubicación corta de llaveros. El primer helper TLS informó validación, pero terminó con error nativo por doble cierre del socket; la ejecución corregida terminó con código cero. Los registros originales permanecen separados, sin reclasificarlos como aprobados. Los ensayos cifrados intermedios usaron RSA2048; solo el de entrega usa RSA3072.

La revisión independiente fue de solo lectura y reejecutó 10/10 contratos; no confirmó defectos críticos o importantes. La huella esperada del catálogo es un control previo en una transacción distinta del snapshot de pg_dump; no excluye DDL concurrente. La consistencia del snapshot y la comparación posterior durante un restore deben evaluarse por separado.

No se repitieron advisors de dependencias o pruebas RLS en esta fase. Los hallazgos institucionales y propuestas SQL/Edge anteriores siguen sin aplicarse. Esta verificación no autoriza el release.

## Pendientes y evidencias

Ejecutar el asistente con entrada privada, custodiar archivo/clave/frase por separado, revisar el recibo y preparar un destino nuevo aislado con salidas de correo/push/jobs bloqueadas. La restauración debe contemplar la incidencia calculate_age/columna GENERATED ya registrada en [el ensayo anterior](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md). Respaldar objetos Storage, roles/configuración y claves necesarias aparte; comprobar los proveedores y clientes antes de la ventana aprobada. No se modificaron el documento de tesis ni servicios institucionales.

[Matriz](MATRIZ_VERIFICACIONES_TESIS.md), [texto académico](RESULTADOS_PARA_TESIS_4_5.md), [resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json).

