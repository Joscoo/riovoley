# Gamification Cosmetics Renderer Expansion Design

## Goal

Hacer que los cosmeticos de gamificacion se sientan valiosos, claramente diferenciados y visualmente legibles tanto en el panel del estudiante como en los leaderboards.

El alcance aprobado combina dos frentes:

- rediseñar el renderer cosmetico para depender de metadata reusable y no de slugs aislados
- expandir el catalogo de manera pareja en `frame`, `background`, `badge` y `effect`

## Product Direction

Direccion visual elegida: `Competitivo`

Principios aprobados:

- los cosmeticos deben distinguirse rapido en perfil y leaderboard
- `common` y `rare` deben mantenerse sobrios
- `epic` y `legendary` concentran el impacto fuerte
- la expansion del catalogo debe ser pareja entre las 4 categorias

## Current Problem

El sistema actual ya soporta inventario, equipamiento y metadata basica, pero la presentacion visual sigue siendo limitada:

- varias diferencias dependen demasiado de color y glow
- parte del renderer sigue resolviendo por `slug`
- algunos items se sienten cercanos entre si aunque tengan nombres distintos
- el catalogo no tiene suficiente amplitud para sostener deseo de coleccion

Esto hace que la tienda exista, pero no siempre que un item se sienta como una meta real.

## Design Decision

Se implementara un enfoque `renderer-first`.

La base visual dejara de depender principalmente de `switch` o heuristicas por slug y pasara a renderizar por metadata estructurada:

- `frameVariant`
- `backgroundVariant`
- `badgeVariant`
- `effectVariant`
- `accent`
- `palette`
- `glow`
- `rarity`

La rareza no solo afectara catalogo o precio; tambien acotara la intensidad visual permitida.

## Renderer Architecture

La pieza central seguira siendo `src/features/gamification/presentation/components/IdentityPortrait.js`.

El retrato renderizara por capas fijas:

1. `effect-back`
2. `frame-shell`
3. `background-layer`
4. `image-or-avatar`
5. `effect-front`
6. `badge-layer`

Cada capa se resolvera por funciones puras basadas en metadata y rareza.

### New Renderer Responsibility Split

`IdentityPortrait` queda como compositor visual.

Se recomienda extraer helpers internos o un modulo de soporte para:

- resolver tokens de marco
- resolver tokens de fondo
- resolver tokens de insignia
- resolver overlays y efectos
- aplicar reglas de intensidad por rareza

La meta es que agregar un nuevo cosmetico no requiera tocar logica visual especifica por slug, salvo casos excepcionales muy especiales.

## Visual Rules By Rarity

### Common

- diferencias visibles por color, material y acabado
- geometria simple
- sin ruido visual fuerte
- util para construir combinaciones limpias

### Rare

- diferencias por color + acabado mas reconocible
- puede introducir texturas suaves, doble tono o relieve ligero
- sigue siendo sobrio

### Epic

- ya puede cambiar silueta, profundidad y presencia
- puede usar glow claro, dobles bordes, overlays controlados o formas mas agresivas
- debe sentirse claramente mejor que common/rare

### Legendary

- piezas memorables y de alta identidad
- puede incluir composicion mas teatral, coronas, pulsos, emblemas o efectos de prestigio
- nunca debe romper legibilidad del rostro/avatar ni del leaderboard

## Visual Rules By Category

### Frame

- `common`: borde simple con materiales distintos
- `rare`: vidrio, metal cepillado, doble tono o cinta deportiva
- `epic`: doble marco, silueta marcada, profundidad visible, esquinas con caracter
- `legendary`: borde firma con identidad fuerte como corona, estructura electrica o emblema integrado

### Background

- `common`: paletas limpias y composicion sobria
- `rare`: spotlight, diagonales, texturas suaves, gradientes mejor construidos
- `epic`: atmosfera, velocidad, energia, profundidad o capas mas notorias
- `legendary`: escena o atmosfera fuerte detras del retrato, sin competir con el sujeto

### Badge

- `common`: insignias compactas, legibles y discretas
- `rare`: formas mas especificas por tematica
- `epic`: silueta propia, relieve y mejor anclaje competitivo
- `legendary`: insignia-trofeo o sello de prestigio claramente reconocible

### Effect

- `common`: casi nulo o muy discreto
- `rare`: halo o destello sobrio
- `epic`: glow, pulse, haze, streak, bokeh competitivo
- `legendary`: overlay memorable y reconocible, pero siempre controlado

## Value Criteria For Every Cosmetic

Un cosmetico solo se considera valido si cumple al menos una de estas condiciones:

