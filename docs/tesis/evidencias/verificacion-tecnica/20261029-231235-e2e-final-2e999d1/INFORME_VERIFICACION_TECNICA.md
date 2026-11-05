# Repetición final de la matriz E2E de RIOVOLEY

## Identificación, alcance y entorno

Commit base evaluado **2e999d1944e3a83f01dc6b5af9fbf2c73e91dc46**, rama fix/seguridad-local-20261029. Inicio UTC 2026-10-29T23:12:35.938Z; informe 2026-10-30T14:05:22.593Z. Se repite la matriz de navegadores sobre las fuentes de ese commit, después del arreglo Android y los parches de dependencias. No se modificaron src/ ni los lockfiles. Se corrigió la sincronización de una prueba de asistencias en tests/e2e/filters-sorting.tables.spec.js y se añadió --network-id riovoley-e2e-loopback al arranque local de funciones. Las huellas iniciales y finales identifican ambas diferencias respecto del commit base; el bundle del producto no cambió.

Entorno: Windows_NT 10.0.26300 x64, Node v24.18.0, npm 11.16.0, Playwright 1.59.1. [herramientas-entorno.json](herramientas-entorno.json). Se usaron Chromium y WebKit en siete perfiles: 390, 430, 480, 768, 1024, 1440 y 1920 px. Los cuatro límites de pagos usan 481, 600, 767 y 768 px dentro de Chromium. Son perfiles de navegador, no dispositivos físicos ni WebView Android.

Frontend en 127.0.0.1:6100; Supabase local descartable en 127.0.0.1:55321 y PostgreSQL en 127.0.0.1:55322. Se verificó identidad de Auth y auth.users mediante consultas de lectura antes de las pruebas. Las escrituras se limitaron a cuentas y datos sintéticos. No se utilizó .env.e2e institucional ni se modificó producción. [seguridad/backend-local-verificado.json](seguridad/backend-local-verificado.json).

## Metodología y comandos

Se abrió otro expediente y se compiló un nuevo bundle con buildWebEnv: REACT_APP_SUPABASE_URL, ANON_KEY y PII_ENCRYPTION_KEY locales; se bloquearon los valores REACT_APP institucionales antes de dotenv. Las cuentas se inyectan desde credentials.json privado. Dos workers, cero reintentos, service workers bloqueados y proxy cerrado a destinos externos. Traces y vídeo desactivados para evitar guardar tokens; se conservan HTML, JSON, registros y capturas guiadas o de fallo.

~~~powershell
node scripts/audit/closure/initialize-e2e-final.cjs
node scripts/e2e/local/build.cjs
# Servir funciones en otra terminal con entorno de proveedores vacío:
node scripts/e2e/local/functions.cjs
node scripts/audit/closure/browser-regression.cjs
# Después de la interrupción y de corregir la sincronización del test:
node scripts/e2e/local/run.cjs pending --label=paneles-corregidos --workers=2
node scripts/e2e/local/run.cjs mutations --label=mutaciones-reanudadas --workers=2
node scripts/e2e/local/run.cjs boundaries --label=limites-finales --workers=2
node scripts/e2e/local/run.cjs pending --label=paneles-verificados --workers=2
node scripts/audit/closure/verify-e2e-final-persistence.cjs
~~~

El orquestador inició public, pending y mutations; la sesión se interrumpió durante mutations y boundaries aún no había comenzado. Se conservaron los resultados completos de public y pending. Después se repitió pending con la espera de red; ese intento descubrió un uso incorrecto de toBeOK con Response del navegador. Se conservó también y se repitió el grupo completo usando Response.ok(). Se ejecutaron mutations y boundaries con etiquetas independientes. Cada .meta.json registra comando real, inicio, fin, duración, cwd y código de salida. La corrección sustituye una lectura inmediata del DOM por una espera de la petición y de los elementos acordes a sus datos; mantiene la comprobación del estado vacío y de ordenación. No se omitieron casos por falta de credenciales. [publicas-finales/ejecucion.meta.json](publicas-finales/ejecucion.meta.json), [paneles-verificados/ejecucion.meta.json](paneles-verificados/ejecucion.meta.json), [mutaciones-reanudadas/ejecucion.meta.json](mutaciones-reanudadas/ejecucion.meta.json), [limites-finales/ejecucion.meta.json](limites-finales/ejecucion.meta.json); [e2e/interrupcion.json](e2e/interrupcion.json).

