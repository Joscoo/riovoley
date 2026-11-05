# Copia privada de deepmerge

Base: deepmerge 4.3.1, licencia MIT conservada en `LICENSE`. Esta copia pertenece al repositorio y se identifica como `@riovoley/deepmerge-hardened@4.3.1-riovoley.1`; no es una versión publicada por el autor original.

El cambio rechaza `__proto__` tanto en las claves del destino como del origen y usa propiedades propias de datos para evitar setters heredados. `ORIGIN.json` conserva el paquete y la integridad originales, además del digest del archivo modificado. Los tests de consumidores comprueban la regresión y los contratos de clonación, arrays, símbolos, callbacks y `all`.

**npm audit no evalúa el código local.** Un resultado cero del registro no sustituye las comprobaciones de esta copia. Se debe mantener el test de procedencia y las regresiones en CI. No se pretende ofrecer sanitización general ni aislar callbacks/getters hostiles.
