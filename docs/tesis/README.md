# Evidencias técnicas de RIOVOLEY

El expediente de cierre más reciente corresponde a la ejecución del 28 de octubre de 2026, sobre el commit base `c71f55e` y los cambios locales identificados en sus inventarios de fuentes:

- [Informe técnico de cierre](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/INFORME_VERIFICACION_TECNICA.md).
- [Matriz de trazabilidad](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md).
- [Texto propuesto para el apartado 4.5](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/RESULTADOS_PARA_TESIS_4_5.md).
- [Controles de integridad del cierre](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/INTEGRIDAD.json).
- [Metadatos del APK Android actualizado](evidencias/verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json).

La ejecución registró 404 casos Jest en 85 suites, 17 pruebas de integración real local y 249 instancias Playwright aprobadas. Los contratos incluidos en Jest no se suman de nuevo. También se compiló Android y se ejecutaron una prueba instrumentada y tres denegaciones de acceso dentro del WebView del emulador. Los informes detallan cobertura, advertencias, intentos fallidos y límites.

## Conservación y publicación

Los seis expedientes originales se conservan sin reescribir. Sus manifiestos registran las huellas de los archivos existentes al cerrar cada ejecución; las fechas y el commit base no se sustituyen por el commit que posteriormente incorpora las evidencias al repositorio. Los registros conservan sus bytes mediante `.gitattributes`.

Los APK de depuración permanecen exclusivamente en el equipo de auditoría. Se publican sus metadatos y SHA-256, pero los paquetes están excluidos de Git para respetar la restricción de no distribuirlos. Por tanto, una copia obtenida del repositorio no contiene esos dos archivos referenciados en los manifiestos Android; su comprobación requiere los APK locales originales. Las instantáneas de fuentes reflejan el árbol Windows de cada ejecución, incluidos archivos locales que no necesariamente forman parte de esta publicación, y pueden diferir de un checkout por la normalización de finales de línea de los archivos de código.

Las credenciales, claves, cuentas descartables y herramientas instaladas del entorno local permanecen en `.e2e-local/`, ignorado por Git. Los informes contienen resultados sanitizados; los datos utilizados por las pruebas con escritura son sintéticos y locales.

## Reproducción y pendientes

Consultar el [arnés E2E local](../../scripts/e2e/local/README.md), las [herramientas Android](../../scripts/audit/android/README.md) y los comandos de cada informe. Para nuevas ejecuciones se debe crear un expediente distinto; no sobrescribir los registros sellados.

El [endurecimiento de RLS/RPC](../../database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md) sigue pendiente de autorización y validación coordinada. El SQL de esa carpeta es un borrador parcial **no aplicado y no listo para ejecutar**. Incorporarlo a Git no aplica migraciones ni cambia permisos. También se conservan avisos de dependencias y las limitaciones de proveedores externos, clasificación por categoría y pruebas nativas completas.
