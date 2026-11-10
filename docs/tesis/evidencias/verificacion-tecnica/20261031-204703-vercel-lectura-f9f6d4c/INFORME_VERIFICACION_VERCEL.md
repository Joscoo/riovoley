# Inspección de Vercel para preparar producción

Observación de solo lectura: 2026-10-31T20:47:09.056Z, UTC. Repositorio evaluado f9f6d4c2dea4e1df52d27331fed43843e45a6be9. CLI privada Vercel 65.9.0, Node v24.18.0, autenticación OAuth guardada fuera de Git. El plugin del chat conserva su otra conexión; el acceso correcto se comprobó mediante CLI con scope explícito. No se cambiaron permisos, secretos, configuración, despliegues ni registros institucionales.

## Resultados observados

| Verificación | Resultado | Evidencia |
|---|---|---|
| Proyecto/equipo/repositorio | Coinciden riovoley, joscoos-projects y Joscoo/riovoley | [Proyecto](proyecto.json) |
| Dominio | riovoley.com verificado y asociado al despliegue de producción | [Dominios](dominios.json), [despliegue](despliegue.json) |
| Despliegue activo | READY; main, commit e469db5608fb77071b6a9ee3db253c28dae734dd; creado 2026-10-28T20:49:50.217Z | [Despliegue](despliegue.json) |
| Candidato local | f9f6d4c2dea4e1df52d27331fed43843e45a6be9; 0 despliegues devueltos por la consulta de ese SHA | [Consulta del candidato](candidato.json) |
| Variables frontend requeridas | 4/4 nombres presentes para production; valores/validez no comprobados | [Presencia](variables-presencia.json) |
| HTTP público | 4/4 GET con HTTP200; sin JavaScript ni login | [HTTP](publico.json) |

READY es un estado de plataforma; no prueba pagos, asistencias, permisos o recompensas. Estos registros son metadatos y observaciones HTTP, no nuevos casos Jest/Playwright. No deben sumarse a las 249 instancias E2E locales de la fase anterior.

## Diferencias con el candidato

El sitio público sirve el SHA e469db5608fb77071b6a9ee3db253c28dae734dd; la rama auditada termina en f9f6d4c2dea4e1df52d27331fed43843e45a6be9. No se atribuyen los arreglos posteriores a ese deployment. La configuración del proyecto y del despliegue consultado indica Node22.x; el candidato fija engines.node=24.x y npm=11.x. La [documentación de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) establece que engines.node puede sustituir el ajuste del dashboard en el siguiente build. Confirmar Node/npm efectivos en el log de un build controlado antes de liberar; esta inspección no lanzó uno.

REACT_APP_APP_URL sí está configurada para production en Vercel; el impedimento previo se refería al archivo local .env.production. Presencia no acredita que su valor sea el dominio correcto. Los nombres de configuración corresponden al proyecto en el momento de la consulta, no prueban qué valores incorporó el deployment anterior. Se conservaron solo nombres, targets y tipos; no se usó env ls --json, que puede devolver valores legibles.

En las respuestas públicas se conservan las cabeceras observadas; los cambios preparados en vercel.json de la rama deben comprobarse después de una eventual publicación. No se aplicaron aquí. El preflight completo necesita revisar valores en un contexto privado y acreditar continuidad de PII; no basta con inventariar nombres.

## Pendientes para liberar

- Revisar y ensayar el SQL de producción, las RPC y ACL junto con las versiones Edge/cliente. Las diferencias de Supabase observadas en la auditoría anterior deben revalidarse; esta fase no consultó ni cambió SQL.
- Acreditar respaldo/restauración, Auth cloud, SMTP/push/scheduler y transición de versiones Android/Capgo.
- Completar el build remoto controlado y la aprobación del release con versiones y retorno concretos antes de publicar.
- Ejecutar posteriormente un smoke autorizado: HTTP200 y READY actuales no validan el funcionamiento completo.

## Reproducción y límites

Usar CLI65.9.0 en directorio privado e iniciar sesión con una cuenta autorizada. No copiar su configuración OAuth ni ejecutar comandos de despliegue. Cada endpoint GET, scope, duración y código de salida figura en [COMANDOS.json](COMANDOS.json); el helper guarda exclusivamente una selección de metadatos. Las respuestas brutas no se conservan porque el endpoint de proyecto puede incluir campos de entorno. La consulta de dominios se limita a 30 resultados y la del candidato a 20; se conserva su paginación. La lista aquí observada no tiene páginas de dominios adicionales.

El nuevo expediente complementa y conserva los once expedientes sellados anteriores. [Resumen](RESUMEN.json). [Integridad](INTEGRIDAD.json). [Manifiesto](MANIFIESTO_SHA256.json).
