# Ensayo aislado de la copia institucional

Objetivo: verificar el recibo de la copia real obtenida por el usuario y comprobar su restauración SQL en un contenedor local nuevo, preservando los laboratorios y todos los expedientes anteriores.

Diseño: Docker local fijado al motor Windows existente; imagen PostgreSQL Supabase 17.11 ya instalada y fijada por digest; contenedor nuevo con network=none, sin puertos, log-driver=none y PGDATA temporal en memoria. Iniciar PostgreSQL explícitamente, sin el entrypoint gestionado ni servicios Auth, Edge, Storage, correo o push. Desactivar trabajos programados y workers antes de cargar datos. El dump descifrado y las salidas que puedan contener datos se mantienen fuera de reportes; no persistir un dump en claro.

La clave disponible en el agente local se usa con pinentry-mode=error, sin abrir ventanas ni pedir secretos por chat. Si expira, el paso queda bloqueado y se prepara entrada local oculta. El retorno de producción y las migraciones institucionales permanecen fuera del alcance.

- [x] Validar recibo, archivo y clave por SHA-256; registrar solo metadatos no sensibles.
- [x] Inspeccionar esquema y TOC privados, sin exportar filas a consola.
- [x] Probar guardas de destino y selección de compatibilidad.
- [x] Crear destino nuevo, demostrar aislamiento y disponibilidad de extensiones/roles.
- [x] Ejecutar restore con parada ante errores. Conservar fallos y usar otro destino vacío cuando se necesite una adaptación revisada.
- [x] Comparar catálogo y controles del archivo contra filas cargadas, sin publicar contenido personal. Distinguir adaptación GENERATED de equivalencia de valores derivados.
- [x] Documentar resultados y límites: SQL local no demuestra recuperación integral de Supabase, proveedores o clave raíz Vault.
- [x] Respaldar 43 objetos Storage con GET, cifrado y recuperación de bytes aislada; no confundir con restauración de Storage API gestionado.
- [x] Revisión independiente y cierre de pruebas: 32/32 casos Node; documentación, sellado y subida de avances conforme al expediente.

Interfaz: el inspector produce contexto privado, TOC y esquema; el ejecutor consume exclusivamente esa copia identificada y un contenedor nuevo. El reporte consume metadatos y recuentos, nunca filas o SQL privado. No reutilizar el arnés E2E sintético para las cuentas institucionales restauradas.

## Hallazgos y decisiones documentadas

Se conservaron siete intentos de restauración: ruta de herramienta faltante, interferencia de la guarda Docker con el argumento largo --host del cliente PostgreSQL, precarga pg_net ausente, atributos del propietario de event triggers insuficientes y diferencia de CRLF en calculate_age. El sexto intento cargó SQL con código nativo cero, pero la verificación de catálogo rechazó el resultado. La diferencia era exactamente dos CR introducidos al extraer SQL con el cliente Windows; se recuperaron los LF originales. Se ajustó la expectativa del test de extracción para reflejar ese formato fuente comprobado, sin cambiar la fórmula de producción ni omitir el control de huella. El séptimo intento coincidió con la huella 15b9d9e869fb5113263c485714009878.

La revisión independiente identificó dos controles importantes del restaurador: evitar texto nativo arbitrario en diagnósticos y rechazar catálogos distintos. Se verificaron con pruebas RED→GREEN y categorías permitidas. La revisión del nuevo componente Storage identificó el vínculo entre contexto, copia SQL restaurada y recibo del archivo; se añadieron dos regresiones RED→GREEN antes de la ejecución real. El conjunto final de cuatro archivos registró 32 casos aprobados, sin fallos u omisiones.

El bootstrap local conserva atributos necesarios del catálogo pero fuerza NOLOGIN en roles de servicio y mantiene postgres como operador superusuario. No restaura contraseñas o membresías globales y no representa la autorización efectiva de Supabase gestionado. Storage usa el inventario del snapshot SQL; todos sus 43 ETag MD5 comparables coincidieron con los bytes descargados, pero la lectura ocurre después del snapshot y no detecta incorporaciones posteriores automáticamente. Estos límites permanecen abiertos en el informe y el runbook.
