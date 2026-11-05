# Preparación y operación de un release de RioVoley

Continuación Android del 4 de noviembre de 2026: el APK debug existente aprobó 13/13 verificaciones AndroidWebView con Auth/REST/PostgreSQL locales reales; una recompensa y un ledger de 8 XP permanecieron tras detener el emulador. El APK release existente también abrió la portada y aceptó el enlace nativo de recuperación después de conservar un fallo de guardas de rutas y un ANR de SystemUI. Se añadieron diez regresiones del parser, todas aprobadas. No hubo nuevo build, distribución o cambio institucional. La revisión ampliada encontró rutas policy por dummy0; no se certifica un aislamiento universal de red ni se probó una recuperación real de contraseña. [Informe nativo y límites](../tesis/evidencias/verificacion-tecnica/20261104-211815-android-webview-7e9a27d/INFORME_VERIFICACION_TECNICA.md). Quedan pendientes las condiciones de promoción SQL/Edge/clientes y los proveedores excluidos por el usuario.

Continuación del 4 de noviembre de 2026: la huella institucional sigue coincidiendo con el paquete propuesto, los cuatro SQL conservan sus hashes y los nueve bundles Cloud mantienen los hashes capturados, aunque cambiaron sus revisiones administrativas. Los tres análisis npm actuales terminaron sin avisos; las cuatro rutas públicas consultadas devolvieron HTML 200. La RPC diaria y las alertas institucionales siguen pendientes. Android no se ejecutó de nuevo: Docker estaba detenido y se registraron aproximadamente 1,6 GiB libres al comprobar las precondiciones. No se solicitaron credenciales ni se aplicaron cambios institucionales. [Informe de continuación](../tesis/evidencias/verificacion-tecnica/20261104-201230-continuacion-produccion-d9cdfb7/INFORME_VERIFICACION_TECNICA.md), [paquete identificado para revisión](../tesis/evidencias/verificacion-tecnica/20261104-201230-continuacion-produccion-d9cdfb7/PAQUETE_PARA_REVISION.md).

Cierre del alcance inicial de auditoría, 1 de noviembre de 2026 (registros UTC del 2 de noviembre): los tres documentos solicitados están entregados, con resultados ejecutados y bloqueos explícitos. Esto representa 3/3 entregables documentales, sin atribuir un porcentaje de funcionamiento o preparación de producción. El usuario detuvo las validaciones que requieren credenciales. La lectura actual confirma cuatro nombres frontend y seis personalizados Supabase, RLS en xp_ledger/login_rewards y ausencia de la RPC diaria; Vercel mantiene producción e469db5. Se compiló y verificó un APK debug nuevo de laboratorio, sin instalarlo ni distribuirlo. [Informe y límites del cierre](../tesis/evidencias/verificacion-tecnica/20261102-002437-proveedores-movil-7eee99c/INFORME_VERIFICACION_TECNICA.md). No se aplicaron SQL, Edge, permisos ni despliegues en esta fase; siguen pendientes la transición coordinada y las comprobaciones operativas indicadas en el informe.

Actualización del 1 de noviembre de 2026: respaldo SQL y bytes de Storage recuperados, custodia local separada fuera de Git, continuidad de los 117 campos cifrados presentes comprobada y cuatro etapas de avance/retorno SQL ensayadas en una copia institucional aislada, con 94 tablas y 27159 filas conservadas. CI hospedado satisfactorio sobre `ef9a05a`; APK release firmado con el keystore existente y verificado, sin instalar ni distribuir. Auth confirma ocho redirects, incluido `riovoley://reset-password`, añadido por el operador. [Expediente de cierre](../tesis/evidencias/verificacion-tecnica/20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md).

