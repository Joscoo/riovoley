# Corrección de alertas y preparación de producción — Implementation Plan

> **For agentic workers:** Ejecutar con superpowers:executing-plans; separar preparación documental y corrección de herramientas según superpowers:dispatching-parallel-agents, con propiedad de archivos explícita.

**Goal:** Corregir las dos causas de avisos restantes y preparar una entrega institucional revisable, sin publicarla.

**Architecture:** Mantener CRA/React/Capacitor/Supabase. Adaptar únicamente el arranque de desarrollo a la API actual del servidor. Aplicar un cambio defensivo mínimo a una copia local identificada de deepmerge; conservar procedencia/licencia y comprobar contratos de sus consumidores. Documentar los límites del análisis npm de código local.

**Tech Stack:** Node24, npm11, webpack/CRA, Jest, Playwright, Android y Supabase.

**Spec:** Solicitud del usuario «corrije las alertas y vamos a empezar con preparar todo para produccion», restricciones iniciales de auditoría y docs/tesis/README.md.

## Global Constraints

- No cambiar framework ni lógica del negocio para aprobar pruebas.
- No desplegar, fusionar a main, publicar APK o cambiar SQL/RLS/permisos institucionales sin aprobación concreta.
- No exponer secretos ni datos personales; consultas institucionales solo de metadatos y lectura.
- No esconder avisos con downgrade, versiones ficticias o exclusiones silenciosas: el código local queda explícitamente fuera del registro npm y se verifica aparte.
- Conservar los diez expedientes anteriores y las reproducciones fallidas.

## Review Focus

- Objetos con prototipo nulo, placeholders null/undefined y claves __proto__ en ambos lados de merge.
- Compatibilidad de arrays, símbolos, customMerge, clonación y deepmerge.all.
- Orden de middlewares, TLS, proxy, HMR y cierre con la API del servidor actual.
- Preflight de configuración sin revelar valores ni aceptar claves privilegiadas en frontend.
- Despliegue coordinado de cliente/Edge/SQL, comparación de catálogo, respaldo y reversión.

## Pasos

- [x] Abrir expediente; volver a consultar npm y metadatos institucionales de solo lectura.
- [x] Reproducir el problema de merge; verificar en un spike privado el empaquetado local sin cambiar la app.
- [ ] Incorporar corrección local mínima y servidor actualizado con adaptación y regresiones.
- [x] Preparar preflight, CI sin despliegue, matriz de configuración y runbook de publicación/retorno.
- [x] Ejecutar pruebas, compilación, E2E y comprobaciones nativas pertinentes; conservar límites de alcance.
- [ ] Revisar, sellar y subir los avances; dejar la aprobación institucional como paso final separado.

Resultados de ejecución: Jest419/88, Node76, npm ci independiente +76, guardas12, Playwright249 (se conservan tres fallos previos), smoke estricto3, HTTP/HMR5, web estricto0 y Gradle debug0. Revisión independiente cerrada; cierre documental/sello y publicación de la rama se efectúan después de las comprobaciones de privacidad e índice. Producción no autorizada/publicada; ver runbook y estado de producción.
