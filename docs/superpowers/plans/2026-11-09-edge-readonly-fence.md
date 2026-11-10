# Handlers Edge con salida de red restringida

**Objetivo:** verificar rechazos de nueve handlers originales en Deno con Auth/REST locales reales, sin escribir datos de negocio o contactar proveedores.

1. Crear expediente y runtime privados nuevos. Reutilizar Deno/caché existentes; sustituir únicamente serve por un colector de handlers y listener127.0.0.1:6163.
2. Ejecutar con cached-only, sin permisos de ejecución/escritura, allow-net limitado a55321/6163 y deny-net explícito para Resend/Google. Las importaciones estáticas se limitan además a caché: los permisos de red de Deno no sustituyen cached-only.
3. Instrumentar fetch para permitir solo GET/HEAD a Auth/user y REST/users locales; rechazar escrituras antes de contactar al backend. Las respuestas permitidas serán reales. No devolver respuestas Auth o roles simuladas.
4. Usar cuentas admin/estudiante locales existentes, sin cambiar sus credenciales. Obtener tokens antes del snapshot de negocio para separar los efectos propios del login de las llamadas bajo prueba.
5. Ensayar OPTIONS/GET, anonimato, token inválido, rol atleta, entradas vacías de administrador y scheduler no configurado. Usar un marcador de configuración Resend explícitamente ficticio, no una clave real; la salida de red permanece bloqueada. No configurar Firebase ni secretos scheduler.
6. Comprobar directamente NotCapable de Deno para proveedores y guardia de escritura local. Comparar tablas/secuencias de negocio antes/después. No afirmar entrega, S3, Cloud o runtime Supabase gestionado.
7. Si aparece un error real de contrato HTTP, reproducirlo en RED y corregirlo con el patrón de errores tipados existente, sin modificar permisos ni datos institucionales. Revisar cualquier cambio fuente y actualizar el candidato Edge privado por separado, sin desplegarlo.
8. Revisión independiente, documentación de resultados reales, privacidad/integridad/sello, commit/push autorizado y CI.
