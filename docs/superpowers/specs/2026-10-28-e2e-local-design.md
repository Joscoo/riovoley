# Entorno E2E local de RIOVOLEY

Preparar y ejecutar las pruebas autenticadas pendientes de la auditoría técnica mediante Supabase real local, exclusivamente con datos ficticios. El usuario autorizó armar el entorno después de revisar sus requisitos; se continúa sin otra ronda de confirmación.

## Enfoque

Se elige Supabase local sobre Docker ya instalado: permite PostgreSQL, Auth, RLS y Functions reales sin crear recursos remotos ni copiar registros institucionales. Un proyecto remoto descartable es alternativa si Docker resulta inviable; su creación no está autorizada implícitamente si implica costes. Mocks de navegador no satisfacen la persistencia real buscada.

## Límites

- Producción: únicamente lecturas de metadatos si se necesitan para contrastar esquema. No ejecutar migraciones, escrituras, login, cambios de credenciales ni permisos remotos.
- Estado local preservado: no descartar evidencias ni pruebas previas; no sobrescribir .env/.env.e2e institucionales, build/ anterior ni lockfile principal.
- Runtime privado en .e2e-local/, ignorado por Git. Configuración, bootstrap y pruebas del arnés versionables en scripts/e2e/local/ y playwright.local.config.cjs.
- Claves y contraseñas locales generadas se guardan solo en runtime ignorado; logs/reportes se redactan. Nunca exponer service_role al navegador.
- Solo loopback y puertos reservados para E2E; el navegador rechaza servicios externos. Correo/WhatsApp/push reales no se habilitan.

## Componentes

1. CLI Supabase con versión fijada y proyecto local con id/puertos distintos del proyecto habitual.
2. Baseline de esquemas de aplicación a partir del dump solo de estructura existente, más migraciones pertinentes revisadas; no restaurar esquemas administrados Auth/Storage/Realtime sobre los de Supabase local. Contrastar inventario con metadatos remotos para declarar divergencias.
3. Seed idempotente de cuentas ficticias por rol, perfiles, estudiantes y datos de negocio de prueba. Usuarios creados mediante Auth admin local y relaciones con UUID sintéticos.
4. Lanzador CRA con variables explícitas locales y build independiente; jamás reutilizar un servidor que pueda apuntar a producción.
5. Configuración Playwright local que valida destinos, credenciales y modo de escritura, con ejecución inicial secuencial. Primero smoke de roles; después batería pendiente y flujo de mutación.
6. Expediente nuevo de evidencias con códigos de salida, resultados y limitaciones; conservar intacta la auditoría inicial.

## Criterios de entrega

El arnés debe rechazar un destino remoto, crear las tres sesiones Auth locales, comprobar acceso por rol y persistencia real sin registros institucionales, permitir repetir la preparación y documentar cómo iniciar/detener el stack. Las pruebas existentes pueden fallar por defectos o selectores antiguos: conservar el resultado, investigar antes de modificar una expectativa y no cambiar lógica de producción para forzar aprobaciones.
