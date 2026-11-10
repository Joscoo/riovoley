# Manual técnico de RioVoley

El documento principal es [MANUAL_TECNICO_RIOVOLEY.md](MANUAL_TECNICO_RIOVOLEY.md). Describe los roles y funcionalidades identificados en el código, arquitectura, instalación, datos, integraciones, seguridad, pruebas, despliegue y mantenimiento.

## Archivos del paquete

| Archivo | Uso |
| --- | --- |
| `MANUAL_TECNICO_RIOVOLEY.md` | Fuente editable del manual |
| `manual-tecnico.css` | Colores reales del sistema, portada y estilos de impresión A4 |
| `recursos/logo-riovoley.png` | Copia exacta del logo principal del sistema |
| `recursos/logo-riovoley-nav.webp` | Copia exacta del logo usado en la navegación |

Los colores provienen de `tailwind.config.js`: dorado `#FFD700`, negro `#0A0A0A` y azul `#1E3A8A`. No es necesario cargar fuentes, imágenes o estilos desde Internet para presentar este documento.

## Preparar HTML y guardar posteriormente como PDF

La siguiente opción requiere **Pandoc instalado por separado** y un navegador con impresión a PDF. Pandoc no es una dependencia de la aplicación y no se modifica `package.json` para exportar el manual.

Desde la raíz del repositorio, en PowerShell:

```powershell
Set-Location -LiteralPath 'docs/manual-tecnico'
pandoc --from=gfm+raw_html --to=html5 --standalone --metadata lang=es-EC --metadata pagetitle="Manual técnico de RioVoley" --css=manual-tecnico.css --output=MANUAL_TECNICO_RIOVOLEY.html MANUAL_TECNICO_RIOVOLEY.md
Start-Process -FilePath '.\MANUAL_TECNICO_RIOVOLEY.html'
```

Mantener el HTML junto al CSS y la carpeta `recursos/`, ya que las rutas de imágenes y estilos son relativas. El formato HTML intermedio permite que el navegador aplique la portada y los colores antes de generar el PDF.

En el navegador:

1. Abrir **Imprimir** y seleccionar **Guardar como PDF**.
2. Seleccionar papel **A4**, orientación **vertical** y escala **100 %**.
3. Activar **Gráficos de fondo** para conservar el degradado y las cabeceras de tabla.
4. Desactivar los encabezados y pies automáticos del navegador para evitar la URL local y la fecha de impresión.
5. Comprobar la vista previa y guardar como `MANUAL_TECNICO_RIOVOLEY.pdf`.

La hoja CSS define márgenes A4 y pies con número de página mediante cajas `@page`. Su visualización depende del motor de impresión: si el conversor no admite esas cajas, configurarlos en ese conversor. No activar dos mecanismos de pie simultáneamente.

La vista previa Markdown de GitHub u otros editores puede ignorar HTML, estilos o saltos de página. Para conservar la presentación, el conversor debe permitir HTML y cargar **esta hoja CSS**. Exportar directamente a un motor LaTeX no aplica estos estilos web.

## Revisión antes de distribuir

- Confirmar que la portada utiliza el logo original y que ninguna imagen se deforma.
- Revisar cabeceras de tablas, saltos de página, títulos sin contenido separado y bloques de código.
- Comprobar los enlaces internos del índice en el PDF generado.
- Mantener la fecha de corte y la base del código evaluado; actualizar la edición si cambia el producto documentado.
- Conservar el repositorio o adaptar sus enlaces relativos si se publica el manual de forma independiente.

El manual no contiene credenciales ni presupone que las propuestas o integraciones de producción estén publicadas. Su alcance técnico y sus límites se explican en el propio documento.
