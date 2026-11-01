# Configuración pendiente del scheduler

La lectura autenticada del 1 de noviembre de 2026 confirmó cinco de los seis nombres personalizados requeridos. Falta únicamente `REPORTS_SCHEDULER_SECRET`. No se consultaron valores de secretos. La presencia de los otros nombres no acredita su validez ni la entrega de correo/push.

La propuesta revisable consiste en crear **solo** ese nombre en el proyecto `mayvvlkvheagkojunzzb`, con 32 bytes aleatorios codificados en base64url, conservando el valor exclusivamente por un canal privado. Antes de escribir debe comprobarse otra vez que el nombre continúa ausente; si existe, detenerse y no sobrescribirlo. Después se comprobará su presencia mediante lectura autenticada. No desplegar funciones, crear jobs, configurar emisores ni invocar recordatorios como parte de esta operación.

La escritura no está autorizada todavía. La restricción original del usuario exige no cambiar secretos ni permisos sin autorización expresa. Este documento no crea un secreto ni supone autorización. Un secreto preparado tampoco acredita un scheduler funcional: deben identificarse y configurar por separado el emisor autorizado, el encabezado correspondiente y los criterios de prueba sin destinatarios institucionales.

La CLI privada disponible es Supabase 2.122.0. Su ayuda admite `secrets set --env-file`; no documenta stdin. No pasar el valor por argumentos ni crear un archivo en claro en el repositorio. Antes de automatizar la escritura se necesita una interfaz privada verificada que evite la publicación de valores, comandos sensibles y diagnósticos sin filtrar.

[Inventario y límites de Edge](EDGE.md), [informe de comprobación](../tesis/evidencias/verificacion-tecnica/20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md).
