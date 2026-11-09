# Handlers Edge, cerca de red y corrección HTTP

Se ejecutaron los nueve index.ts originales en Deno local, con Auth/REST locales reales. El arnés sustituyó únicamente el arranque serve para reunir los handlers en un listener127.0.0.1:6163. No es el runtime desplegado de Supabase Cloud. Las lecturas permitidas obtienen respuestas reales; no se fabrican identidades, roles o respuestas de repositorio.

## Límites impuestos y comprobados

- cached-only exige dependencias en caché. Es una condición adicional a los permisos de red, porque Deno puede cargar importaciones estáticas fuera de los permisos de fetch ordinario.
- allow-net solo habilita127.0.0.1:55321/6163; deny-net rechaza explícitamente Resend/Google. No se concedieron permisos de ejecución, escritura o FFI.
- fetch instrumentado permite solo GET/HEAD a Auth/user y REST/users locales. Bloquea otras operaciones locales antes de realizar I/O; no sustituye sus respuestas por resultados simulados.
- Dos sondas usan nativeFetch, evitando la instrumentación, y verifican NotCapable de Deno para Resend/FCM. Un intento autorizado de correo también queda bloqueado y el handler devuelve503 EMAIL_PROVIDER_UNAVAILABLE.
- La configuración Resend es un marcador ficticio y el remitente/destinatario son de prueba. No se usaron credenciales de proveedor; Firebase y scheduler permanecieron sin configurar. Esto no verifica configuración o entrega real.

La [documentación de permisos Deno](https://docs.deno.com/runtime/fundamentals/security/) explica los permisos y su diferencia con la carga estática. Los resultados aquí proceden de las sondas y recibos del proceso, no solo de la documentación. [Registro final](integracion/casos-green-1794238392821-383d5a.json), [flags efectivos](integracion/edge-server-green-1794238389962.meta.json).

## Corrección de sync-mobile-device

Sin Bearer o con JWT inválido, requireUser lanzaba Error genérico y producía500 INTERNAL_ERROR. La fase RED conservó dos fallos, ambos con expectativa401 y respuesta500. Se adoptó AuthAdminError, usado ya por el proyecto, para responder401 AUTH_REQUIRED/AUTH_INVALID. La ruta autorizada, validación del cuerpo y escrituras válidas no se cambiaron. No se modificaron expectativas para aceptar500. [RED](integracion/casos-red.json).

Dos recorridos GREEN aprobaron57/57; la repetición final exige además los códigos AUTH_REQUIRED/AUTH_INVALID. Cada fase tiene su propia comparación de datos, porque el login de preparación puede actualizar las fixtures locales. [Índice exacto](integracion/indice-intentos.json).

## Alcance de las pruebas

Los 57 controles incluyen 51 respuestas HTTP de handlers y seis controles de entorno/efectos. Verifican OPTIONS, métodos rechazados, anonimato, token inválido, rol atleta y entradas vacías de administrador. No se invocó la ruta de generación programada autorizada ni persistencia válida de dispositivos. Una respuesta400 tras autenticar no valida la ejecución completa de un caso de negocio.

Se observaron 38 lecturas Auth/REST reales, cero intentos de escritura de handlers y un bloqueo deliberado de escritura del propio arnés. Coincidieron los digests de 47 tablas, 4598 filas sintéticas y 10 secuencias, desde después del login hasta terminar los handlers. El signOut local posterior revocó las sesiones de prueba de esta ejecución; no acredita revocación general de JWT ni inmovilidad de todas las tablas Auth.

## Candidato y límites pendientes

Se preparó una copia privada nueva de39 archivos:28 fuentes TypeScript del repositorio actual y11 configuraciones/lock generados previamente, comprobados contra sus hashes. Solo cambió sync-mobile-device/index.ts. Su comprobación de tipos pasó con lock congelado; no se compiló un bundle Cloud ni se desplegó. El candidato/retorno anteriores se preservaron. [Manifestación de fuentes](seguridad/candidato-fuentes-corregido.json), [procedencia del arnés](seguridad/procedencia-arnes-corregida.json).

La primera preparación del candidato abortó porque buscó deno.json generados dentro del repositorio. Se conservaron los archivos parciales y se corrigió el origen a la configuración privada anterior con verificación de hashes. [Incidencia](seguridad/incidencia-preparacion-candidato.json). Adem?s, el cierre detect? que la copia inicial incorporaba config.toml local en lugar del archivo m?nimo preparado para Cloud. Se conserv? esa copia, se cre? un candidato nuevo con la configuraci?n anterior verificada y se repiti? el typecheck ([incidencia](seguridad/incidencia-config-candidato.json)). La advertencia DEP0040 de punycode se conserva en stderr; no bloqueó las pruebas.

No se comprobaron entrega, dominio remitente, credenciales, cuotas, disponibilidad de proveedores, scheduler habilitado, runtime Cloud, S3 o mantenimiento global. La instrumentación impide escrituras y por tanto tampoco demuestra persistencia de los flujos positivos. Los [pendientes anteriores](../20261109-145120-auth-storage-local-b1bbef7/ALCANCE_SERVICIOS_LOCALES.md), respaldo vigente y nueva ventana/autorización no quedan cerrados por estos resultados.

