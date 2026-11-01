# Paquete Edge preparado, pendiente de despliegue

Estado: fuentes candidatas y retorno preparados, comprobados únicamente en local. No se desplegó ninguna función ni se modificaron secretos institucionales.

- [Informe y registros](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md).
- [Manifiesto final del paquete](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/seguridad/paquete-edge-final.json).
- [Comparación con Cloud](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/seguridad/comparacion-edge.json).
- [Secuencia SQL comprobada](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/seguridad/retorno-combinado.json).
- [Respaldo y restauración pendientes](RESPALDO_Y_RESTAURACION.md).

## Artefactos revisables

En el equipo de auditoría se conservan, fuera de Git:

- `.e2e-local/edge-production/cloud-sources.json`: fuentes descargadas por lectura autorizada de nueve funciones y metadatos de las revisiones actuales.
- `.e2e-local/edge-production/packets/candidate/`: 39 archivos con las fuentes candidatas, `supabase/config.toml`, un lock de dependencias y configuración Deno por función. Los nueve `verify_jwt` se mantienen en `true`.
- `.e2e-local/edge-production/packets/return/<función>/`: un árbol por función con las fuentes Cloud exactas. La separación impide mezclar dependencias compartidas de distintas revisiones.
- `.e2e-local/edge-production/return-bundles/`: nueve compilaciones JavaScript de esas fuentes de retorno; sus hashes y tamaños están publicados en el expediente. No son el ESZIP original del proveedor.

Los archivos privados no incorporan valores de variables de entorno. Deben custodiarse junto con su manifiesto y revisarse antes de copiarlos a otro equipo. El repositorio publica fuentes de las correcciones, generadores y hashes; no publica los bundles ni una copia de secretos.

Tres entrypoints difieren respecto a Cloud, pero módulos compartidos también cambian para otras funciones. Revisar el paquete completo de nueve funciones y su grafo; un archivo principal idéntico no demuestra equivalencia de comportamiento.

## Validación y alcance

El cierre aprobó 35 contratos Node, 12 casos HTTP de usuarios/push y nueve casos HTTP de reportes, con denominadores separados. Las suites HTTP usan Auth/REST/PostgreSQL/Storage reales locales y datos sintéticos. El PDF comprobado corresponde al padrón; no se ejecutó la generación satisfactoria de PDFs de asistencia o finanzas.

Los 35 contratos se ejecutan con `npm run test:edge-contracts` y se incorporaron al workflow técnico existente. El comando aprobó localmente; esto no atribuye un resultado a una ejecución futura de GitHub Actions.

Se corrigieron los errores TypeScript detectados, se normalizan relaciones uno a uno sin escoger destinatarios arbitrarios, se deniega a personal suspendido la operación de reportes y se bloquea el job de recordatorios si falta el secreto del scheduler. Google Auth se fijó a 10.9.1; un caso con SDK/firma reales y transporte OAuth simulado verificó su contrato. No se demostró entrega FCM ni validez de credenciales del proveedor.

La comprobación de los nueve entrypoints del candidato usa configuración Deno explícita y lock congelado. `deno audit` terminó con cero avisos en su grafo npm después de detectar uno moderado en el grafo anterior. Este resultado no cubre todos los módulos HTTPS/esm.sh ni las versiones que continúan desplegadas.

También se repitió `npm audit` para raíz, `functions` y `riovoley`: los tres árboles registraron cero avisos. El resultado del registro no analiza exhaustivamente los adaptadores locales de dependencias, comprobados por separado en el expediente anterior.

Cloud no suministró cuatro imports solo de tipos en tres funciones de retorno. Se conservaron las fuentes sin inventar esos archivos y se verificaron sus dependencias de ejecución. Los nueve bundles de retorno compilaron con `deno bundle`, herramienta experimental que por defecto no comprueba tipos. El retorno gestionado sigue pendiente de ensayo aislado, igual que la publicación del candidato.

## SQL y orden obligatorio

Primero debe estar aprobado y disponible el [paquete principal](../../database/security/production-proposal/README.md). Las pruebas detectaron que `service_role` carece de permisos en las tablas de reportes aunque sí los tiene en sus vistas. La lectura institucional confirmó la diferencia.

Se prepararon el [complemento de permisos](../../database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql) y su [retorno](../../database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql): lectura de definiciones y operaciones de ejecución/artefactos, sin escritura de definiciones. No se aplicaron a producción.

La secuencia ensayada es:

1. Ventana cerrada y clientes coordinados; comprobar respaldo, destino, propietario y huellas.
2. Avance SQL principal, seguido del complemento de reportes.
3. Publicación coordinada de Edge y clientes únicamente después de la aprobación institucional y de los gates del runbook.
4. Ante decisión de retorno, conservar la ventana cerrada, coordinar los componentes y retornar **primero el complemento y después el SQL principal**.

El orden incorrecto de retorno fue rechazado por la huella y el correcto se ejecutó realmente en la base sintética. Los dos retornos reintroducen los contratos anteriores; no restauran datos ni sustituyen un backup.

## Configuración pendiente

Los nombres consumidos son `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` y `REPORTS_SCHEDULER_SECRET`. Su presencia y validez en Cloud no se comprobaron leyendo valores. La clave privilegiada permanece exclusivamente en servidor.

Faltan la verificación del bucket privado `reports` y sus políticas, credenciales y permisos IAM, remitente SMTP/Resend, emisor del scheduler y su secreto, compatibilidad del runtime gestionado y pruebas en entornos de proveedores descartables. En local se creó únicamente el bucket de ensayo necesario; no se crearon buckets institucionales ni se enviaron notificaciones reales.

No se puede abrir la ventana sin respaldo institucional recuperable y restauración aislada comprobada. El usuario confirmó que todavía faltan; el ensayo de backup local no satisface ese requisito.

## Reproducción local

Usar un contexto nuevo de evidencias y el [stack sintético](../../scripts/e2e/local/README.md), conservando antes los directorios privados de sesiones anteriores. Las entradas de `cloud-sources.json` deben proceder de lecturas autorizadas reales; no completar campos con ejemplos.

```powershell
node scripts/audit/production/initialize-edge-packet.cjs
node scripts/e2e/local/manage.cjs start
node scripts/audit/security/run.cjs edge contratos-edge
node scripts/audit/security/edge-http.cjs
node scripts/audit/production/edge-reporting-http.cjs
```

Antes de la suite de reportes, preparar el cuerpo exacto de permisos exclusivamente en la base local verificada. Los scripts de preparación SQL de esta sesión dependen del laboratorio y huellas del expediente principal; no son aplicadores Cloud genéricos. La generación de paquetes está en `scripts/audit/production/create-edge-packet.cjs` y el chequeo congelado se conserva con todos sus argumentos en el expediente. Las cachés y el lock se preparan mediante comprobación estática; los handlers se ejecutan después con la red limitada a loopback.

La CLI o los scripts no deben recibir claves por argumentos ni imprimir variables. Este documento prepara el trabajo; no autoriza ejecutar `functions deploy`, cambiar `verify_jwt`, promover clientes o modificar el backend institucional.
