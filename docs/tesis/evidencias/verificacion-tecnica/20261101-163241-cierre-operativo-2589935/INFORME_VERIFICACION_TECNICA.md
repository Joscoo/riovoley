# Informe de verificación técnica: cierre operativo

## 1. Identificación y entorno

RIOVOLEY, https://github.com/Joscoo/riovoley, rama fix/seguridad-local-20261029. Inicio 2026-11-01T16:32:41.670Z; generación 2026-11-01T21:14:52.033Z, horas UTC (Ecuador UTC−5). Base inicial 2589935a27e8c4348184e698a1e2a4f406fe1073; candidato de CI y APK ef9a05ad20bba4f9303f547130c07336eeea61e7. Los cambios posteriores de herramientas/documentación se identifican en FUENTES_EVALUADAS.json; no se atribuye el CI de ese SHA a commits futuros. PR #2 en borrador, sin fusión ni despliegue.

Entorno local Windows, Node 24.18.0/npm 11.16.0, Python 3.11.9, CLI Supabase 2.122.0. Android utiliza JDK 21.0.12.1+1, SDK/build-tools 35.0.0 y wrapper Gradle 8.14.3; versiones/configuración comprobadas en [HERRAMIENTAS.json](HERRAMIENTAS.json). CI usa Ubuntu 24.04, Node 24.22.1/npm 11.19.1 para la aplicación y Node 22.23.4/npm 10.9.9 para los árboles auxiliares. En PowerShell se usa npm.cmd; npm.ps1 está bloqueado por la política local y no se cambió esa política.

El backend de .env.e2e es producción por confirmación del usuario. No se usaron esas cuentas ni se ejecutaron mutaciones institucionales. Separamos fixtures sintéticas, PostgreSQL local con datos del respaldo y lecturas administrativas reales. Los valores privados permanecieron en memoria o en artefactos cifrados ignorados por Git. El operador añadió el URI Android en Auth; no afirmar por ello que no existió ningún cambio de configuración durante toda la fase.

## 2. Metodología y comandos

[COMANDOS.json](COMANDOS.json) conserva argumentos, tiempos y códigos de salida. Los comandos principales son:

- node scripts/audit/production/run-operational-jest.cjs: CRA Jest no interactivo, JSON y cobertura json-summary; cuatro entradas sintéticas, dotenv deshabilitado en ese proceso.
- Workflow technical-readiness: npm ci --ignore-scripts, npm test -- --watchAll=false --runInBand, npm run test:edge-contracts, tres grupos Node explícitos, npm audit --audit-level=low en raíz/functions/riovoley y build CRA directo con CI=true. No se utiliza el script histórico que fija CI=false.
- node --test --test-reporter=tap tests/unit/supabase-config-summary.test.cjs: fixtures del parser, sin acceso remoto.
- node scripts/audit/production/inspect-edge-secret-names.cjs: projects list, secrets list y config pull --dry-run; resumen de nombres/booleanos, sin guardar valores/digests/config remoto.
- node scripts/audit/production/inspect-release-catalog.cjs: consulta fija BEGIN READ ONLY / SELECT / COMMIT por API de administración.
- node scripts/audit/production/rehearse-restored-sql.cjs: nueva base clonada dentro del contenedor sin red; requiere el respaldo restaurado/contexto privado de esta auditoría y un expediente nuevo.
- powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\production\android-release.ps1: contraseñas existentes con entrada oculta, build en copia privada, apksigner/keytool/aapt. No publica ni instala.

La reproducción de operaciones stateful requiere un expediente nuevo y revisar los requisitos privados; no apuntar el harness a un expediente sellado ni ejecutar los scripts locales sobre producción. Los asistentes de firma/respaldo no reciben contraseñas mediante argumentos o chat. No se ejecutó npm audit fix --force.

## 3. Resultados por herramienta