El release sigue cerrado: falta la RPC diaria del candidato en producción; los paquetes SQL/Edge y clientes no se han aplicado. `REPORTS_SCHEDULER_SECRET` ya se creó con autorización acotada, una sola escritura y lectura verificable; los otros digests permanecieron iguales. Siguen pendientes el emisor del scheduler, entregas de proveedores y recuperación de correo. El estado complementario de Android y la evidencia del secreto se conservan en [la fase siguiente](../tesis/evidencias/verificacion-tecnica/20261101-222301-scheduler-eec82da/INFORME_VERIFICACION_TECNICA.md). Continúan las alertas de Supabase y se necesita acordar el paquete y la ventana antes de autorizar cambios institucionales. Vault tiene cero secretos y cero referencias en las funciones revisadas: no se exige recuperar una clave raíz para datos Vault inexistentes. No se atribuye a la carga SQL una recuperación integral de Supabase gestionado. Las observaciones fechadas siguientes son antecedentes y deben contrastarse con estos expedientes.

Estado al preparar este documento, 2026-10-30: **despliegue bloqueado**. Este trabajo
añade documentación, validaciones locales y CI técnico; no acredita backup,
restauración, despliegue, cambios SQL, rotación de secretos ni aprobación institucional.

Leer [README](../../README.md), [inventario de variables](VARIABLES.md),
[seguridad validada solo en local](../../database/security/local/README.md) y
[guía de credenciales](../CREDENCIALES_RECUPERACION_2026-10-22.md).
La preparación complementaria de [Edge y permisos de reportes](EDGE.md) incluye candidato, fuentes de retorno y secuencia SQL ensayada. El [procedimiento de respaldo/restauración](RESPALDO_Y_RESTAURACION.md) registra ahora el respaldo lógico real y su ensayo local; cerrar sus límites y los demás requisitos antes de autorizar la ventana.
La evidencia técnica de preparación se conserva en
[el expediente de esta sesión](../tesis/evidencias/verificacion-tecnica/20261030-151554-preparacion-produccion-28e48d2).
No confundir los ensayos locales con una validación del despliegue gestionado.

## 1. Identificar el destino y cerrar el alcance

El responsable del release debe registrar estos datos en un expediente privado de
operación, con referencias públicas sin credenciales para su revisión:

| Dato requerido | Estado inicial / criterio para desbloquear |
| --- | --- |
| Commit y árbol de trabajo | Fijar SHA completo del candidato y lockfiles; los cambios locales sin commit requieren su propio inventario de hashes. |
| Proyecto frontend, cuenta y deployment actual | Acceso de lectura resuelto por CLI privada para joscoos-projects/riovoley. Proyecto prj_gnsNVKcXC8jvN0UcassXy4lZ0ZfN; producción observada en READY, main e469db5. El candidato f9f6d4c aún no está publicado. Ver [inspección del 31 de octubre](../tesis/evidencias/verificacion-tecnica/20261031-204703-vercel-lectura-f9f6d4c/INFORME_VERIFICACION_VERCEL.md). La autorización del acceso no es aprobación del release. |
| Supabase destino y configuración | Backend identificado por usuario/configuración: `mayvvlkvheagkojunzzb`. Confirmar catálogo actual de solo lectura por operador; un estado saludable no implica contratos compatibles. No ejecutar pruebas de login contra producción. |
| Edge desplegado | Inventariar funciones, revisiones, imports/configuración y verificación JWT efectiva; guardar referencias a revisiones anteriores. |
| SQL previsto | [Paquete propuesto de avance y retorno](../../database/security/production-proposal/README.md), preparado contra catálogos institucionales del 31 de octubre y ensayado en local. Cierre: 29/29 casos SQL y 6/6 contratos de herramientas, denominadores separados. No aplicado ni aprobado para ejecución institucional; respaldo, clientes, ventana y autorización siguen pendientes. |
| Clientes activos | Inventariar web, APK publicados, versiones mínimas, bundles Capgo y canales; demostrar que clientes anteriores no reanudarán operaciones incompatibles. |
| Operadores y ventana | Nombrar responsable de frontend, Edge/SQL, backup, verificación y decisión de retorno; definir ventana y comunicación operativa. |

