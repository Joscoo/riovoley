# Dependencias locales revisadas

`deepmerge/` es una copia privada de la implementación CommonJS de deepmerge 4.3.1, con atribución MIT y un cambio defensivo mínimo. No representa una publicación corregida del mantenedor original. Consultar `deepmerge/ORIGIN.json` para procedencia, integridad del paquete original y huellas.

La copia rechaza claves `__proto__` en ambos lados de la combinación y escribe propiedades propias sin invocar setters heredados. Conserva arrays, símbolos, `all`, callbacks y opciones de clonación. No es un sanitizador general de datos ni una frontera para callbacks o getters no confiables.

El código local no tiene advisories propios en el registro npm. Por eso un resultado cero de `npm audit` se refiere al árbol consultado en el registro y **no audita esta copia local**. Sus pruebas de regresión y de consumidores son un control obligatorio separado en CI; no se debe omitirlo ni cambiar el nombre o la versión para esconder una implementación vulnerable.

`minimatch-compat/` es una adaptación privada de las API CommonJS callable/nombrada y de segmentos Matcher para los consumidores heredados. Delega los patrones al motor sin modificar `minimatch@11.0.3` del registro, instalado con un alias. npm audit sí consulta los avisos del motor; no analiza el pequeño adaptador local. La configuración `.npmrc` empaqueta ambas dependencias locales en lugar de enlazarlas. La instalación limpia y sus contratos son obligatorios para comprobar que el lockfile funciona fuera de la máquina del autor.
