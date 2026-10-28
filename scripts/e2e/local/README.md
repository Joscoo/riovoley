# RIOVOLEY: E2E con Supabase local

Este arnés ejecuta la aplicación CRA contra PostgreSQL, Auth, RLS y Storage reales en Docker, con cuentas y registros ficticios. Conserva `.env`, `.env.e2e`, `supabase/config.toml` y el build institucional. No necesita credenciales de producción para funcionar.

## Inicio

Requisitos: Node/npm del proyecto, dependencias instaladas y Docker Desktop en modo Linux iniciado. Supabase CLI **2.122.0** se instala en `.e2e-local/tools/`, sin cambiar el lockfile principal.

Desde la raíz:

```powershell
npm.cmd run e2e:local:setup
npm.cmd run e2e:local:build
npm.cmd run e2e:local:smoke
```

`setup` crea/inicia exclusivamente el proyecto `riovoley-e2e-local`, restaura el baseline si no existe, carga el seed y verifica los tres roles y la idempotencia. Los puertos son 55321 (API), 55322 (PostgreSQL), 55324 (correo local), 55325/55326 (SMTP/POP3 local). Se fijan a 127.0.0.1. El frontend se sirve en 127.0.0.1:6100 solo mientras Playwright está ejecutándose; para inspeccionarlo manualmente: `node scripts/e2e/local/server.cjs`.

Se crean 10 cuentas ficticias: administrador, entrenador y ocho atletas. Las credenciales y la clave de cifrado local se generan en `.e2e-local/credentials.json`, ignorado por Git. No son las cuentas institucionales. El build local usa su propia clave PII y URL/key de Supabase; bloquea valores REACT_APP_* de los archivos `.env*` existentes. Cada build se guarda en un directorio nuevo del runtime y se activa únicamente al compilar correctamente.

## Ejecución y alcance

```powershell
node scripts/e2e/local/run.cjs desktop
npm.cmd run e2e:local:pending
node scripts/e2e/local/functions.cjs
# En otra terminal, mientras Functions está disponible:
npm.cmd run e2e:local:mutations
npm.cmd run e2e:local:guards
```

- `smoke`: 3 roles en escritorio.
- `desktop`: 15 casos pendientes sin el flujo de mutación, un perfil.
- `pending`: esos 15 casos en siete perfiles (105 instancias).
- `mutations`: el flujo de alta/pago/asistencia en siete perfiles (7 instancias), habilitando E2E_ENABLE_MUTATION_FLOW solo para ese proceso.
- `functions.cjs`: sirve las Edge Functions del repositorio en el stack local. No copia archivos .env ni configura proveedores externos; una operación de correo/push puede devolver un error real de configuración, que debe documentarse, no considerarse enviada.
- `guards`: pruebas unitarias del arnés; no se suman a los casos funcionales del producto.

La configuración `playwright.local.config.cjs` nunca carga `.env.e2e`: inyecta las cuentas locales validadas, crea su propio servidor estático y bloquea destinos externos mediante proxy cerrado. Usa un worker por defecto y no reintenta fallos; `--workers=3` permite ampliar concurrencia en las suites sin mutaciones explícitas. Las suites originales tienen algunas comprobaciones orientadas a escritorio; ejecutarlas en móvil puede revelar selectores no compatibles con tarjetas o controles adaptables. Conservar y explicar esos fallos antes de modificar una prueba.

## Estructura y datos

`database/e2e/local-baseline.sql` contiene solo DDL capturado mediante SELECT de catálogos el 28/10/2026: 47 tablas de aplicación, 44 vistas, 38 funciones y 139 políticas. No incluye filas institucionales, cron jobs, configuración de proveedores ni objetos de Storage. Los esquemas administrados Auth/Storage/Realtime los inicializa Supabase local. Se conserva la definición observada de funciones/políticas, incluso sus riesgos conocidos: este arnés no aplica correcciones de seguridad a producción.

Una columna de edad generada requiere una función IMMUTABLE al crear la tabla, aunque la definición observada de la función ya no sea IMMUTABLE. El baseline reproduce ese estado con una declaración temporal dentro de la misma transacción y restaura la definición capturada antes de COMMIT; no cambia la lógica de producción.

`seed.cjs` crea usuarios mediante Auth admin local, relaciones de perfiles/atletas, categorías, mensualidades, pagos, asistencias, pruebas físicas, comunicados y horarios sintéticos. Los INSERT de catálogos de gamificación se extraen de scripts revisados del repositorio, no de datos institucionales. `idempotency.cjs` compara conteos antes y después de repetir el seed.

`catalog-snapshot.sql` documenta la consulta de metadatos que permite regenerar el baseline si se dispone de acceso autorizado de lectura. La instantánea intermedia y las copias Docker privadas permanecen en `.e2e-local/`.

## Correcciones de las pruebas

El flujo de escritura actual usa Estudiantes → Crear → credenciales manuales → mensualidad → asistencia. Exige configuración local y confirmación del POST antes de recargar. No ejecutar seed/idempotencia simultáneamente con altas E2E: los conteos cambiarían durante la comprobación.

El seed incluye importes 35 y 32.50. La ordenación recorre todas las páginas y exige diversidad de importes. Para comprobar los límites de presentación (481/600/767/768 px), ejecutar `node scripts/e2e/local/run.cjs boundaries --workers=2`; sus cuatro casos se informan por separado de las 112 instancias originales.

Jest con cobertura: `node scripts/e2e/local/check-fixes.cjs coverage`. Las contraseñas temporales de altas UI se registran únicamente en `.e2e-local/observed-secrets.jsonl` para que la revisión de privacidad las detecte; no compartir ese runtime.

## Evidencias y cierre

Cada invocación recibe una subcarpeta única y conserva JSON, HTML, capturas y metadatos en `docs/tesis/evidencias/e2e-aislado/`. Una etiqueta explícita `--label=nombre` se rechaza si ya existe; los logs repetidos reciben un sufijo y no reemplazan los anteriores. La carpeta activa se indica en `.e2e-local/evidence-dir.txt` y la última ejecución por acción en `.e2e-local/last-run-*.json`. Las capturas/contextos pueden contener datos ficticios o credenciales de prueba: se deben revisar/redactar antes de compartir. Las trazas y vídeos están deshabilitados para evitar almacenar cabeceras de autenticación. No sobrescribir el expediente original de verificación técnica.

```powershell
npm.cmd run e2e:local:stop
```

El cierre se limita al project-id local y conserva sus volúmenes; no utiliza `--all` ni `--no-backup`. No ejecutar comandos de limpieza global de Docker. La preparación detectó otro proyecto local que usa 54321–54327 y se preservó.

La CLI inicial publica sus puertos con HostIp vacío. `loopback.cjs` verifica los bindings y, si es necesario, conserva los contenedores anteriores detenidos y recrea únicamente DB/gateway/correo de este proyecto con HostIp=127.0.0.1, usando los mismos volúmenes. Los archivos del gateway se copian por TAR directo para conservar propietarios y modos en Windows. No modifica Docker global ni reglas del firewall.

El arnés fija explícitamente el motor Docker Desktop Linux local mediante named pipe de Windows. Elimina DOCKER_CONTEXT, DOCKER_TLS_VERIFY y DOCKER_CERT_PATH heredados e ignora DOCKER_HOST remoto; tanto Docker CLI como Supabase CLI y las llamadas API usan ese mismo motor. `functions.cjs` genera en cada invocación un archivo Edge vacío exclusivo, sin confiar en un edge.env previo.