La configuración local `supabase/config.toml` no representa por sí sola los ajustes
de Auth en Cloud. Revisar Site URL, redirects permitidos para web/Android, SMTP,
dominios del remitente, almacenamiento, scheduler y límites en el servicio real.
No usar `.env.e2e` para ensayo: en este entorno apunta a producción. Los únicos
E2E de mutaciones autorizados pertenecen al backend local descartable y sintético.

## 2. Preparar contratos y retirar clientes incompatibles

Este es un release coordinado **cliente web + Android/Capgo + Edge + SQL**.
No aplicar aisladamente el SQL local ni publicar un cliente que presuponga RPC o
políticas todavía inexistentes. Si no hay una transición compatible demostrada,
mantener la ventana cerrada hasta que los tres componentes estén verificados.

La lectura institucional de **catálogos**, realizada mediante MCP el 2026-10-30,
identificó diferencias concretas respecto al entorno local endurecido:

| Observación de producción | Implicación para el release |
| --- | --- |
| `public.claim_daily_login_reward()` no existe. | El cliente candidato invoca `rpc('claim_daily_login_reward')`. **No desplegar ese cliente antes de crear y verificar coordinadamente el contrato SQL de producción.** La ausencia es un bloqueo de compatibilidad real, aunque el build y las pruebas locales estén verdes. |
| `restore_payment` y `soft_delete_payment` conservan sobrecargas UUID y bigint; las cuatro son SECURITY DEFINER, sin `proconfig` y ejecutables por `anon` y `authenticated`. | El catálogo todavía difiere de la solución local SECURITY INVOKER/UUID. Revisar cuerpo, autorización interna, resolución de firmas y ACL antes de preparar el diff productivo. No asumir que el cambio local ya está aplicado. |
| `admin_insert_user` es SECURITY DEFINER, sin `proconfig` y ejecutable por `anon` y `authenticated`. | Revisar autorización interna y contexto efectivo; no revocar ni reemplazar por recuento o nombre sin analizar los contratos administrativos. |
| `gamification.xp_ledger` y `login_rewards` tienen RLS habilitado y una política cada una; `wallets` y `currency_ledger`, RLS habilitado y cuatro políticas cada una. | No afirmar que estas tablas carecen de RLS. Revisar los predicados y operaciones permitidas: el indicador habilitado y el número de políticas no acreditan su suficiencia. |

Estos son metadatos de solo lectura. No se ejecutaron las RPC para comprobarlas
contra producción, ni se demostró explotabilidad o ausencia de autorización
interna por el mero grant/SECURITY DEFINER. Actualizar la lectura antes del gate:
el catálogo puede cambiar después de esta fecha. La migración revisada deberá
contemplar las diferencias observadas sin ejecutar ni alterar la migración local.

| Contrato | Condición obligatoria de preparación y ensayo |
| --- | --- |
| Pagos UUID/bigint | Inventariar firmas y grants reales por esquema y tipos. El cambio local usa RPC UUID SECURITY INVOKER con personal activo y retira de ejecución web firmas bigint renombradas. Comparar llamadas y payloads de web/Android y Edge, resolver ambigüedades de PostgREST y ensayar autorización de roles activos/suspendidos. No convertir datos ni IDs por suposición. |
| Ingreso diario | El cliente nuevo llama `public.claim_daily_login_reward()` sin actor, fecha ni XP; el contrato SQL previsto deriva usuario y fecha de Ecuador, concede ocho XP e impide duplicados. Esa función está ausente en la lectura de producción, por lo que debe crearse mediante la migración productiva revisada y verificarse antes de promover el cliente. El cliente anterior escribe la recompensa directamente. Demostrar idempotencia y ausencia de escritura desde lecturas del panel. |
| Borrado de usuario | El cliente/Edge nuevos autorizan antes de borrar filas y Auth. Ensayar 401/403 sin escrituras, fallos intermedios y recuperación manual. Auth y PostgreSQL no forman una transacción distribuida. |
| RLS, vistas, triggers y funciones | Comparar definiciones, propietarios, SECURITY DEFINER/INVOKER, search_path, ACL, políticas y esquema expuesto. Mantener restricciones de propiedad y la sincronización administrativa legítima. |
| Identidad y gamificación | Revisar roles heredados, usuarios canónicos y duplicados de relación estudiante-usuario con consultas agregadas que no publiquen PII. Resolver excepciones mediante procedimiento propio revisado. |

