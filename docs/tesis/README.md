# Evidencias técnicas de RIOVOLEY

La ejecución más reciente comprueba Android autenticado y parches de dependencias, sobre el commit base `317e5e3` y los cambios identificados en su inventario de fuentes:

- [Informe técnico complementario](evidencias/verificacion-tecnica/20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md).
- [Matriz actualizada de verificaciones](evidencias/verificacion-tecnica/20261029-221208-android-autenticado-317e5e3/MATRIZ_VERIFICACIONES_TESIS.md).
- [Texto académico propuesto](evidencias/verificacion-tecnica/20261029-221208-android-autenticado-317e5e3/RESULTADOS_PARA_TESIS_4_5.md).

Esta etapa registró **419 casos Jest aprobados en 88 suites**, seis casos de compatibilidad de dependencias, dos guardas ADB, una prueba JUnit y una instrumentada de plantilla, además de **13 verificaciones aprobadas dentro del WebView Android real** con Auth/REST/PostgreSQL local. Los denominadores se conservan separados. Se corrigió un cierre fatal de la app al salir sin registro push previo; el fallo y la repetición satisfactoria quedan documentados. Web y Android debug compilaron; lint terminó con cero errores y 27 advertencias. El APK autenticado permanece privado y no se distribuye. Los avisos npm de la raíz bajaron de 35 a 31; `functions` y el árbol auxiliar registraron cero.

## Antecedente de seguridad e integración local

El endurecimiento local autorizado del 29 de octubre de 2026, sobre el commit base `e469db5`, se conserva con sus resultados originales:

- [Informe de seguridad y regresión local](evidencias/verificacion-tecnica/20261029-135953-seguridad-local-e469db5/INFORME_VERIFICACION_TECNICA.md).
- [Matriz actualizada para la tesis](evidencias/verificacion-tecnica/20261029-135953-seguridad-local-e469db5/MATRIZ_VERIFICACIONES_TESIS.md).
- [Texto académico actualizado](evidencias/verificacion-tecnica/20261029-135953-seguridad-local-e469db5/RESULTADOS_PARA_TESIS_4_5.md).
- [Alcance y reproducción del SQL local](../../database/security/local/README.md).

La etapa registró 410 casos Jest en 87 suites, 34 comprobaciones de seguridad contra el backend local, 18 integraciones funcionales, 20 contratos Edge, 12 pruebas HTTP de handlers reales y 249 instancias Playwright aprobadas. Los denominadores corresponden a herramientas y ejecuciones distintas. Se retiró Genkit sin uso de `functions` y se aplicó un parche compatible: ese árbol llegó a cero avisos npm; la raíz conserva avisos pendientes. No se aplicaron cambios institucionales ni se realizó una publicación nueva.

## Expediente anterior y compilación Android

El cierre del 28 de octubre de 2026, sobre el commit base `c71f55e`, permanece disponible como antecedente:

- [Informe técnico de cierre](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/INFORME_VERIFICACION_TECNICA.md).
- [Matriz de trazabilidad](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md).
- [Texto propuesto para el apartado 4.5](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/RESULTADOS_PARA_TESIS_4_5.md).
- [Controles de integridad del cierre](evidencias/e2e-aislado/20261028-192557-cierre-c71f55e/INTEGRIDAD.json).
- [Metadatos del APK Android actualizado](evidencias/verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json).

La ejecución registró 404 casos Jest en 85 suites, 17 pruebas de integración real local y 249 instancias Playwright aprobadas. Los contratos incluidos en Jest no se suman de nuevo. También se compiló Android y se ejecutaron una prueba instrumentada y tres denegaciones de acceso dentro del WebView del emulador. Los informes detallan cobertura, advertencias, intentos fallidos y límites.

## Conservación y publicación

Los siete expedientes anteriores se conservan sin reescribir. Sus manifiestos registran las huellas de los archivos existentes al cerrar cada ejecución; las fechas y el commit base no se sustituyen por el commit que posteriormente incorpora las evidencias al repositorio. Los registros conservan sus bytes mediante `.gitattributes`.

Los APK de depuración permanecen exclusivamente en el equipo de auditoría. Se publican sus metadatos y SHA-256, pero los paquetes están excluidos de Git para respetar la restricción de no distribuirlos. Por tanto, una copia obtenida del repositorio no contiene esos dos archivos referenciados en los manifiestos Android; su comprobación requiere los APK locales originales. Las instantáneas de fuentes reflejan el árbol Windows de cada ejecución, incluidos archivos locales que no necesariamente forman parte de esta publicación, y pueden diferir de un checkout por la normalización de finales de línea de los archivos de código.

Las credenciales, claves, cuentas descartables y herramientas instaladas del entorno local permanecen en `.e2e-local/`, ignorado por Git. Los informes contienen resultados sanitizados; los datos utilizados por las pruebas con escritura son sintéticos y locales.

## Reproducción y pendientes

Consultar el [arnés E2E local](../../scripts/e2e/local/README.md), las [herramientas Android](../../scripts/audit/android/README.md) y los comandos de cada informe. Para nuevas ejecuciones se debe crear un expediente distinto; no sobrescribir los registros sellados.

El [endurecimiento de RLS/RPC](../../database/security/local/README.md) se validó únicamente en local; su aplicación institucional sigue pendiente de autorización y publicación coordinada. El borrador inicial se conserva como antecedente no ejecutable. Persisten 31 dependencias señaladas en la raíz, las limitaciones de proveedores externos, el dispositivo físico y una matriz nativa ampliada de negocio. La clasificación comprueba posiciones y orden en una categoría de fixture; no se extrapola a todas las categorías y métricas.