## Resultados observados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| E02-A | Paneles: primer intento conservado | 105 | 104 | 1 | 0 | FALLIDO | [paneles-finales/resultados.json](paneles-finales/resultados.json), [paneles-finales/html/index.html](paneles-finales/html/index.html) |
| E02-B | Paneles: intento con error de aserción HTTP | 105 | 98 | 7 | 0 | FALLIDO | [paneles-corregidos/resultados.json](paneles-corregidos/resultados.json), [paneles-corregidos/html/index.html](paneles-corregidos/html/index.html) |
| E01 | Navegación pública, acceso anónimo y recuperación | 133 | 133 | 0 | 0 | APROBADO | [publicas-finales/resultados.json](publicas-finales/resultados.json), [publicas-finales/html/index.html](publicas-finales/html/index.html) |
| E02 | Paneles por rol, navegación, búsquedas, filtros y ordenación | 105 | 105 | 0 | 0 | APROBADO | [paneles-verificados/resultados.json](paneles-verificados/resultados.json), [paneles-verificados/html/index.html](paneles-verificados/html/index.html) |
| E03 | Alta de atleta, pago y asistencia con recarga | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-reanudadas/resultados.json](mutaciones-reanudadas/resultados.json), [mutaciones-reanudadas/html/index.html](mutaciones-reanudadas/html/index.html) |
| E04 | Límites adaptables de pagos | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json), [limites-finales/html/index.html](limites-finales/html/index.html) |
| G01 | Guardas del arnés, Node test | 8 | 8 | 0 | 0 | APROBADO | [unitarias/guardas-locales.stdout.log](unitarias/guardas-locales.stdout.log) |
| I01 | Consulta agregada PostgreSQL de solo lectura | — | — | — | — | APROBADO (control, sin denominador de casos) | [integracion/persistencia-postgresql.json](integracion/persistencia-postgresql.json), [integracion/persistencia-postgresql.meta.json](integracion/persistencia-postgresql.meta.json) |
| E03-A | Flujo de escritura inicial interrumpido | No determinable | — | — | — | BLOQUEADO por interrupción; se repitió como E03 | [e2e/interrupcion.json](e2e/interrupcion.json) |
| B01 | Compilación web nueva | — | — | — | — | APROBADO | [compilacion-web-build-1793315584461.meta.json](compilacion-web-build-1793315584461.meta.json) |

La matriz final selecciona **249 instancias únicas**, 249 aprobadas, 0 fallidas, 0 omitidas y 0 clasificadas como flaky por Playwright. Cero reintentos automáticos no significa que toda la auditoría aprobara al primer intento: se repitió manualmente dos veces el grupo de 105 paneles. Al contar las tres ejecuciones completas de ese grupo hay **459 ejecuciones de casos**, 451 aprobadas y 8 fallidas; no son casos únicos adicionales. El intento interrumpido de mutations carece de resultado final y se excluye de estas cifras. Los ocho casos Node corresponden al arnés y no se suman a Playwright. El inventario de la matriz final está en [e2e/casos-playwright.json](e2e/casos-playwright.json) y el fallo original en [e2e/fallos-primer-intento.json](e2e/fallos-primer-intento.json).

Duraciones de cada proceso Playwright: publicas-finales 110.252 s; paneles-verificados 380.530 s; mutaciones-reanudadas 75.771 s; limites-finales 22.954 s. La compilación duró 141.330 s, salida 0; su bundle se guardó en runtime privado y se activó solo después de compilar correctamente. Las advertencias y archivos de salida figuran en [compilacion-web-build-1793315584461.stdout.log](compilacion-web-build-1793315584461.stdout.log) y [compilacion-web-build-1793315584461.stderr.log](compilacion-web-build-1793315584461.stderr.log). Compilar no acredita todas las funcionalidades.

CRA emitió «Compiled successfully». stderr conserva una advertencia de obsolescencia DEP0176 sobre fs.F_OK; no se reportaron errores de compilación. El inventario de archivos efectivamente generados, tamaños y SHA-256 está en [compilacion-web/artefactos.json](compilacion-web/artefactos.json); el bundle completo, incluidos sus mapas, permanece en el runtime local privado.

## Mocks, integración real y límites

**28 instancias de auth.password-recovery.spec.js interceptan Auth/REST con respuestas simuladas**. Comprueban comportamiento de la interfaz y protocolo esperado; no prueban correo externo, cambios reales de contraseña ni persistencia PostgreSQL. Se identifican por separado en el inventario. Las otras pruebas usan el frontend público o el backend local real según su alcance; no se afirma que todas ellas escriban o consulten PostgreSQL.

Las 7 instancias de admin.happy-path-controlled.spec.js crean un atleta descartable, registran una mensualidad y una asistencia, exigen respuesta satisfactoria del POST y verifican ambos datos después de recargar. Auth/REST/PG son reales locales, sin mocks; los mismos casos cubren pagos y asistencia y no se duplican al sumar. Las contraseñas temporales quedan exclusivamente en runtime privado para su detección por el escaneo de privacidad. Se selecciona envío manual; no se contactan Resend, FCM ni destinatarios reales.

Como contraste independiente, una consulta agregada en una transacción PostgreSQL READ ONLY recuperó **7 atletas, 7 pagos de 35 y 7 asistencias** vinculados exclusivamente a las altas sintéticas creadas en la ventana temporal de ese grupo E2E. No devuelve identificadores ni datos personales. El control SQL no se suma a los casos Playwright; su comando, consulta, ventana, conteos y salida están en [integracion/persistencia-postgresql.json](integracion/persistencia-postgresql.json) y [integracion/persistencia-postgresql.meta.json](integracion/persistencia-postgresql.meta.json).

