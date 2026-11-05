# Inventario de configuración para producción

Inventario derivado de [.env.example](../../.env.example), [README](../../README.md),
[Edge Functions](../../supabase/functions), [cifrado actual](../../src/utils/piiCrypto.js),
[Capacitor](../../capacitor.config.json) y [Gradle](../../android/app/build.gradle).
Solo se documentan nombres y comprobaciones. Ninguna plantilla contiene credenciales utilizables.

Todo `REACT_APP_*` se incorpora al JavaScript público de CRA y al bundle Android/OTA.
No constituye almacenamiento de secretos. Las claves `anon` heredadas y `sb_publishable_…`
son admisibles en el cliente; `service_role`, `sb_secret_…`, credenciales de correo,
FCM, WhatsApp o firma solo pertenecen al backend o al almacén privado del operador.
Véase la [documentación oficial de claves Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

| Ámbito | Nombres | Comprobación y tratamiento |
| --- | --- | --- |
| Frontend obligatorio | `REACT_APP_SUPABASE_URL` | Origen HTTPS público del proyecto confirmado `mayvvlkvheagkojunzzb`; sin credenciales, ruta, parámetros ni fragmentos. |
| Frontend obligatorio | `REACT_APP_SUPABASE_ANON_KEY` | `anon` JWT no expirado o clave publishable; nunca sesión de usuario, service_role ni secret. Nombre heredado conservado aunque el formato sea publishable. |
| Frontend obligatorio | `REACT_APP_APP_URL` | Dominio oficial confirmado por el usuario: [riovoley.com](https://riovoley.com). Comprobar certificado y Auth URL Configuration reales. |
| Frontend obligatorio, compatibilidad | `REACT_APP_PII_ENCRYPTION_KEY` | Preservar exactamente la clave histórica: comprobar coincidencia en entorno privado y restauración con datos de ensayo. No registrar valor ni derivaciones. No generar otra como arreglo de despliegue. |
| Frontend bloqueante si presente | `REACT_APP_WHATSAPP_ACCESS_TOKEN` | Es un secreto en el cliente. Vaciarlo en build no acredita una integración funcional: decidir desactivar el flujo o migrarlo al backend y verificar contratos antes del lanzamiento. |
| Frontend opcional | `REACT_APP_WHATSAPP_PHONE_NUMBER_ID`, `REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID` | Confirmar titularidad y necesidad si se mantiene la integración; no son el token de autorización. |
| Frontend opcional, dato público | `REACT_APP_CLUB_ADMIN_PHONE`, `REACT_APP_CLUB_COACH_PHONE`, `REACT_APP_CLUB_EMERGENCY_PHONE` | Confirmar números institucionales y autorización para publicarlos. Omitir si no procede. No usar datos de atletas. |
| Frontend diagnóstico | `REACT_APP_ENABLE_SQL_AUDIT`, `REACT_APP_ENABLE_WEB_VITALS_LOG` | Omitir o `false` en producción; revisar logs para evitar datos sensibles. |
| Frontend diagnóstico OTA | `REACT_APP_ENABLE_OTA_DIAGNOSTICS` | Omitir o `false` en producción. Solo `true` muestra el panel técnico en una plataforma compatible y en la portada; reservarlo para compilaciones de diagnóstico. No cambia el motor OTA ni constituye control de permisos. El preflight de frontend/native/all rechaza su activación. |
| Frontend versión/OTA | `REACT_APP_VERSION`, `REACT_APP_CAPGO_DEFAULT_CHANNEL` | Versionar el release; confirmar correspondencia con bundle y canal. Para perfil native se exige canal `production` explícito. |
| Edge obligatorio | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Coincidir con el proyecto real; clave pública para contexto del usuario y privilegiada solo en servidor. La plataforma suministra los nombres reservados: verificar sin copiarlos al frontend. |
| Edge correo obligatorio | `RESEND_API_KEY`, `FROM_EMAIL` | Clave privada con acceso mínimo, remitente y dominio verificados por operador. Prueba controlada en entorno de ensayo; una forma válida no demuestra entrega. |
| Edge push obligatorio | `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` | Identidad del proyecto Firebase esperado, cuenta de servicio y PEM íntegro; el preflight solo comprueba formato exterior, no firma ni permisos. No leer ni publicar google-services/credenciales para llenar el informe. |
| Edge scheduler obligatorio | `REPORTS_SCHEDULER_SECRET` | Secreto no plantilla, al menos 32 caracteres; comprobar que el emisor programado usa el mismo secreto y respeta su contrato HTTP. |
| Android firma obligatoria | `KEYSTORE_PASSWORD`, `KEY_PASSWORD` | Coincidir con keystore y alias ya usados por la app publicada. Verificación y custodia del archivo por operador; no generar ni subir una firma alternativa. |
| Android y OTA, configuración externa | Sin nuevos nombres de entorno | Confirmar `applicationId`, incremento de `versionCode`/`versionName`, keystore/alias, Firebase Android, permisos, API del dispositivo, versión nativa mínima y política Capgo/canales desde los archivos y servicios vigentes. Son controles manuales pendientes. |

La clave PII actual se deriva en el cliente y participa en cifrado e índices HMAC de
búsqueda. Su presencia no demuestra confidencialidad frente al usuario que obtiene
el bundle. Cualquier cambio de clave o diseño requiere inventario, migración de
cifrados e índices y plan de compatibilidad separado. Si la clave histórica es
débil o corta, detener el lanzamiento para evaluación; no reemplazarla al azar.

`functions/` y `riovoley/` son árboles npm auxiliares: su existencia y auditoría no
prueban que estén desplegados. Identificar el servicio real antes de tratarlos como
parte del release. No añadir variables supuestas que su código no consume.

## Preflight sin carga automática de archivos

El operador suministra las variables al **entorno del proceso** desde su gestor
privado habitual. La herramienta no abre `.env`, `.env.local`, `.env.e2e` ni
`.e2e-local`, y no acepta valores en argumentos ni `--env-file`. No volcar el
entorno completo en consola ni en un ticket. Ejecutar desde una sesión limpia para
evitar variables de otros proyectos o `NODE_OPTIONS` de carga automática.

```powershell
node scripts/production/preflight.cjs --profile frontend --structure
node scripts/production/preflight.cjs --profile backend --structure
node scripts/production/preflight.cjs --profile native --structure
node scripts/production/preflight.cjs --profile all
```

Los perfiles frontend/native/all exigen la clave PII presente y sin plantilla;
no imponen cambiar la longitud de una clave histórica. Backend exige correo,
push y scheduler porque forman parte del inventario actual completo. Toda variable
`REACT_APP_*` desconocida bloquea hasta revisión de la lista pública permitida.
La herramienta inspecciona las variables públicas incluso con perfil backend.

Salida: solo nombres permitidos, estados y el origen fijo `PROCESS_ENV_EXPLICIT_ONLY`;
no valores, dominios, correos, tokens, fragmentos ni mensajes de los parsers.
Código **1** significa argumentos/configuración inválidos o ausentes; **0** con
`--structure` significa únicamente forma válida; **2** sin esa opción significa
que la autorización sigue bloqueada aunque la estructura sea válida. Ningún flag
de aprobación, variable de backup o configuración completa puede desbloquear el
despliegue. Los controles se registran en el [runbook](RUNBOOK.md).

Limitaciones: no verifica firmas JWT, autenticidad de claves, DNS/TLS, proveedores,
keystore, acceso al proyecto, continuidad PII ni existencia/restauración de backups.
El CI usa valores sintéticos de loopback deliberadamente inválidos para producción;
un build verde no sustituye este preflight ni la aprobación operacional.