Antes de SQL, retirar o bloquear clientes antiguos: frenar nuevas instalaciones y
OTA incompatibles, confirmar canales Capgo, web cacheada y sesiones abiertas,
revisión mínima nativa y comportamiento de dispositivos que vuelven de estar sin
conexión. Una actualización OTA solicitada no demuestra que todos los equipos la
instalaron. El canal Capgo actual tiene actualización automática y borrado de
bundles previos: conservar un bundle de retorno fuera del dispositivo y comprobar
compatibilidad de su versión nativa. No publicar OTA en esta preparación.

Si no existe una política comprobada para impedir que un cliente viejo opere,
este punto permanece **bloqueante**. Diseñar y ensayar la transición o la ventana
de mantenimiento con el responsable; no inventar un control de versión que el
backend actual no implementa. Preparar los artefactos nuevos y de retorno antes
de la ventana, sin habilitar sus flujos contra SQL incompatible.

El SQL en `database/security/local/20261029141114_riovoley_security_local.sql`
exige un marcador de alcance local y precondiciones. **No eliminar guardas, no
falsificar el marcador en producción y no copiar ese archivo a migraciones de
producción para ejecutarlo.** El aplicador local y `supabase db push` no son un
procedimiento de este runbook. Una migración de producción debe escribirse y
revisarse aparte sobre el estado real, con destino explícito, precondiciones y
retorno ensayado. Este documento no suministra un comando de aplicación.

## 3. Respaldos y ensayo de restauración por el operador

Antes de aprobar cualquier mutación, el responsable de datos debe:

1. Confirmar modalidad, cobertura, retención y último punto recuperable del backup
   administrado/PITR contratado. Registrar RPO, RTO, hora UTC y referencia del backup;
   no asumir que PITR está habilitado ni que un backup cubre Storage o proveedores.
2. Obtener por el canal aprobado un respaldo consistente de datos y catálogo:
   funciones con firmas/cuerpos, propietarios y ACL, políticas, triggers, vistas,
   grants y configuraciones que necesiten retorno. Guardarlo cifrado con acceso
   restringido y nunca dentro del repositorio ni de los artifacts del CI.
3. Custodiar por separado configuración Edge, revisiones y secretos en el gestor
   autorizado, configuración Auth, objetos Storage si corresponden, artefactos
   web/Android/Capgo y la clave PII original. Un dump SQL no reemplaza esos respaldos.
4. Restaurar en un destino aislado autorizado y demostrar los contratos afectados
   con identidades de ensayo. Documentar tiempo real, limitaciones y evidencia
   sin filas de atletas, tokens ni contraseñas. No usar producción como destino
   de pruebas ni enviar mensajes o push reales durante el ensayo.
5. Preparar reversión específica desde el catálogo original y probarla contra
   ese ensayo. Definir tratamiento de escrituras posteriores al corte y cómo
   conservarlas antes de restaurar. Un PITR puede retroceder datos de negocio.

**Copia lógica y ensayo SQL local ejecutados en la fase del 1 de noviembre; PITR y recuperación gestionada no acreditados.** La recuperación de bytes Storage en tmpfs no sustituye Storage API. Una casilla marcada, el preflight o una captura del estado saludable tampoco certifican esos servicios.

## 4. Verificación técnica previa

Ejecutar el CI [technical-readiness](../../.github/workflows/technical-readiness.yml)
en el SHA candidato y revisar resultados completos. Usa Node 24, instalación
desde lockfiles sin lifecycle scripts, suite React (línea base 419 pruebas),
pruebas Node explícitas de toolchain/preflight, auditoría de los tres árboles npm
y build CRA con entradas sintéticas de loopback. No despliega ni genera APK.

