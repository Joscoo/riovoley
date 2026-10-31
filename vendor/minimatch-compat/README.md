# Adaptación privada de la API de minimatch

La función exportada y las exportaciones nombradas delegan al paquete del registro
`minimatch@11.0.3`, instalado con el alias `@riovoley/minimatch-engine`.
No se copia ni modifica su motor. La adaptación añade la interfaz `String.match`
y el segmento `_glob` que glob 7 lee de los objetos Matcher actuales. Permite que glob 7, ESLint y
filelist conserven sus llamadas CommonJS. No se presenta como una versión publicada
de minimatch; npm audit analiza el motor del registro, pero no este archivo local.
La compatibilidad y la prueba acotada de amplificación se ejecutan en
`tests/integration/toolchain.patterns.test.cjs`. Ejecutar además Jest y los builds.

Referencia: https://github.com/advisories/GHSA-g3hv-75wg-m249.
