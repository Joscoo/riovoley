# Gamification Identity Visual Expansion Design

Fecha: 2026-06-11
Estado: proposed
Scope: identidad visual competitiva, modelos de avatar, cosméticos con cambio visible real, logros bloqueados y secretos con pista

## Objetivo

Hacer que la identidad visual del estudiante sea una parte fuerte y visible de la experiencia competitiva. La identidad debe sentirse consistente entre perfil, panel del estudiante y leaderboards, y debe reforzar propiedad, logro, curiosidad e influencia social sin depender de assets diseñados a mano.

## Resultado esperado

- La imagen principal del estudiante puede ser:
  - avatar generado
  - foto personal subida
- El avatar deja de ser solo `style` y pasa a ser `style + model`.
- Cada cosmético debe cambiar algo visible.
- Los leaderboards deben renderizar la misma identidad visual compuesta que el perfil.
- Los modelos bloqueados deben verse como aspiración.
- Los logros bloqueados y secretos deben coexistir con pistas claras pero sin romper la sorpresa.

## Problema actual

- Los estilos de avatar existen, pero no exponen modelos claros como `Aventurero 1`, `Aventurero 2`.
- Los cosméticos actuales no siempre se perciben como cambios reales o suficientemente distintos.
- La foto de perfil y el avatar no están integrados como una sola noción de imagen principal competitiva.
- Los leaderboards no aprovechan todo el peso visual posible de la identidad del estudiante.
- La capa de logros necesita más claridad entre bloqueados visibles y secretos con pista.

## Decisiones validadas

- Los modelos del avatar serán un catálogo fijo por estilo.
- Habrá mezcla de modelos base y modelos desbloqueables.
- Los cambios internos del avatar se aplicarán automáticamente por slot cosmético, no con subconfiguración extra.
- Los modelos bloqueados se mostrarán también en la UI.
- Habrá una gran expansión de variedad visual antes de sofisticar más la economía.
- Los cosméticos se obtendrán con una mezcla de compra, logros y prestigio competitivo.
- Los logros secretos mostrarán una pista general.

## Diseño funcional

### 1. Imagen principal de perfil

La identidad del estudiante tendrá una sola imagen principal visible.

- `profile_image_mode = avatar`
  - usa el avatar generado como imagen base
- `profile_image_mode = photo`
  - usa la foto subida como imagen base

En ambos casos, el retrato final seguirá pasando por el mismo renderer visual:

- borde de marco
- fondo
- badge
- efecto
- título y apodo fuera del retrato cuando aplique

La foto no se alterará internamente. El avatar sí podrá variar internamente.

### 2. Separación entre estilo y modelo

Se separa la identidad del avatar en:

- `avatar_style`
- `avatar_model_slug`

Ejemplo:

- estilo `adventurer-neutral`
- modelos:
  - `adventurer-01`
  - `adventurer-02`
  - `adventurer-03`

Cada modelo tendrá:

- `slug`
- `style`
- `name`
- `description`
- `unlock_type`
- `unlock_hint`
- `is_base`
- `visual_params`

`visual_params` representa la configuración fija del modelo dentro del estilo. No dependerá de variaciones aleatorias.

### 3. Modelos disponibles y bloqueados

La UI debe mostrar:

- modelos disponibles
- modelos bloqueados

Cada modelo bloqueado debe enseñar:

- nombre
- preview
- rareza o prestigio cuando aplique
- pista o requisito resumido

Ejemplos:

- `Desbloquea al llegar al nivel 4`
- `Se obtiene al entrar al top 3 de salto`
- `Relacionado con constancia mensual`

Esto sirve como aspiración visible y cubre mejor curiosidad y escasez.

### 4. Reglas visuales de cosméticos

Todos los cosméticos deben implicar un cambio visible.

#### Frame

- Siempre modifica el borde del retrato.
- Debe leerse explícitamente como el marco de la foto/avatar.

#### Background

- Siempre modifica el fondo del retrato.
- Puede también influir en paleta o atmósfera del avatar cuando el modo sea `avatar`.

#### Badge

- Siempre añade una insignia clara y legible.
- Debe verse bien en tamaños pequeños y en leaderboard.

#### Effect

- Siempre añade una señal visual alrededor del retrato.
- No debe tapar la imagen base.

### 5. Cambios internos sobre avatar

Cuando la imagen principal sea `avatar`, algunos cosméticos también alterarán parámetros internos del avatar de forma automática.

Ejemplos de parámetros:

- acento cromático
- mood del retrato
- accesorio interno ligero
- tratamiento de fondo interno
- rasgo decorativo compatible con el estilo

Cuando la imagen principal sea `photo`, esos mismos cosméticos solo actuarán sobre la envoltura exterior.

### 6. Ampliación rápida del catálogo

Se prioriza variedad visual rápida.

Primera expansión objetivo:

- marcos:
  - bronce
  - plata
  - oro
  - cian
  - neón
  - fuego
  - élite
  - energía
- fondos:
  - cancha
  - dorado
  - tormenta
  - noche
  - océano
  - carbón
  - velocidad
  - minimal
- badges:
  - fuerza
  - salto
  - constancia
  - asistencia
  - top 3
  - top 1
  - mensualidad al día
  - récord
- effects:
  - aura oro
  - aura cian
  - pulso
  - chispa
  - rayo
  - resplandor
