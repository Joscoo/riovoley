# Integración local de barrera y paquete SQL

**Objetivo:** ensayar avance principal, complemento y sus retornos mientras permanece instalada la barrera SQL, sin mutaciones institucionales ni tareas de claves.

**Origen:** la restauración institucional está detenida; no se inicia ni descifra. Se clona exclusivamente la base marcada como laboratorio sintético en 127.0.0.1:55322. Su estado actual corresponde al principal y complemento aplicados. La copia nueva vuelve al catálogo inicial con los retornos originales; el origen no se modifica.

**Diseño:** inventariar todas las relaciones base no sistémicas de la copia, instalar disparadores propios y medir la huella del catálogo en los tres estados. Crear cuatro variantes locales separadas; conservar cuerpos y expectativas funcionales originales. Se sustituyen únicamente las huellas esperadas por las medidas con barrera, y se añade una guarda de destino local, comentario y digest completo de barrera/inventario. Este digest cubre función, ACL, esquema, disparadores habilitados e inventario de tablas, porque la huella original no cubre el esquema nuevo. Las variantes no son migraciones de producción.

## Pasos

1. Crear expediente y copia únicos; registrar el contenedor institucional detenido como limitación. Verificar marker/puerto/origen y ausencia de escritores concurrentes.
2. Medir contenido sintético y estados de secuencias antes/después, sin publicar filas. Ensayar las etapas originales de referencia e instalar/retirar la barrera en cada estado para medir las huellas; volver al inicio.
3. Demostrar que el principal original rechaza la deriva al instalar barrera. Generar las variantes sin eliminar la guarda original.
4. Aplicar las cuatro variantes en orden; después de cada etapa comprobar huella, digest de barrera, contenido/secuencias y rechazo específico de una RPC sintética de escritura sin filas.
5. Comprobar rechazo de orden incorrecto, función alterada, disparador deshabilitado e inventario de tabla nuevo. Revertir exclusivamente esos cambios propios y volver a comparar.
6. Retirar la barrera en la copia y comprobar catálogo inicial, contenido y secuencias. Comprobar origen sintético intacto.
7. Revisar de forma independiente, documentar cantidades reales, privacidad y límites, sellar y subir a la rama autorizada; comprobar CI.

**Fuera de alcance:** recuperación del respaldo institucional, servicios Auth/Storage HTTP, bytes Storage, efectos externos, DDL privilegiado concurrente, congelación global y despliegue institucional. El ensayo no acredita un respaldo vigente ni actualiza automáticamente los SQL originales.

## Continuidad del 9 de noviembre

Docker se inició de nuevo y se creó otra copia sintética. La preparación del 5 de noviembre se conserva por separado sin atribuirle nuevos resultados. La ventana propuesta del 7 de noviembre caducó y no se reprogramó ni activó.

Dos fallos del generador se conservaron y corrigieron: conversión de CRLF dentro de cuerpos SQL restaurados y delimitador de digest dependiente del formato físico de líneas. Las variantes finales conservan los bytes originales fuera de los literales de guarda ajustados; el digest usa un escape SQL explícito. Se mantienen las comprobaciones de catálogo y los resultados fallidos previos.
