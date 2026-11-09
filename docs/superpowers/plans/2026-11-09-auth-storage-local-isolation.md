# Ensayo local de Auth y Storage durante una barrera SQL

**Objetivo:** comprobar límites de la barrera con servicios HTTP reales locales, cuentas/buckets descartables y bytes sintéticos. No validar Cloud ni enviar mensajes externos.

**Diseño:** usar exclusivamente el proyecto local identificado riovoley-e2e-local, API127.0.0.1:55321 y PostgreSQL127.0.0.1:55322. Reutilizar las credenciales locales existentes sin imprimirlas ni cambiarlas. Crear dos identidades de ensayo y dos buckets privados únicos; una identidad/bucket quedan congelados mediante disparadores condicionales propios, el otro par actúa como control. Los disparadores no deben afectar filas de otras cuentas/buckets. El propietario SQL mantiene la excepción administrativa de los prototipos anteriores.

## Fases

1. Verificar destino, versiones/containers y esquema; abrir expediente nuevo. Crear fixtures solo mediante Auth/Storage API, sin alta de atletas, pagos, asistencias o evaluaciones.
2. Control abierto: login de ambas cuentas, subida y descarga de bytes sintéticos y lectura de metadatos.
3. Instalar barrera condicional en auth.users/sessions/refresh_tokens y storage.objects/buckets. Ensayar login/refresh/borrado de la cuenta seleccionada, uso de JWT previamente emitido, subida/upsert/borrado de objetos y operación de la cuenta/bucket control. Comparar bytes de descarga e inventario físico limitado al bucket propio en el backend filesystem local.
4. No suponer que un error HTTP garantiza ausencia de efectos. Registrar por separado rechazos, metadatos y bytes. Un cambio físico inesperado se informa como fallo del criterio de congelación, sin modificar expectativas para aprobar.
5. Retirar disparadores propios en finally; volver a comprobar operación, limpiar solo fixtures propios mediante APIs y borrar únicamente las filas core.users de los UUID recién creados si Auth no los elimina. Conservar la titularidad local en el runtime privado para recuperación. No eliminar archivos ajenos ni cambiar contraseñas.
6. Revisión independiente, documentación con resultados reales, integridad/privacidad, sellado, commit/push de avances y CI.

**Límites:** no ejercita servicios Cloud, correo, push o scheduler. El backend filesystem local no equivale a S3 gestionado. Una barrera de escritura no revoca por sí sola JWT existentes. No se convierte el prototipo en mantenimiento global ni se activa una ventana institucional.
