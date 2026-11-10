# Preparación de producción: estado y gates pendientes

Destino indicado por el usuario: https://riovoley.com y https://vercel.com/joscoos-projects/riovoley. Backend observado mediante metadatos: mayvvlkvheagkojunzzb. **No se ha desplegado esta rama ni se ha comprobado todo el funcionamiento institucional.**

## Preparado localmente

- Dependencias y adaptadores identificados, pruebas y lockfiles reproducibles. npm audit final registra cero en raíz, functions y auxiliar; excluye los dos adaptadores locales, comprobados aparte.
- Preflight de variables sin imprimir valores, CI técnico sin despliegue ni credenciales y separación Node22/24. CI remoto aún no ejecutado.
- Vercel: build estricto, sin sourcemaps públicos, tres cabeceras preparadas y desactivación de despliegues automáticos solo para la rama de auditoría. No aplicado al sitio actual.
- [Runbook](../../../../produccion/RUNBOOK.md) con gates de contratos, mantenimiento, respaldo y retorno coordinado. No contiene una migración productiva aprobada.

## Bloqueos observados

| Gate | Evidencia actual | Acción necesaria antes de liberar |
|---|---|---|
| Acceso al frontend correcto | [GET de proyecto Vercel: 403](seguridad/vercel-acceso-equipo.json) para joscoos-projects. | Autorizar ese equipo en el conector. Después consultar deployment activo/SHA, configuración y nombres/presencia de variables sin revelar valores. La conexión no autoriza publicar. |
| Configuración frontend | [Preflight de archivo local](seguridad/preflight-config-local.stdout.log): APP_URL ausente. | Configurar el origen público confirmado en Vercel y repetir el control; no sustituir ni rotar la clave PII. El archivo local no demuestra configuración cloud. |
| Contrato de recompensa diaria | [Catálogo institucional](seguridad/supabase-catalogo-20261031.json): claim_daily_login_reward() ausente. | Preparar y ensayar un cambio SQL adaptado al catálogo real antes de publicar el cliente que llama esa RPC. No aplicar directamente el SQL exclusivo del entorno local. |
| Pagos y funciones privilegiadas | Sobre cargas UUID/bigint, SECURITY DEFINER, EXECUTE amplio y search_path sin fijar. | Revisar cuerpos, dependencias y compatibilidad; preparar diff y retorno específicos. La metadata no acredita por sí sola un exploit. |
| Alertas Supabase | [Advisores](seguridad/supabase-advisores.json), observación del día30: search_path, pg_net, ejecutabilidad de funciones, contraseña filtrada y actualización de PostgreSQL. | Revisar y ensayar correcciones concretas; obtener autorización expresa antes de cambiar esquema/permisos/settings/versión. No se han corregido remotamente. |
| Edge | [Nueve funciones desplegadas](seguridad/supabase-edge-20261031.json), verify_jwt=true en metadata. | Comparar fuentes/versiones y autorización efectiva; plan de publicación/retorno coordinado con SQL/cliente. No se invocaron funciones institucionales. |
| Backup y recuperación | No se cuenta con evidencia operativa de respaldo/restauración de BD/Auth/Storage ni responsables/ventana. | Acreditar cobertura, restauración ensayada, retención y tratamiento de escrituras posteriores. No basta con un dashboard saludable. |
| Clientes antiguos | Versiones APK/Capgo activas no inventariadas. | Garantizar transición compatible y mecanismo de retiro/actualización antes de cambiar contratos. APK de auditoría es debug/offline y privado. |
| Proveedores y Auth cloud | No se verificaron SMTP/Resend, FCM, scheduler, Site URL/redirects y permisos efectivos. | Confirmar configuración segura y ensayar con datos/cuentas descartables autorizados; no utilizar .env.e2e institucional. |
| Liberación | No hay SQL de producción ensayado y aprobado, aprobación final de release ni smoke postdespliegue. | Completar gates anteriores, presentar versiones/diff/backup/retorno concretos y obtener aprobación final. Después publicar y verificar; no antes. |

Las escrituras funcionales se ejecutan exclusivamente en el stack local descartable. La inspección pública realizó GET de cuatro rutas sin ejecutar JavaScript ni autenticarse; HTTP200 no prueba login, roles, pagos ni recompensas. CSP y Permissions-Policy siguen pendientes del inventario de proveedores y ensayo de dispositivos; no se activaron reglas sin medir su compatibilidad.

Este documento describe una preparación revisable, con bloqueos explícitos. Los reportes locales no reemplazan los gates institucionales ni una evaluación con usuarios.

