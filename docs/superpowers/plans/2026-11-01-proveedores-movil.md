# Validación de proveedores y Android aislado

**Objetivo:** comprobar las credenciales actuales sin entregar correo/push y completar las pruebas móviles en un backend local descartable. No aplicar SQL, activar scheduler ni desplegar clientes.

**Diseño:** asistente PowerShell con entrada oculta para Resend y lectura del JSON existente de cuenta de servicio Firebase. Node mantiene valores/tokens en memoria, contrasta hashes con el listado administrativo de Supabase y limita transporte a GET dominios Resend, OAuth Google y FCM con validate_only=true y un topic sintético. Nunca se usa el endpoint de envío de correo o una petición FCM sin esa bandera. Una clave Resend restringida puede bloquear lectura de dominios; no se interpreta como credencial inválida ni se amplían permisos.

Android usará una copia privada de depuración con origen, anon y clave PII del laboratorio local. ADB reverse permite conectar a loopback con radios y rutas externas desactivados. OTA y proveedores externos quedan deshabilitados en esa copia. Se conserva el APK firmado anterior y no se modifican sus bytes o la lógica del producto. Antes de ejecutar se vuelve a medir memoria libre. El usuario cerró las aplicaciones Java ajenas; no se mataron procesos ni contenedores con datos restaurados.

- [x] Registrar expediente nuevo y memoria observada; no tocar evidencias selladas.
- [x] Guardas de transporte/configuración con RED→GREEN y fuentes oficiales verificadas: 14 guardas de proveedores y 3 de perfil local.
- [x] Preparar asistente y revisar código. El intento Resend quedó BLOQUEADO antes de contactar proveedores; Firebase no ejecutado. El usuario detuvo la continuación que requiere claves; no se repite el asistente.
- [x] Compilar APK debug aislado en un directorio nuevo y verificar assets/configuración: 65 archivos coincidentes, firma y JUnit plantilla comprobados.
- [ ] WebView del APK nuevo y capturas: NO EJECUTADO; fuera del cierre actual, conservar antecedentes y limitaciones.
- [x] Generar informe, matriz y propuesta académica con denominadores separados.
- [ ] Verificar privacidad/integridad, sellar y subir avances sin despliegue.