Los guiones indican que no existe un denominador de casos de prueba. Cuatro etapas SQL, un build y 117 campos cifrados son unidades distintas de los casos Jest/Node. Las repeticiones CI/local no se suman como casos únicos.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| J01 | Jest local con cobertura | 419 | 419 | 0 | 0 | APROBADO | [unitarias/jest-cierre.json](unitarias/jest-cierre.json) |
| J02 | Integración lógica en memoria, incluida en J01 | 5 | 5 | 0 | 0 | APROBADO con repositorios en memoria | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| C01 | Jest en GitHub; repetición de J01 | 419 | 419 | 0 | 0 | APROBADO | [integracion/github-ci-resumen.json](integracion/github-ci-resumen.json) |
| C02 | Contratos Edge en CI | 35 | 35 | 0 | 0 | APROBADO con transportes simulados | [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log) |
| C03 | Guardas de recuperación en CI | 32 | 32 | 0 | 0 | APROBADO | [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log) |
| C04 | PII y entorno APK en CI | 10 | 10 | 0 | 0 | APROBADO | [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log) |
| C05 | Toolchain/preflight en CI | 76 | 76 | 0 | 0 | APROBADO | [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log) |
| N01 | Parser de configuración Auth | 10 | 10 | 0 | 0 | APROBADO con fixtures sintéticas | [unitarias/config-origen-verde.stdout.log](unitarias/config-origen-verde.stdout.log) |
| I01 | Avance y retorno SQL en copia institucional | 4 | 4 | 0 | 0 | APROBADO: etapas, no casos funcionales | [integracion/sql-paquete-copia-institucional.json](integracion/sql-paquete-copia-institucional.json) |
| E01 | Playwright nuevo en esta fase | — | — | — | — | NO EJECUTADO; antecedentes separados | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| E02 | Flujos de escritura/login institucional | — | — | — | — | BLOQUEADO por restricción de producción | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| W01 | Build web estricto hospedado | — | — | — | — | APROBADO; un build | [integracion/github-ci-resumen.json](integracion/github-ci-resumen.json) |
| A01 | Capacitor y APK release firmado | — | — | — | — | APROBADO; una compilación | [android/release-firmado.json](android/release-firmado.json) |
| A02 | Ejecución de APK en dispositivo | — | — | — | — | NO EJECUTADO | [android/release-firmado.json](android/release-firmado.json) |
| S01 | Auth URL y redirects actuales | — | — | — | — | APROBADO dentro del alcance de configuración | [seguridad/auth-config-readback-1793567652173-5a5e9b.json](seguridad/auth-config-readback-1793567652173-5a5e9b.json) |
| S02 | Nombres de secretos personalizados | — | — | — | — | BLOQUEADO: presentes 5/6; falta scheduler | [seguridad/edge-secretos-presencia-real-1793567649724-d442ea.json](seguridad/edge-secretos-presencia-real-1793567649724-d442ea.json) |
| S03 | npm audit en tres árboles, sin sumar denominadores | — | — | — | — | APROBADO: cero avisos por árbol | [integracion/github-ci-resumen.json](integracion/github-ci-resumen.json) |
| S04 | Alertas del servicio gestionado | — | — | — | — | PENDIENTE de corrección autorizada | [seguridad/advisors-security.json](seguridad/advisors-security.json) |
| S05 | RLS y RPC diaria actuales | — | — | — | — | RLS observado; RPC diaria AUSENTE | [seguridad/catalogo-liberacion-actual.json](seguridad/catalogo-liberacion-actual.json) |

## 4. Unitarias, componentes y cobertura

Jest local: 88 suites y 419 casos, 419 aprobados, 0 fallidos y 0 omitidos; duración del comando 121.011 s. Cobertura instrumentada: líneas 42.96%, sentencias 41.58%, funciones 36.93%, ramas 33.72%. El porcentaje corresponde a los archivos incluidos por Jest, no a todos los requisitos o todos los servicios. [unitarias/cobertura-cierre/coverage-summary.json](unitarias/cobertura-cierre/coverage-summary.json).

