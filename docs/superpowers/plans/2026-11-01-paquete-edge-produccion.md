# Preparación y comprobación de Edge Functions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Ejecutar en la sesión actual; no desplegar funciones ni invocar operaciones institucionales.

**Goal:** Preparar fuentes candidatas y retorno de las nueve funciones Edge, corregir los defectos verificables detectados y conservar resultados locales reproducibles.

**Architecture:** Descargar código Cloud únicamente como lectura a almacenamiento privado, comparar hashes y dependencias con el repositorio y preparar árboles separados por función para evitar mezclar versiones compartidas del retorno. Comprobar tipos con Deno y contratos/handlers con dependencias simuladas o Supabase local, distinguiendo ambos alcances.

**Tech Stack:** Supabase Edge Functions, Deno 2.9.6, TypeScript, node:test/tsx, Auth/PostgreSQL local.

**Spec:** [Runbook](../../produccion/RUNBOOK.md) y [paquete SQL previo](../../../database/security/production-proposal/README.md).

## Global Constraints

- Cloud: solo lectura de metadatos y código, sin despliegue, invocación, cambios de secretos ni registros.
- Conservar todos los expedientes previos y los intentos fallidos de esta ejecución.
- No enviar FCM, correo ni notificaciones institucionales.
- No ocultar errores mediante any, supresiones TypeScript o conversiones que eviten comprobar el contrato real.
- El retorno de fuentes no equivale a restaurar un bundle binario ni demuestra recuperación gestionada.

## Review Focus

- Relaciones PostgREST: aceptar objeto o un elemento y rechazar multiplicidad inesperada para no seleccionar un destinatario arbitrario.
- Roles: personal suspendido debe ser rechazado antes de ejecutar reportes con service_role.
- Scheduler: ausencia de secreto debe bloquear recordatorios antes de consultar o escribir.
- Snapshots/PDF: conservar tipos concretos y calcular checksum solo de los bytes de la vista recibida.
- Artefactos: mantener dependencias/versiones del retorno separadas para cada función y no publicar secretos en fuentes Cloud.

### Tareas

- [x] Leer las nueve funciones Cloud y conservar fuentes privadas; inicializar expediente sin reutilizar el anterior.
- [x] Ejecutar contratos existentes y chequeo Deno de los nueve entrypoints; conservar el fallo de caché y los 23 errores de tipos detectados.
- [x] Escribir y ejecutar pruebas de regresión fallidas para relaciones, autorización de reportes y secreto del scheduler.
- [x] Corregir tipos y controles sin modificar la lógica para simular resultados aprobados; repetir pruebas y chequeo Deno.
- [x] Comparar Cloud/repositorio, preparar candidato/retorno privados y manifiestos públicos sin valores sensibles.
- [x] Revisar de forma independiente, comprobar integridad y privacidad, documentar y subir a la rama autorizada sin despliegue.

## Cierre y límites operativos

- Usuario confirma que aún faltan respaldo institucional y entorno de restauración comprobados; se preparó procedimiento y ensayo exclusivamente sintético.
- Restore directo falló por calculate_age no inmutable bajo columna GENERATED; otra base vacía restauró con adaptación temporal y definición original repuesta. La base origen no se modificó.
- Deno detectó un aviso moderado uuid a través de GoogleAuth 9; se fijó 10.9.1, se comprobó SDK/firma con OAuth simulado y el grafo npm candidato llegó a cero avisos.
- Publicación preparada para la misma rama; verificar commit remoto antes de declarar la subida. Ningún gate de producción se considera aprobado.
