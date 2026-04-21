# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "Logo Riovoley" [ref=e4]:
      - /url: /
      - img "Logo Riovoley" [ref=e5]
    - button "Abrir menú" [ref=e7] [cursor=pointer]:
      - img [ref=e8]
  - list:
    - listitem:
      - link "Inicio":
        - /url: /
    - listitem:
      - link "Sobre Nosotros":
        - /url: /sobre
    - listitem:
      - link "Horarios":
        - /url: /horarios
    - listitem:
      - link "Iniciar Sesión":
        - /url: /login
  - generic [ref=e10]:
    - generic [ref=e12]:
      - heading "Horarios de Entrenamientos" [level=1] [ref=e13]
      - paragraph [ref=e14]: Consulta nuestros horarios actualizados
    - paragraph [ref=e17]: Cargando horarios...
```