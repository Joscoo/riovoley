# Auth y Storage: alcance comprobado

Se ejercitaron servicios Supabase reales del entorno local riovoley-e2e-local, mediante la API 127.0.0.1:55321 y PostgreSQL55322. Se recrearon dos cuentas descartables y dos buckets privados por intento, dentro de este contexto. La cuenta y bucket B actuaron como controles. Se reutilizó exclusivamente la contraseña de una fixture local existente, sin publicar su valor, cambiar contraseñas existentes o generar claves de proveedor.

El [intento final](integracion/intento-servicios-1794236393839.json) enlaza sus resultados, respuestas HTTP, observaciones y limpieza exactos. Los 24 controles incluyen login/refresh/borrado de Auth, lectura con JWT previo, upload/upsert/remove/move de Storage, descargas, control de reasignación SQL y limpieza. No son 24 casos de interfaz ni una suite Playwright. [Controles](integracion/resultados-servicios-1794236393839-243436.json).

Se observaron 12 respuestas Auth (9 HTTP200 y 3 HTTP500 esperados de rechazo) y 22 Storage (18 HTTP200 y 4 HTTP500 esperados). Los errores se conservaron como respuestas reales; no se sustituyeron por respuestas simuladas. Un fallo HTTP por sí solo no demuestra ausencia de efectos: por eso se compararon los digests de cuatro tablas Auth de la cuenta seleccionada, nombres de objetos listados, bytes descargados y archivos físicos propios. [HTTP](integracion/http-servicios-1794236393736-19e57a.json), [observaciones](integracion/observaciones-auth-storage-1794236393833-d0b96b.json).

El backend local observado es filesystem, raíz /mnt. El inventario inicial encontró un archivo físico real cuyo SHA-256 corresponde al centinela subido; no se aprobó una comparación entre inventarios vacíos. Durante las operaciones rechazadas permanecieron el archivo, su digest y los bytes descargados. Después de retirar los disparadores, login, subida y movimiento entre buckets funcionaron. [Limpieza](integracion/limpieza-fixtures-1794236393836-cf48d6.json): cuentas Auth y core.users propias eliminadas, buckets eliminados, cero archivos físicos propios restantes, catálogo de vuelta al fingerprint inicial y disparadores retirados.

## Fallos y correcciones del prototipo

La revisión detectó que la limpieza se registraba sin hacerla obligatoria para el éxito del proceso, y que un UPDATE solo consideraba la propiedad nueva. Se corrigieron ambas condiciones. La primera regresión no fue válida para demostrar la elusión: falló con 42501 al intentar SET ROLE. Se conservó el resultado 21/22 y se cambió el ensayo a una conexión real supabase_storage_admin. Esa segunda regresión también quedó 21/22: faltó el rechazo esperado al mover la fila fuera del bucket seleccionado, y la transacción se revirtió. Tras comprobar OLD y NEW, el ensayo ampliado final pasó 24/24. [Revisión](seguridad/revision-independiente.json).

## Límites que permanecen

- Se probaron servicios Docker locales y datos descartables; no Cloud ni S3 gestionado.
- La barrera es condicional a las fixtures seleccionadas. No se activó mantenimiento global ni se integró con los cuatro SQL institucionales.
- El JWT previo siguió permitiendo lectura. Una barrera de escritura no acredita revocación de tokens o retirada de clientes.
- Los rechazos se observaron como HTTP500, sin un contrato de mantenimiento HTTP503 o de interfaz ensayado. Antes de uso institucional deben revisarse respuestas y reintentos.
- No se invocaron Resend, Firebase, push, scheduler o proveedores externos. El SMTP Auth observado apunta al contenedor local de pruebas; no se ensayó entrega de correo.
- El digest Auth cubre users/sessions/refresh_tokens/identities del sujeto; no todas las tablas de Auth. Storage compara nombres y bytes indicados, sin afirmar validación exhaustiva de todos sus metadatos o rutas.
- Continúan pendientes respaldo vigente, cobertura gestionada completa, paquete institucional revisado y ventana/autorización. La ventana propuesta del 7 de noviembre caducó.

La documentación oficial indica que los objetos se deben eliminar mediante [Storage API](https://supabase.com/docs/guides/storage/management/delete-objects); por ello la limpieza de archivos utilizó esa API y no DELETE SQL sobre storage.objects. El DELETE SQL de core.users se limitó a los UUID recién creados por este ensayo. Los [límites anteriores](../20261109-142059-paquete-barrera-57a1e7b/PAQUETE_LOCAL_REVISABLE.md) no quedan automáticamente cerrados por esta prueba local.

