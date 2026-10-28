# Corrección de las 17 instancias E2E fallidas

**Objetivo:** corregir causas comprobadas y repetir las 112 instancias en Supabase local, conservando los expedientes anteriores.

**Alcance autorizado:** pruebas y controles de presentación actuales; únicamente datos ficticios locales. Sin cambios de esquema, políticas, credenciales institucionales ni despliegues.

- [x] Reproducir fallos representativos antes de editar las tres suites.
- [x] Reutilizar helpers de acceso y navegación que preparan la guía inicial. Medir filas reales de asistencia con selectores estables y exigir datos presentes.
- [x] Añadir ordenación móvil de pagos, pues el diseño de tarjetas oculta los encabezados. Reutilizar la consulta y ciclo de ordenación existentes; probar el estado accesible antes de implementar y comprobar valores ordenados en E2E.
- [x] Actualizar alta de estudiante, selección de mensualidad y registro de asistencia al contrato actual de la interfaz. Comprobar persistencia tras recargar; no forzar importes automáticos ni enviar correo externo.
- [x] Ejecutar primero los casos afectados y después las 112 instancias, con cero reintentos. Ejecutar Jest y controles del entorno pertinentes.
- [x] Solicitar revisión independiente, atender incidencias y documentar resultados. El cierre de privacidad, cifras y hashes consta en INTEGRIDAD.json del expediente.

**Archivos:** las tres suites afectadas, `SortableHeader.js` y su prueba, `PagosManager.js`, atributos de observación de `AsistenciasManager.js`; utilidades locales y documentación de evidencias.

**Riesgos a revisar:** consultas asíncronas al ordenar; presencia de datos para evitar aserciones vacías; categorías/fechas válidas; diferencia entre confirmación visual y persistencia; contraseñas temporales en artefactos.
