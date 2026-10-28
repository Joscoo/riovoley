# Cierre de fallos y verificaciones pendientes de RIOVOLEY

**Objetivo:** corregir el acceso anónimo pendiente, ampliar integración real local y consolidar la evidencia sin alterar producción ni expedientes anteriores.

**Arquitectura:** conservar CRA, módulos feature y repositorios Supabase existentes. Usar backend descartable local y copias Android; los cambios de comportamiento requieren regresión observada antes de implementar.

- [ ] Abrir expediente nuevo y registrar estado/hash de fuentes actuales.
- [ ] Reproducir con Jest la carga infinita de StudentPanel anónimo y probar permisos/ausencia de consultas. Aplicar corrección mínima y verificar siete perfiles Playwright.
- [ ] Probar persistencia de XP, wallet, tienda y equipamiento mediante repositorios/servicios reales sobre Supabase local, sin escribir datos institucionales. Ampliar a identidad, retos, logros y clasificaciones según contratos disponibles.
- [ ] Comprobar entrega de notificaciones únicamente en sumideros locales o servicios aislados disponibles; diferenciar proveedores bloqueados.
- [ ] Revisar disponibilidad de emulador y ejecutar Android si es viable sin reiniciar/cambiar el sistema global. Corregir únicamente expectativas de plantilla justificadas por applicationId y ejecutar antes/después cuando sea posible.
- [ ] Revisar hallazgos de seguridad y dependencias: preparar correcciones revisables dentro del alcance local, sin aplicar políticas/esquema/permisos remotos ni actualizaciones forzadas.
- [ ] Ejecutar regresión adecuada, actualizar evidencia Android para fuentes cambiadas y consolidar informe, matriz y texto 4.5 con denominadores independientes, privacidad y hashes.
- [ ] Solicitar revisión independiente y documentar cualquier impedimento externo sin declararlo aprobado.

**Restricciones:** no push/deploy/publicación, no secretos en evidencias, no eliminación de cambios locales, no escrituras institucionales. Una falta de entorno se documenta y no se convierte en un éxito simulado. Las advertencias y hallazgos de seguridad no se eliminan solo para mejorar cifras.
