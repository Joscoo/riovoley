# Ejecutor de respaldo cifrado: plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. No ejecutar cambios sobre el backend institucional.

**Goal:** Dejar un asistente local listo para exportar una copia PostgreSQL cifrada con la contraseña existente introducida fuera del chat.

**Architecture:** Cliente PostgreSQL 17 nativo para el acceso IPv6 disponible en Windows. GnuPG estándar cifra directamente el flujo de pg_dump, sin un dump persistente en claro. Un asistente PowerShell recoge credenciales ocultas en memoria y mantiene fuera de argumentos/registros tanto la contraseña PostgreSQL como la frase de protección de la clave de respaldo. Verificar primero el catálogo mediante transacción de lectura y comprobar descifrado/archivo antes de declarar el resultado satisfactorio.

**Tech Stack:** Node.js, PowerShell, PostgreSQL17, GnuPG2.4, streams.

**Spec:** [Procedimiento operativo](../../produccion/RESPALDO_Y_RESTAURACION.md), restricciones originales de la auditoría y confirmación del usuario de que dispone de la contraseña actual.

## Restricciones

- No recibir secretos por chat, registrarlos o cambiarlos.
- Solo lectura institucional; no lanzar despliegues, migraciones, alteraciones de permisos o restauraciones en producción.
- Claves/archivos cifrados en directorios privados ignorados por Git; custodiar la clave de recuperación aparte antes de aceptar un respaldo institucional.
- Preservar todos los expedientes sellados y laboratorios previos.
- El ensayo con fixtures no se presenta como un respaldo institucional real.

## Pasos y foco de revisión

- [x] Consultar organización/proyecto y comprobar acceso existente sin obtener valores secretos: plan Free; CLI sin sesión; conexión directa IPv6 accesible desde Windows y no desde el contenedor.
- [x] Preparar herramientas nativas y configuración no secreta, con origen y versiones verificables.
- [x] Probar rechazo de destinos incorrectos, filtrado de secretos, cifrado/descifrado y detección de errores antes de aceptar el resultado.
- [x] Implementar ejecutor con parada ante errores, autenticación TLS, guard de catálogo y captura segura de códigos de salida.
- [x] Ensayar el flujo cifrado con fixtures locales y conservar resultados. Integridad documentada en el expediente de esta fase.
- [x] Revisión independiente, documentación y asistente listo para la entrada local de la contraseña. Exportación institucional pendiente de esa entrada.

## Registro de decisiones y validación

Pre-flight: el asistente produce dos variables efímeras de proceso que consume Node; no escribe credenciales en disco. El ejecutor consume clientes PG17 y GnuPG nativos. El ensayo exige laboratorio marcado y expediente nuevo; no admite el origen institucional como fixture.

Correcciones verificadas durante la implementación: rutas MSYS de GnuPG, longitud de sockets del agente y drenaje del flujo descifrado después del cierre temprano de `pg_restore --list`. Se conservaron las ejecuciones fallidas. El cierre ejecutó 10/10 contratos Node y un flujo real sintético que comprueba catálogo, rechazo de deriva/versión, cifrado, recuperación independiente, frase incorrecta, fallo de dump y corrupción.

Final review: revisor independiente solo lectura, 10/10 contratos reejecutados; sin defectos críticos/importantes confirmados. Límite menor documentado: la huella previa no es la huella del snapshot interno de pg_dump ante DDL concurrente. No se presenta como garantía; la exportación consistente y su restauración siguen siendo verificaciones distintas.
