# Decisiones de esta etapa

Se admiten actualizaciones mayores transitivas de serialize-javascript (4/6 a 7.1.4) y Once (1 a 2.0.1), sin cambiar CRA ni código de aplicación. Sus interfaces CommonJS se verifican desde los consumidores instalados. Serialize exige Node >=20; Capacitor CLI instalado ya exige >=22 y el entorno usa Node 24.18.0. La versión instalada de Once 1 no acepta la opción AbortSignal: la reproducción documenta esa limitación y no demuestra que la app la ejerciera en producción. La llamada real de http-proxy-agent espera connect y no consume el valor devuelto.

No se rebaja deepmerge para esconder el aviso: npm y el aviso oficial no ofrecen versión corregida. No se sustituyen mayoristas SVGO, PostCSS o webpack-dev-server sin comprobar el contrato específico del consumidor.