- cambia claramente la silueta del retrato
- cambia claramente la lectura visual del perfil
- comunica estatus competitivo
- combina bien con otros slots sin verse generico
- se diferencia de manera visible en tamano pequeno dentro del leaderboard

Regla fuerte:

- si un `epic` o `legendary` se siente como solo “otro color”, el item esta mal definido

## Catalog Expansion

Se expandira el catalogo de forma pareja:

- `frame`: +8
- `background`: +8
- `badge`: +8
- `effect`: +8

Total: `+32` cosmeticos nuevos.

### Rarity Distribution Per Category

Cada categoria recibira:

- `2 common`
- `2 rare`
- `3 epic`
- `1 legendary`

Esto mantiene:

- base sobria disponible temprano
- escalera de valor perceptible
- varias metas visuales fuertes
- una recompensa tope por slot

## Catalog Families

Para evitar que el catalogo parezca aleatorio, los nuevos items se organizaran por familias visuales compatibles:

- `Club / Studio`
- `Velocity / Strike`
- `Elite / Prestige`
- `Mythic / Crown`

No seran sets cerrados obligatorios, pero si piezas compatibles entre slots.

Esto permite que un estudiante combine, por ejemplo:

- `frame` velocity
- `background` velocity
- `badge` velocity
- `effect` velocity

sin que parezca casualidad visual.

## Unlock And Desire Structure

La manera de obtener los items tambien debe reforzar su valor:

- `common/rare`: principalmente compra directa
- `epic`: compra + parte desbloqueada por nivel, logros o racha
- `legendary`: enfocados en prestigio, liderazgo o hitos de alto esfuerzo

La tienda no debe verse como lista plana de precios; debe sentirse como escalera de aspiracion.

## Data And Metadata Changes

No se plantea rediseñar toda la tabla, pero si enriquecer el uso de `metadata` ya existente en `gamification.cosmetic_items_catalog`.

Los nuevos items y, cuando haga falta, algunos existentes, deberian usar campos como:

- `frameVariant`
- `backgroundVariant`
- `badgeVariant`
- `effectVariant`
- `accent`
- `palette`
- `glow`
- `photoFocus`
- `unlockType`
- `unlockTarget`
- `unlockHint`

Si algunos items existentes no tienen metadata suficiente para el nuevo renderer, se actualizaran por migracion SQL.

## Rendering With Photo Mode

Las reglas actuales de `photoFocus` se conservan:

- `frame` afecta borde visible
- `badge` se superpone a la foto
- `background` vive detras
- `effect` vive alrededor o sobre capas externas

El nuevo renderer debe asegurar que:

- con foto, el retrato siga viendose premium y claro
- con avatar, los efectos puedan aprovechar mejor profundidad y fondo
- la misma pieza siga sintiendose util en ambos modos, aunque su expresion cambie

## UX Expectations

El estudiante debe notar tres cosas de inmediato:

- que cada pieza tiene un caracter visible
- que hay una progresion clara entre rarezas
- que conseguir `epic` y `legendary` cambia de verdad como se ve su identidad competitiva

El leaderboard debe seguir siendo legible en tamanos pequenos, por lo que el rediseño visual no puede sacrificar lectura por espectacularidad.

## Testing Strategy

Se implementara con TDD.

Cobertura minima esperada:

- tests del renderer para verificar variantes por categoria
- tests del renderer para verificar intensidad por rareza
- tests para asegurar que ciertos `epic/legendary` no colapsan al mismo output visual que `common/rare`
- tests de agregado/proyeccion si cambian payloads de catalogo o equipamiento
- tests de UI si se modifica presentacion de preview o tienda

Ademas, se validara visualmente:

- retrato en panel del estudiante
- retrato en leaderboard
- modo avatar
- modo foto

## Implementation Boundaries

En alcance:

- refactor del renderer cosmetico
- expansion pareja del catalogo
- ajuste de metadata en catalogo existente cuando sea necesario
- mantenimiento de compatibilidad con inventory, equip y purchase actuales

Fuera de alcance:

- rehacer economia completa
- cambiar el modelo de wallet
- introducir animaciones complejas reales por canvas o WebGL
- rediseñar toda la UI del panel fuera de lo necesario para mostrar mejor los cosmeticos

## Success Criteria

El trabajo se considera exitoso si:

- todos los slots tienen nuevas piezas deseables
- los `common/rare` se distinguen sin verse ruidosos
- los `epic/legendary` se sienten claramente especiales
- el renderer deja de depender principalmente de slugs individuales
- los cosmeticos se diferencian en perfil y tambien en leaderboard
- el catalogo ampliado no se siente como relleno

