# Credenciales y recuperación de contraseñas

## Fallos encontrados y cambios

- La creación de entrenadores y administradores descartaba las credenciales generadas. La creación de estudiantes tampoco las conservaba cuando fallaba el correo o se elegía entrega manual. Ahora se muestran en un resultado persistente mientras el panel permanece abierto, con envío inicial opcional y reintento del mismo correo sin crear otra cuenta ni cambiar la contraseña.
- El reenvío podía informar éxito sin confirmación del servicio, ignorar el cuerpo del error HTTP y enviar por email aunque se seleccionara solo WhatsApp. Ahora se informan los resultados por canal y se conservan las credenciales ante una entrega parcial o fallida.
- Se bloquean envíos duplicados en los modales y se agrupan reenvíos simultáneos al mismo usuario dentro de la instancia del servicio. No constituye un bloqueo entre distintos dispositivos o administradores.
- Se reutilizan el generador criptográfico de contraseñas y una plantilla HTML que conserva símbolos como `<` y `&`. El reenvío usa el email real de Auth cuando lo devuelve la función actualizada.
- La plantilla de WhatsApp omitía email y contraseña: ahora serializa nombre, email y contraseña en ese orden. Esta corrección tiene prueba con red simulada; no se realizó un envío real por WhatsApp.
- `send-email` verifica sesión, rol y suspensión del solicitante; valida destinatario/asunto y clasifica fallos de Resend, cuotas, configuración y timeout. Requiere un identificador de mensaje para informar aceptación. No reintenta automáticamente.
- `update-user-password` valida contraseña y rol del destinatario; un entrenador puede restablecer estudiantes, y un administrador estudiantes/entrenadores. Las cuentas administradoras conservan su recuperación mediante Auth. Se marca `first_login` después del cambio de contraseña y se informa si falla esa sincronización.
- El cambio de contraseña verifica la contraseña actual usando una sesión aislada. Se unifica la validación en al menos 10 caracteres, mayúscula, minúscula, número, símbolo y sin espacios; no cambia la validez de las contraseñas ya existentes al iniciar sesión.
- La recuperación rechaza errores explícitos del enlace y códigos inválidos aunque haya otra sesión guardada, soporta `token_hash`, PKCE y tokens de recuperación, comprueba que la cuenta no cambió antes de actualizar y bloquea el doble envío. Tras cambiar la contraseña intenta cerrar la sesión incluso si falla sincronizar `first_login` y limpia el usuario de la aplicación.

## Evidencia de validación

- Suite React: 78 suites y 365 pruebas aprobadas.
- `npm run test:auth-edge`: 10 pruebas aprobadas con Resend/Auth simulados; cubren timeout, respuesta incompleta, dominio no verificado, autorización, destinatario inválido, contraseña débil y orden de actualización.
- Contratos existentes: 2 suites y 5 pruebas aprobadas (también incluidas en la suite React).
- Playwright de recuperación: 8 pruebas aprobadas en escritorio Chromium y móvil WebKit. Incluyen PKCE válido, código inválido, enlace expirado y actualización completa con cierre de sesión. Las operaciones Auth/REST están interceptadas y no modifican cuentas reales.
- Deno: comprobación de tipos de `send-email` y `update-user-password` aprobada.
- Compilación de producción, comprobación de textos y 5 pruebas públicas de Playwright aprobadas.
- Se envió un mensaje genérico real por la función desplegada `send-email` a una dirección autorizada por el usuario; el proveedor devolvió un identificador y el destinatario confirmó recepción en la bandeja de entrada. No se cambiaron contraseñas reales.

Esta prueba real corresponde al canal de credenciales Resend. No verifica el SMTP de recuperación de Supabase Auth ni permite determinar los motivos de todos los fallos históricos. Para ello hacen falta los eventos de Resend y los registros/configuración del proyecto correcto.

## Ejecutar las comprobaciones

Instalar las dependencias de la raíz y de `functions/` según la [guía de instalación](../GUIA_SETUP_OTRA_PC.md).

```powershell
$env:CI = 'true'
npm test -- --watchAll=false --runInBand
npm run test:auth-edge
npm run test:contracts
npm run check:copy-quality
Remove-Item Env:CI
npx playwright test tests/e2e/auth.password-recovery.spec.js --project=desktop-1440 --project=mobile-390 --workers=2
npm run e2e:smoke:public
npm run build
$env:DENO_TLS_CA_STORE = 'system,mozilla'
npx --yes deno@2.9.6 check --no-lock supabase/functions/send-email/index.ts supabase/functions/update-user-password/index.ts
```

Prueba manual de entrega, únicamente con un destinatario autorizado y las variables de administrador en `.env.e2e`:

```powershell
node scripts/verifyCredentialEmail.cjs --to correo-autorizado@example.com --confirm-send
```

El script envía un mensaje genérico, no crea cuentas ni restablece contraseñas. No lo ejecutar en CI ni usar listas de usuarios para probar entrega.

## Despliegue pendiente

El proyecto de RioVoley es `mayvvlkvheagkojunzzb`. La conexión de administración disponible en esta sesión no tiene acceso a ese proyecto y no se desplegaron estas correcciones. No aplicar cambios al otro proyecto que aparece en la conexión.

Con una cuenta que tenga acceso al proyecto correcto, desplegar primero las funciones:

```powershell
npx supabase functions deploy update-user-password --project-ref mayvvlkvheagkojunzzb
npx supabase functions deploy send-email --project-ref mayvvlkvheagkojunzzb
```

Verificar en el proyecto las variables `RESEND_API_KEY` y `FROM_EMAIL`, el dominio remitente en Resend y, por separado, SMTP y URL Configuration de Supabase Auth. Usar las URL de recuperación web y Capacitor definidas en [appUrls.js](../src/config/appUrls.js); la configuración local no cambia la allowlist de producción.

Publicar después el frontend por el flujo habitual del repositorio. No se necesitan migraciones de base de datos. Repetir una entrega controlada y una recuperación con cuenta de prueba tras el despliegue; no usar la cuenta de una persona que no haya autorizado el cambio.

## Límites operativos

Un reenvío genera una contraseña nueva antes de contactar al proveedor. Si el correo falla, la contraseña anterior ya dejó de funcionar: conservar las credenciales mostradas y compartirlas por un medio seguro. Evitar otro restablecimiento si basta con entregar la contraseña ya generada. La aceptación por el proveedor no garantiza la entrega en bandeja; los rebotes y spam se investigan con los eventos del mensaje.