Las comprobaciones públicas de teclado, foco, landmarks y ausencia de overflow tienen alcance técnico acotado. No constituyen evaluación USE/UES-SF, usabilidad, motivación, experiencia del atleta ni certificación WCAG completa.

## Incidencias del entorno

El primer grupo de paneles obtuvo 104/105. El caso de filtros de asistencias en desktop-1920 decidió que no había datos mediante count() inmediatamente después de limpiar filtros. La instantánea DOM del fallo muestra días y asistencias cargados, mientras el test esperaba el mensaje de lista vacía. AsistenciasManager vuelve a cargar al cambiar queryState y sustituye temporalmente el contenedor por un spinner. El test ahora identifica la petición GET sin filtros de atleta/método y con el rango de fechas restaurado, exige respuesta HTTP satisfactoria y usa sus filas para esperar el estado visual correspondiente. Se conservan los controles de filtros, fechas y ordenación de tres estados. El grupo completo se repitió con otra etiqueta; su resultado figura separado del original. [e2e/fallos-primer-intento.json](e2e/fallos-primer-intento.json), [../../../../../tests/e2e/filters-sorting.tables.spec.js](../../../../../tests/e2e/filters-sorting.tables.spec.js).

La primera versión de la corrección añadió toBeOK() a una Response de navegador, pero ese matcher exige APIResponse. Produjo 7 fallos de la infraestructura de prueba y 98 aprobaciones en 105 instancias; no se atribuyen esos errores al producto. Se sustituyó por expect(resetResponse.ok()).toBe(true), manteniendo el requisito HTTP 2xx. El grupo se repitió completo como paneles-verificados. [paneles-corregidos/resultados.json](paneles-corregidos/resultados.json), [paneles-verificados/resultados.json](paneles-verificados/resultados.json).

Al reanudar la conversación Docker y los procesos Node anteriores estaban detenidos. Se arrancó Docker Desktop y únicamente el stack riovoley-e2e-local, sin volver a sembrar ni modificar esquemas. Se comprobó de nuevo la identidad del backend y se reanudó el flujo con otra etiqueta, conservando los artefactos incompletos y sin atribuirles aprobaciones. [e2e/interrupcion.json](e2e/interrupcion.json), [seguridad/reanudacion-local.json](seguridad/reanudacion-local.json).

El primer preflight utilizó send-credentials, que no es un handler del repositorio; se conserva como diagnóstico inicial, sin considerarlo prueba funcional. La consulta al handler correcto send-email devolvió después 503 por resolución de nombres. Docker confirmó que Edge Runtime estaba en supabase_network_riovoley-e2e-local y Kong en riovoley-e2e-loopback. Se unió únicamente ese contenedor descartable a la red de su proyecto y el preflight pasó a HTTP200. La ayuda de la CLI confirmó --network-id; el arnés lo fija ahora para futuras ejecuciones. No se modificaron esquemas, RLS, usuarios institucionales ni otros stacks. [seguridad/red-edge.stdout.log](seguridad/red-edge.stdout.log), [seguridad/red-kong.stdout.log](seguridad/red-kong.stdout.log), [seguridad/kong-error-diagnostico.stderr.log](seguridad/kong-error-diagnostico.stderr.log), [seguridad/edge-unir-red-local.meta.json](seguridad/edge-unir-red-local.meta.json), [seguridad/edge-disponible.json](seguridad/edge-disponible.json).

## Verificaciones no repetidas y pendientes

Después de completar los grupos se detuvo intencionalmente solo el contenedor Edge Runtime de este proyecto local, verificando antes su etiqueta. La CLI functions serve terminó con código 1 y señal de cierre 15 en su registro; corresponde al apagado solicitado del servidor y no se cuenta como prueba funcional fallida. [Cierre intencional](seguridad/cierre-edge.json), [metadatos del servidor](edge-functions/serve.meta.json), [registro de cierre](edge-functions/serve.stderr.log).

Jest del producto, Android nativo y auditoría npm no se repitieron aquí. El expediente anterior documenta 419 Jest, 13 verificaciones WebView, compilación Android e instrumentación; se citan como antecedentes y no se suman a esta ejecución: [../20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md](../20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md). Las ocho guardas Node nuevas corresponden únicamente al arnés.

Persisten las 31 alertas de dependencias npm del análisis anterior, la aplicación institucional coordinada de SQL/RLS/Edge/clientes, FCM/Resend reales, dispositivo físico y ampliación de clasificaciones y recuperación ante fallos parciales de borrado. No se acredita estado de RLS institucional por las pruebas locales.

## Evidencias y cierre

[RESUMEN_FINAL.json](RESUMEN_FINAL.json), [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md) y [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md). La integridad contrasta cifras finales y de los intentos previos, diferencias documentadas de fuentes, los ocho manifiestos anteriores y los archivos nuevos; el manifiesto SHA-256 excluye únicamente su propia huella. La revisión de privacidad incluye texto y ZIP base64 internos de los seis HTML. Los resultados y estados no se cambian durante la sanitización.