El fork de dependencia local bajo `vendor/` debe quedar identificado por nombre,
versión propia y origen local; los tests de toolchain verifican ese contrato.
`npm audit` consulta advisories del registro y **no acredita ausencia de fallos en
un fork privado**. Su revisión y pruebas de regresión son parte del expediente.
No atribuir una versión inventada a un parche publicado en npm.

El build usa CI estricto; resolver advertencias bloqueantes con cambios revisados.
El build sintético no prueba secretos, Auth, enlaces de recuperación, correos,
push, scheduler, rutas recargadas en hosting ni Capacitor real. El workflow nuevo
se ejecutó satisfactoriamente en GitHub sobre `ef9a05a`, run `41330927082`: 419 casos Jest, 35 contratos Edge, 32 guardas de recuperación, 10 contratos PII/APK y 76 casos de toolchain, con denominadores separados. El resultado se refiere a ese SHA; cualquier candidato posterior requiere su propia ejecución.

Ejecutar el [preflight](VARIABLES.md#preflight-sin-carga-automática-de-archivos) con
configuración suministrada por el operador. Conservar solamente nombres/estados.
Una salida `STRUCTURE: VALID` mantiene `AUTHORIZATION: BLOCKED`.
Revisar alertas del servicio una por una: search_path mutable, extensión pg_net,
SECURITY DEFINER ejecutable, protección de contraseña filtrada y actualización de
Postgres. Los recuentos observados no prueban explotabilidad; algunos helpers son
legítimos. Cualquier cambio de permisos, Auth, extensión o versión requiere diff,
ensayo y aprobación propios. No aplicar remedios automáticos de un advisor.

## 5. Gate final de aprobación explícita

El operador presenta un paquete concreto: SHA/hash de cada artefacto, destino real
confirmado, diff SQL de producción y retorno revisados, contratos ensayados,
evidencia de retirada de clientes viejos, salida del CI/preflight, backup/restauración,
responsables, ventana, criterios de fallo y plan para escrituras posteriores.
Si falta un elemento, **no iniciar el release**.

Obtener autorización explícita del titular para ese paquete y esa ventana **como
último paso de la preparación y antes de cualquier despliegue o mutación**.
Registrar quién, cuándo, alcance y referencia; no tratar una aprobación de trabajo
local, una variable de entorno, una aprobación de PR o CI verde como autorización
de producción. Esta aprobación sigue pendiente.

## 6. Secuencia operativa tras la aprobación

1. Reconfirmar SHA y destinos sin cambios desde el gate; abrir la ventana aprobada,
   detener nuevas escrituras y comprobar la retirada/bloqueo de clientes viejos.
   Si se permite alguna escritura, debe estar expresamente incluida en la
   transición compatible ensayada y en el respaldo posterior al corte.
2. Confirmar último backup y punto de retorno. Aplicar únicamente el cambio SQL
   de producción ya revisado con el mecanismo aprobado por el responsable.
   Verificar precondiciones y catálogo/ACL resultantes antes de continuar,
   incluida la existencia de `public.claim_daily_login_reward()` con firma y
   permisos esperados y la resolución inequívoca de pagos UUID/bigint. Si falta
   la RPC o sus contratos no están verificados, no promover web ni Android/OTA.
3. Instalar las revisiones Edge que usan el nuevo contrato y comprobar denegaciones
   sin efectos, auth del scheduler, tipos de RPC y conectividad de proveedores
   mediante el plan controlado aprobado. Mantener cerrado el acceso de usuarios.
4. Promover el artefacto web y la versión Android/Capgo compatibles; comprobar
   rutas directas/recarga SPA, login/recuperación con cuenta de ensayo autorizada,
   permisos por rol, pagos UUID, ingreso diario, borrado y registro push. No usar
   los scripts E2E locales ni credenciales de producción como smoke automático.
5. Reabrir gradualmente solo al superar los criterios pactados. Registrar versiones
   observadas, errores 4xx/5xx, denegaciones inesperadas, idempotencia y entregas
   de integraciones sin publicar datos personales. Cerrar la ventana con decisión
   del operador y conservar el paquete de retorno durante la observación acordada.

El orden SQL → Edge → cliente requiere mantenimiento efectivo. Si un servicio no
puede quedar aislado, definir primero una fase de expansión compatible con ambos
contratos y ensayarla; no sustituir por el orden anterior con tráfico activo.

## 7. Retorno coordinado

Activar el retorno ante destinos distintos al aprobado, cambios inesperados en
catálogo/roles, denegaciones legítimas, doble recompensa, errores de pago/tipos,
fallos de autorización/borrado o pérdida de acceso. El responsable fija umbrales
y tiempo máximo antes del gate; no improvisarlos durante el incidente.

1. Cerrar escrituras y congelar promociones/OTA; registrar revisiones y hora UTC,
   preservar evidencia sin PII y registrar escrituras desde el corte.
2. Aislar también clientes nuevos. **Nunca revertir SQL mientras el cliente nuevo
   o Edge nuevo siguen operando contra él.** No basta con volver el deployment web:
   hay bundles móviles/cachés y sesiones persistentes que pueden seguir activos.
3. Elegir el conjunto ensayado compatible de web + Edge + Android/OTA + SQL. Si un
   cliente nuevo no puede retirarse o bloquearse, mantener mantenimiento y usar
   una corrección compatible revisada; no degradar SQL por intuición.
4. Con los clientes aislados, restaurar revisiones Edge/cliente y ejecutar el
   retorno de SQL específico del catálogo respaldado en el orden ensayado, sin
   tráfico intermedio. Si se requiere restauración de datos/PITR, proteger primero
   las escrituras posteriores y exigir decisión del responsable sobre pérdida y
   reconciliación. Restaurar Auth/Storage según su cobertura independiente.
5. Verificar firmas UUID/bigint y ACL, RLS/vistas, roles activos/suspendidos, ingreso
   diario, pagos, PII con la clave original e integraciones. Reabrir únicamente
   cuando el conjunto completo sea compatible y el responsable lo autorice.

Ni este runbook ni el preflight ejecutan esos pasos. El acceso de lectura al equipo y deployment frontend quedó comprobado por CLI. El paquete SQL y su retorno se ensayaron también en una copia del respaldo institucional, sin alterar su contenido. Continúan pendientes la aplicación institucional, la revalidación gestionada de los contratos SQL/Edge, la transición coordinada de web/Edge y la aprobación del release. Android se usa solo para desarrollo/pruebas según el operador; no se inventaría como despliegue previo en dispositivos institucionales. Las diferencias de RPC y permisos no se corrigieron en producción mediante las lecturas y ensayos locales.

## 8. Configuración frontend preparada en esta rama

El dominio confirmado es https://riovoley.com. Se leyeron solo los cuatro valores frontend actuales en memoria, comprobando origen y rol de clave pública; la clave PII coincidió con la configuración local y permitió autenticar los 60 correos y 57 teléfonos cifrados presentes en la copia restaurada, junto con sus índices HMAC. Los campos sin ciphertext y los valores efectivos del bundle web actualmente servido no fueron evaluados. No se rotó la clave ni se publicaron valores o digests.

`vercel.json` prepara nosniff, Referrer-Policy y SAMEORIGIN, conserva las reglas de caché y ejecuta CRA con CI=true y sin sourcemaps públicos. Las cabeceras no se han publicado ni observado aún en producción. CSP y Permissions-Policy quedan pendientes del inventario/ensayo de proveedores y funciones del dispositivo. La rama de auditoría tiene git.deploymentEnabled=false para evitar despliegues automáticos al subir evidencia; no altera main ni publica un release. Ver [configuración oficial](https://vercel.com/docs/project-configuration/git-configuration).

El CI aparta dotenv únicamente del checkout temporal, instala/audita los árboles auxiliares con Node22 y usa Node24 para React y herramientas. La ejecución remota del commit 0d0d488 concluyó correctamente (run 41921731631); cada revisión posterior requiere su propio resultado, y un ensayo local de npm ci no lo sustituye.

Las acciones checkout/setup-node se fijaron a SHA de sus etiquetas v7 observadas mediante git ls-remote. Las referencias oficiales son https://github.com/actions/checkout y https://github.com/actions/setup-node. El análisis YAML comprueba estructura, runtimes y ausencia de comandos de publicación; no acredita una ejecución remota de GitHub Actions.

## 9. Inspección cloud del 31 de octubre

[Metadatos y GET públicos](../tesis/evidencias/verificacion-tecnica/20261031-204703-vercel-lectura-f9f6d4c/INFORME_VERIFICACION_VERCEL.md), obtenidos mediante Vercel CLI 65.9.0 con scope explícito, sin cambios institucionales. El sitio sirve el commit e469db5608fb77071b6a9ee3db253c28dae734dd, creado 2026-10-28T20:49:50.217Z, y los dominios están asociados al deployment observado. Las cuatro rutas públicas devolvieron HTTP200 sin ejecutar JavaScript ni login. No se ejecutó un build ni un smoke funcional remoto.

La configuración de proyecto/deployment indica Node22.x; el candidato fija engines.node=24.x. Según la [documentación de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), engines.node sustituye el ajuste del dashboard en nuevos builds. Mantener la versión explícita y comprobar Node/npm efectivos en el siguiente build controlado; la lectura del dashboard no demuestra el runtime de un build futuro.

La inspección no publica variables ni credenciales. Para reproducir requiere la CLI privada instalada y una autorización propia del operador; no copiar su archivo OAuth. El helper scripts/audit/production/inspect-vercel.cjs está limitado a GET de metadatos y del sitio público. No usar env ls --json para crear evidencias: puede devolver valores legibles.

## 10. Panel de diagnóstico OTA

La portada ordinaria oculta el panel técnico OTA por defecto. La bandera de compilación `REACT_APP_ENABLE_OTA_DIAGNOSTICS=true` lo habilita únicamente en portada y con soporte nativo; usarla solo en compilaciones diagnósticas descartables. Para producción omitirla o fijarla a `false`: el preflight rechaza su activación. No es una autorización por rol y no desactiva el motor OTA.

El [expediente de regresión](../tesis/evidencias/verificacion-tecnica/20261104-223055-ota-diagnostico-0d0d488/INFORME_VERIFICACION_TECNICA.md) identifica el cambio por hashes de fuentes y conserva sus ejecuciones. Los APK anteriores no contienen este cambio; antes de distribuir una nueva versión nativa se debe reconstruir y verificar ese artefacto. Esta preparación no firma, publica ni modifica configuración institucional.

La [reconstrucción debug del candidato c9a3079](../tesis/evidencias/verificacion-tecnica/20261104-225654-android-ota-c9a3079/INFORME_VERIFICACION_TECNICA.md) incorpora el cambio y aprobó 14 casos WebView con Auth/REST/PostgreSQL locales reales, incluida la ausencia del control OTA. Sus 65 archivos web empaquetados coinciden con el build; el emulador propio quedó detenido y el APK privado no fue distribuido. Dos respuestas HTTP401 de logros requieren instrumentación para atribuir su causa; cuatro sondas posteriores confirmaron lectura autenticada y rechazo anónimo. Esto no reemplaza un release firmado actualizado ni valida servicios institucionales, FCM, correo o instalación OTA.

El [diagnóstico instrumentado](../tesis/evidencias/verificacion-tecnica/20261105-151232-http401-726602a/INFORME_VERIFICACION_TECNICA.md) repitió 14/14 casos Android sin reproducir errores entre 298 respuestas. Un escenario adicional de Chromium retuvo respuestas reales de anuncios hasta completar logout y reprodujo consultas posteriores de logros como anon local, rechazadas con 401/42501. Se identificó una continuación de la carga de notificaciones sin cancelación; su corrección requiere una regresión separada. No se atribuye retrospectivamente esta fase a los dos errores históricos sin instrumentación, ni se propone cambiar permisos para permitir consultas anónimas.
