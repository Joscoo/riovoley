# Paquete actual y decisiones pendientes

Estado: NO INICIAR transición institucional. Responsable confirmado: titular de la sesión. Ventana anterior: caducada, sin sustitución automática. Este expediente no constituye aprobación ni activa mantenimiento.

| Componente | Identificación comprobada | Condición pendiente |
|---|---|---|
| Web candidato | 022cc8d559eff2ba7d25c2227ea830bcf873cb30; [CI](integracion/ci-commit-base.json) | Construir/promover solo tras aprobación del paquete concreto; CI sintético no es aceptación institucional |
| Web observada | dpl_DCPpv18kuroRoaEpV49xhGfY1isB, e469db5608fb77071b6a9ee3db253c28dae734dd | Conservar como referencia; retorno no ejecutado |
| SQL | [Cuatro hashes](seguridad/artefactos-y-candidato.json), catálogo 15b9d9e869fb5113263c485714009878 | SQL original intacto; barrera SQL/Auth/Storage solo ensayada localmente, sin aislamiento gestionado activo |
| Edge candidato | 39 archivos, 28 TS actuales y 11 configuraciones previas; solo sync-mobile-device difiere del candidato anterior | [57 controles locales](../20261109-152730-edge-fence-f0b89f4/INFORME_VERIFICACION_TECNICA.md); bundle/despliegue Cloud y flujo positivo gestionado pendientes |
| Edge retorno | Nueve hashes de metadatos coinciden con los registrados en el paquete de retorno | No se descargaron nuevamente bundles ni se ejecutó retorno gestionado |
| Recuperación | Hash cifrado correcto; antigüedad 205.01 horas | Punto vigente al corte y recuperación SQL/Storage/configuración no acreditados |
| Android | Compilaciones y ensayos anteriores conservan sus hashes/versiones | Desarrollo/pruebas; sin distribución ni compilación nueva aquí |
| Correo/push/scheduler | Preflight HTTPS observado; proveedores no invocados | Entrega y operación programada sin validar; tareas con claves excluidas por el usuario |

La ausencia de autorización no es el único impedimento. Primero deben resolverse los requisitos técnicos de respaldo y control de escrituras/clientes; después corresponde presentar y aprobar una ventana concreta. No modificar marcadores para saltar estos requisitos. Las propuestas SQL de retorno restablecen catálogo/permisos y no recuperan datos creados tras el corte.