| Módulo | Ejecutados | Aprobados | Fallidos | Omitidos |
| --- | ---: | ---: | ---: | ---: |
| student-dashboard | 32 | 32 | 0 | 0 |
| payments | 40 | 40 | 0 | 0 |
| gamification | 69 | 69 | 0 | 0 |
| shared | 57 | 57 | 0 | 0 |
| user-management | 32 | 32 | 0 | 0 |
| auth-session | 19 | 19 | 0 | 0 |
| reporting | 7 | 7 | 0 | 0 |
| trainer-management | 8 | 8 | 0 | 0 |
| attendance | 32 | 32 | 0 | 0 |
| account-admin | 12 | 12 | 0 | 0 |
| athletes | 14 | 14 | 0 | 0 |
| auth-profile | 5 | 5 | 0 | 0 |
| schedules | 4 | 4 | 0 | 0 |
| admin-dashboard | 9 | 9 | 0 | 0 |
| notifications | 14 | 14 | 0 | 0 |
| training-categories | 3 | 3 | 0 | 0 |
| user-provisioning | 20 | 20 | 0 | 0 |
| trainer-dashboard | 4 | 4 | 0 | 0 |
| physical-tests | 9 | 9 | 0 | 0 |
| communications | 11 | 11 | 0 | 0 |
| announcements | 7 | 7 | 0 | 0 |
| otros | 11 | 11 | 0 | 0 |

Los nombres de cada caso, archivo y estado están en [unitarias/casos-jest.json](unitarias/casos-jest.json); la selección por las ocho categorías y el detalle de casos en [unitarias/trazabilidad-categorias.json](unitarias/trazabilidad-categorias.json). XP, niveles, historial, rachas, logros, retos/campañas, ranking, identidad/avatar/títulos, monedas, compras/equipamiento e ingreso diario se comprueban mediante lógica y dependencias simuladas. Las llamadas desde asistencia, pagos y evaluaciones físicas no demuestran persistencia institucional. Las 5 integraciones lógicas en memoria forman parte del total Jest; no son una integración PostgreSQL.

## 5. Contratos, integración y CI

GitHub run 41330927082, job 124920677615, satisfactorio sobre el candidato ef9a05a y el merge temporal de PR con main e469db5; no se fusionó main. Resultado hospedado: 88 suites/419 casos Jest (13.079 s), 35 Edge, 32 guardas de recuperación, 10 PII/APK y 76 toolchain, todos aprobados por denominador. [integracion/github-ci-41330927082.jobs.json](integracion/github-ci-41330927082.jobs.json), [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log). Los contratos Edge usan clientes/transportes sintéticos; no acreditan entrega Resend/FCM. Las pruebas Node de guardas no acceden a la base institucional.

En PostgreSQL real local, se ejecutaron cuatro etapas sobre una nueva base clonada del respaldo institucional: avance principal, avance reportes, retorno reportes, retorno principal. Los contenidos de 94 tablas/27159 filas coincidieron en cada etapa y la huella final retornó a 15b9d9e869fb5113263c485714009878. La base origen restaurada no cambió. El contenedor tiene red deshabilitada y no publica puertos. El rol local es superusuario; la lectura actual confirma que postgres gestionado no lo es, aunque los agregados de acceso a roles propietarios y CREATE revisados no muestran faltantes. Por tanto no se atribuye equivalencia completa de privilegios o runtime al ensayo. No se invocaron RPC de negocio sobre las filas institucionales copiadas. [integracion/sql-paquete-copia-institucional.json](integracion/sql-paquete-copia-institucional.json), [seguridad/catalogo-liberacion-actual.json](seguridad/catalogo-liberacion-actual.json).

## 6. Playwright

No se repitió Playwright en esta fase. El expediente previo de preparación conserva 249 instancias finales aprobadas y sus denominadores: [antecedente sellado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md). Esa cifra no se incorpora como ejecución nueva. No se crearon reportes ficticios en e2e/. Login y escrituras institucionales permanecen bloqueados por la instrucción de tratar el backend configurado como producción. La lectura HTTPS actual de cuatro rutas públicas devuelve 200 con raíz SPA, pero no ejecuta JavaScript y no es Playwright: [seguridad/despliegue-publico.json](seguridad/despliegue-publico.json).

