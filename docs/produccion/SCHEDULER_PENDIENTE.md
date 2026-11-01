# Scheduler: secreto configurado; emisor pendiente

El 1 de noviembre de 2026 se creó únicamente `REPORTS_SCHEDULER_SECRET`, con autorización del usuario mediante CONTINUA tras la solicitud concreta. La escritura única y su lectura posterior comprobaron el digest del nuevo valor y la conservación de todos los demás digests en memoria. Los seis nombres personalizados requeridos están presentes; no se publicaron valores ni digests. Su presencia no acredita validez de proveedores ni entrega de correo/push.

Se generaron 32 bytes aleatorios codificados en base64url. Hubo dos comprobaciones de ausencia antes de la escritura y se prepararon copias privadas GPG/DPAPI antes de transmitir el valor. GPG usa el destinatario del respaldo existente; DPAPI comprobó recuperación inmediata para el usuario local. No se volvió a descifrar la copia GPG con la frase de recuperación. Los archivos cifrados y el recibo están en el directorio privado indicado por la evidencia, fuera de Git. No se desplegaron funciones, crearon jobs, configuraron emisores ni invocaron recordatorios.

Crear el secreto no acredita un scheduler funcional: siguen pendientes la identificación y configuración del emisor autorizado, su encabezado y las pruebas controladas sin destinatarios institucionales. La autorización recibida se limita al secreto; no abarca SQL, despliegues, tareas o envíos.

La CLI 2.122.0 recibió el archivo dotenv mediante una tubería Windows de una conexión; el valor no pasó por argumentos o archivos en claro. Se ejecutó desde configuración mínima nueva fuera del repositorio para evitar cargar otros secretos. La integración se probó primero con la CLI real contra HTTP loopback y datos sintéticos. No repetir el creador: si el nombre ya existe, se detiene sin sobrescribirlo. Para una futura rotación o configuración del emisor se necesita su propio alcance autorizado.

[Inventario y límites de Edge](EDGE.md), [informe de comprobación](../tesis/evidencias/verificacion-tecnica/20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md).
