# Fe de erratas editorial de la evidencia Edge

Después del sello del expediente [20261109-152730-edge-fence-f0b89f4](evidencias/verificacion-tecnica/20261109-152730-edge-fence-f0b89f4/INFORME_VERIFICACION_TECNICA.md), la revisión independiente señaló siete tildes reemplazadas por `?` en un párrafo de [ALCANCE_EDGE_Y_CAMBIO.md](evidencias/verificacion-tecnica/20261109-152730-edge-fence-f0b89f4/ALCANCE_EDGE_Y_CAMBIO.md). Se conserva el archivo sellado y sus hashes. El fragmento corregido es:

> Además, el cierre detectó que la copia inicial incorporaba config.toml local en lugar del archivo mínimo preparado para Cloud. Se conservó esa copia, se creó un candidato nuevo con la configuración anterior verificada y se repitió el typecheck.

La incidencia y su corrección técnica ya constan en el [registro sellado](evidencias/verificacion-tecnica/20261109-152730-edge-fence-f0b89f4/seguridad/incidencia-config-candidato.json). Esta errata no cambia resultados ni denominadores. Se corrigió únicamente ese texto en el generador `scripts/audit/maintenance/edge-fence-report.cjs`, sin volver a ejecutarlo sobre el expediente sellado. Por ello, su hash actual difiere del hash de la versión que generó el expediente, conservado en `FUENTES_EVALUADAS.json`; los demás archivos fuente evaluados no cambian por esta errata.