## 7. Compilación web

Build CRA estricto en CI satisfactorio, desde 17:21:03.255Z hasta el mensaje de compilación de 17:21:34.600Z (aproximadamente 31.35 s hasta ese mensaje; no confundir con duración completa del job). Generó build/static/js y build/static/css; el log lista main.ec43efd5.js, chunks y main.97b2e3dc.css con tamaños gzip. El runner no publicó un artifact descargable de build; se conserva el log, no una copia inventada de sus archivos. La configuración fue sintética, sin sourcemaps y sin conexión funcional demostrada al backend. Hubo avisos de dependencias obsoletas durante npm ci; CRA indicó Compiled successfully. El build web privado usado por Android también terminó con código cero y sus logs se conservan cifrados. [integracion/github-ci-41330927082.log](integracion/github-ci-41330927082.log), [android/release-compilar-web.meta.json](android/release-compilar-web.meta.json).

## 8. Android

Sincronización Capacitor, preparación de dependencias y Gradle :app:assembleRelease :app:testReleaseUnitTest --offline --no-daemon --no-configuration-cache satisfactorios. La tarea Gradle duró 140.092 s; todo el asistente 434.682 s. APK release privado: 28376554 bytes, SHA-256 3305c32983cba75a1361c5b6d741836051f98acfd0c7fefe8bd42dcb81cce16c. appId com.riovoley.app, debuggable=false, firma válida y certificado coincidente con el keystore existente, conservado sin cambios. [android/release-firmado.json](android/release-firmado.json), [android/release-gradle.meta.json](android/release-gradle.meta.json), [android/release-verificar-firma.meta.json](android/release-verificar-firma.meta.json).

Se usaron configuración frontend real y canal production en una copia privada; eso no constituye una instalación, publicación o prueba contra servicios reales. No se analizó un denominador de casos nativos de la tarea testReleaseUnitTest; no se informa una cantidad ficticia. No hubo ejecución de dispositivo en esta fase. Las contraseñas se introdujeron localmente; los logs nativos y la identidad del certificado están cifrados en el directorio privado del build. El APK no se añadió a Git.

## 9. Seguridad y configuración

Auth health/settings públicos respondieron 200 sin login. La lectura administrativa final confirmó Site URL oficial, URL web de recuperación y URI Android entre ocho redirects; no se envió correo de recuperación ni se probó su deep link en dispositivo. La primera lectura no pudo interpretar la vista estructurada de CLI 2.122; el parser se corrigió y conserva diez contratos finales aprobados, incluidos el rechazo de alcance remoto ausente y la no publicación de fixtures SMTP. Los archivos previos de readback=false son fallos de interpretación conservados y no el estado final. [seguridad/auth-config-readback-1793567652173-5a5e9b.json](seguridad/auth-config-readback-1793567652173-5a5e9b.json), [unitarias/config-origen-verde.stdout.log](unitarias/config-origen-verde.stdout.log).

Se comprobaron cuatro entradas frontend de Vercel en memoria, con origen oficial y rol público permitido. La clave PII coincidió con la local y autenticó los 60 correos y 57 teléfonos cifrados presentes, incluidos sus HMAC exactos y parciales. Los 85 campos email y 88 teléfono sin ciphertext quedaron fuera de ese control; no se afirma que todos los registros estén cifrados. Tampoco se inspeccionó la clave efectiva del bundle web servido. [seguridad/configuracion-frontend-verificada.json](seguridad/configuracion-frontend-verificada.json), [seguridad/pii-continuidad-real.json](seguridad/pii-continuidad-real.json).