- modelos:
  - mínimo 3 por estilo base actual

## Logros bloqueados y secretos

### Logros bloqueados

Los logros bloqueados deben mostrarse con:

- nombre
- rareza
- condición resumida
- progreso cuando aplique

### Logros secretos

Los logros secretos no deben ser invisibles. Deben existir como tarjetas misteriosas con:

- nombre genérico o estado misterioso
- rareza
- pista general
- sin condición exacta

Ejemplos de pista:

- `Relacionado con tu constancia`
- `Tiene que ver con rankings`
- `Se descubre al romper una barrera personal`
- `Solo algunos lo consiguen durante su primer mes`

## Arquitectura propuesta

### Domain

#### `avatarCatalog.js`

Debe pasar de una lista simple de estilos a un catálogo estructurado:

- estilos
- modelos por estilo
- disponibilidad base o bloqueada
- metadatos de desbloqueo
- parámetros visuales fijos

#### `buildAvatarUrl.js`

Debe construirse con:

- `style`
- `model`
- `visual_params` del modelo
- efectos cosméticos compatibles

Ya no debe depender solo de `seed + style + backgroundColor`.

#### `identityPortrait` rules

Debe mantener un renderer unificado para:

- avatar
- foto
- marco
- fondo
- badge
- effect

### Application

#### Use cases a ampliar

- `loadStudentGamification`
  - debe devolver modelos disponibles y bloqueados
  - debe devolver logros secretos con pista
- `updateStudentIdentity`
  - debe aceptar `avatar_model_slug`
- `equipCosmeticItem`
  - debe reflejar impacto visual real en preview y payload

### Infrastructure

#### `student_identity`

Agregar:

- `avatar_model_slug`

#### `cosmetic_items_catalog.metadata`

Expandir para soportar:

- `frameVariant`
- `backgroundVariant`
- `badgeVariant`
- `effectVariant`
- `avatarAccent`
- `avatarAccessory`
- `avatarMood`
- `previewHint`

No se requiere una tabla nueva para modelos si el catálogo de modelos permanece en código durante esta fase. Si luego se quiere administración dinámica, podrá migrarse a persistencia.

### Presentation

#### `StudentGamificationPanel`

Debe incluir:

- selector de estilo
- selector de modelo por estilo
- modelos bloqueados visibles
- preview unificado
- mejor explicación del efecto de cada cosmético
- separación clara entre cosméticos equipados, disponibles y bloqueados

#### `IdentityPortrait`

Debe mejorar:

- legibilidad del badge
- claridad del marco
- efecto visual del slot `effect`
- consistencia entre tamaños

#### Leaderboards

Deben consumir exactamente el mismo retrato final y mostrar:

- imagen principal
- marco
- fondo
- badge
- effect
- título
- apodo

## Fases recomendadas

### Fase 1

- separar `style` y `model`
- mostrar modelos disponibles y bloqueados
- persistir `avatar_model_slug`

### Fase 2

- ampliar el catálogo cosmético
- asegurar que todos generen cambio visible
- mejorar preview y desequipado

### Fase 3

- hacer que cosméticos alteren también el avatar interno cuando corresponda
- pulir render visual en leaderboards

### Fase 4

- ampliar logros bloqueados y secretos con pista
- ligar algunos modelos y cosméticos a logros, rankings y niveles

## Reglas anti-complejidad

- No abrir subconfiguración manual por slot en esta fase.
- No diseñar assets propios.
- No introducir todavía temporadas nuevas solo para desbloqueo visual.
- Mantener compatibilidad con foto de perfil sin deformar la foto original.

## Testing y validación

### Automatizado

- pruebas de construcción de avatar por `style + model`
- pruebas de normalización de modelos bloqueados/disponibles
- pruebas de payload de identidad con `avatar_model_slug`
- pruebas de render de cosmetics en `IdentityPortrait`
- pruebas de leaderboards usando el retrato compuesto
- pruebas de logros secretos con pista

### Visual

- avatar y foto deben verse coherentes en:
  - panel del estudiante
  - sidebar
  - leaderboard
- badges deben ser legibles en tamaño pequeño
- marcos deben entenderse como borde del retrato

## Impacto en core drivers

- `Propiedad y pertenencia`
  - más personalización real
- `Influencia social y relación`
  - identidad competitiva más visible en leaderboard
- `Curiosidad e imprevisibilidad`
  - modelos bloqueados y logros secretos con pista
- `Desarrollo y logro`
  - desbloqueos por nivel, ranking y logros
- `Escasez e impaciencia`
  - modelos/cosméticos no disponibles desde inicio

## Riesgos

- saturar la UI con demasiadas opciones si no se agrupan bien
- que el retrato final se vuelva recargado y pierda legibilidad
- que los cambios cosméticos internos del avatar no se sientan suficientemente distintos
- que los modelos bloqueados parezcan frustración si no muestran un camino claro de desbloqueo

## Recomendación final

Implementar esta expansión como evolución del sistema actual, no como reescritura. El orden correcto es:

1. estilo + modelo
2. catálogo visual ampliado
3. efecto real de cosméticos sobre avatar/foto
4. logros bloqueados y secretos con pista

Eso mantiene coherencia con Clean Lite por feature, preserva lo ya construido y mejora de forma visible la calidad competitiva del sistema.