RLS está habilitado, no forzado, en xp_ledger y login_rewards, con una política por tabla. Esto no valida todos los predicados o permisos. La RPC public.claim_daily_login_reward() sigue ausente en producción, lo que impide promover sin coordinación el cliente que la necesita. [seguridad/catalogo-liberacion-actual.json](seguridad/catalogo-liberacion-actual.json).

Secretos personalizados: presentes 5/6; falta REPORTS_SCHEDULER_SECRET. No se leen valores ni se cambia configuración. El inventario cron registra un job activo y cero coincidencias literales del endpoint/header de recordatorios; no identifica schedulers externos ni acredita su ausencia. Vault registra cero secretos y cero referencias de funciones revisadas, sin necesidad actual de descifrar datos Vault. [seguridad/edge-secretos-presencia-real-1793567649724-d442ea.json](seguridad/edge-secretos-presencia-real-1793567649724-d442ea.json), [seguridad/scheduler-inventario.json](seguridad/scheduler-inventario.json), [seguridad/vault-alcance.json](seguridad/vault-alcance.json).

npm audit no reportó avisos conocidos en cada uno de los tres árboles del CI. Su registro no analiza exhaustivamente adaptaciones locales ni prueba ausencia de vulnerabilidades. Supabase mantiene avisos: 19 search_path mutables, una extensión en public, 17 funciones SECURITY DEFINER ejecutables por anon, 19 por authenticated, protección de contraseñas filtradas desactivada y versión PostgreSQL con parches disponibles. No sumar estas categorías como vulnerabilidades independientes: pueden describir la misma función y no demuestran explotabilidad por sí solas. Rendimiento: 20 FK sin índice, una tabla sin PK, 15 índices sin uso y un índice duplicado; no se eliminaron índices por ese recuento. Las recomendaciones oficiales están enlazadas en [seguridad/advisors-security.json](seguridad/advisors-security.json) y [seguridad/advisors-performance.json](seguridad/advisors-performance.json). No es una auditoría de penetración completa.

La custodia local separada contiene paquetes de datos cifrados (45 entradas/5052389 bytes) y clave protegida (2 entradas/4207 bytes), con SHA coincidentes fuera del repositorio; la frase no se copió. No se acredita otro dispositivo/offsite. [seguridad/paquetes-custodia.json](seguridad/paquetes-custodia.json), [seguridad/custodia-copia-local.json](seguridad/custodia-copia-local.json).

## 10. Incidencias, pendientes e integridad

Se conservan los intentos SQL fallidos por la sintaxis SET del ejecutor para GUC de tres segmentos; se corrigió a set_config sin cambiar propuestas o aserciones. La revisión de firma detectó expansión dotenv de valores con dólares; la regresión RED→GREEN y el preload aislado corrigieron el entorno antes del build real. Los primeros formatos del parser Auth fallaron y se preservan sus registros. Son fallos intermedios de herramientas y no se suman a los resultados finales de Jest. Los conectores MCP de Supabase no pudieron completar la lectura final por autenticación/parámetro de conexión; la CLI autenticada realizó la consulta fija de solo lectura sin ese bloqueo. Se conservó la política PowerShell y se usó npm.cmd.

Pendientes: autorización específica para crear el secreto del scheduler, identificación/configuración de su emisor, validación controlada de correo/push y recuperación Auth, ejecución Android en dispositivo, corrección gestionada de alertas con alcance aprobado, transición coordinada y aprobación del paquete/ventana SQL→Edge→clientes. No se aplicaron propuestas SQL ni se publicaron funciones, web, OTA o APK. No se acredita recuperación integral de Supabase gestionado, PITR o cumplimiento de objetivos RPO/RTO no definidos. El trabajo técnico no produce mediciones USE, UES-SF, usabilidad o motivación.

[MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md), [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md), [RESULTADOS_AUTOMATIZADOS.json](RESULTADOS_AUTOMATIZADOS.json), [PRIVACIDAD.json](PRIVACIDAD.json), [INTEGRIDAD.json](INTEGRIDAD.json), [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). El documento original de tesis no se modificó.
