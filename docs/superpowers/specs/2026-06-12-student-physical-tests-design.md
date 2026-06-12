# Student Physical Tests Redesign

Fecha: 2026-06-12
Area: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.js`
Estado: propuesta aprobada para especificacion, pendiente de implementacion

## Objetivo

Rediseñar el modulo de tests fisicos visible para el estudiante para que cumpla dos metas:

1. Hacer que el progreso se entienda rapidamente desde una lectura narrativa y visual.
2. Sustituir las recomendaciones genericas basadas casi solo en IMC por recomendaciones mixtas por perfil, con foco principal en rendimiento deportivo y contexto corporal secundario.

## Problema actual

La vista actual presenta tres limitaciones principales:

1. La lectura del progreso esta fragmentada en muchas mini graficas y tarjetas sin una historia clara.
2. Las recomendaciones estan demasiado concentradas en IMC y nutricion general, aunque el modulo contiene metricas de salto, alcance y fuerza mas relevantes para el entrenamiento.
3. La logica derivada de calculos, tendencias y recomendaciones vive dentro de un componente grande, lo que dificulta evolucionar el modulo y probarlo con confianza.

## Alcance

Incluido en esta mejora:

- Vista de tests fisicos del estudiante.
- Reorganizacion de la experiencia visual como historia de progreso.
- Nuevo modelo derivado de perfil fisico del estudiante.
- Nuevo sistema de recomendaciones por perfil mixto.
- Refactor de componentes para separar calculo de UI.
- Cobertura de pruebas unitarias y de render para la nueva logica.

Fuera de alcance en esta iteracion:

- Cambios al formulario de registro/edicion de tests del entrenador.
- Cambios de esquema en Supabase o nuevas columnas.
- Reglas medicas avanzadas o diagnosticos clinicos.
- Integraciones con IA o recomendaciones generadas externamente.

## Resultado esperado en producto

La pantalla del estudiante debe responder con claridad estas preguntas:

- Cual es mi estado actual.
- En que he mejorado.
- En que he retrocedido o me estanque.
- Que deberia priorizar ahora.

El estudiante no debe tener que interpretar por su cuenta una grilla de graficas aisladas ni leer recomendaciones desconectadas de sus datos.

## Direccion de diseno

Se adopta una estructura de tipo `historia de progreso`.

Orden de la pantalla:

1. Hero de estado actual.
2. Grafica principal de evolucion por bloque.
3. Lectura del progreso en lenguaje claro.
4. Recomendaciones por perfil mixto.
5. Historial compacto de tests.

Esta estructura prioriza primero comprension, luego detalle.

## Arquitectura propuesta

### 1. Componente contenedor

`StudentPhysicalTests.js` dejara de concentrar toda la logica derivada. Su rol sera:

- recibir `physicalTests`, `studentData` y `onRefresh`
- pedir la construccion del perfil derivado
- renderizar secciones visuales
- manejar estados simples de la vista, como bloque activo del chart

### 2. Constructor de perfil derivado

Se agregara un modulo derivado, por ejemplo:

- `buildStudentPhysicalProfile.js`

Responsabilidades:

- ordenar tests por `fecha_test`
- normalizar valores numericos
- agrupar metricas por bloque
- calcular snapshot actual
- calcular tendencias
- generar insights
- generar recomendaciones por perfil
- exponer metadata lista para render

Este modulo no debe renderizar nada ni depender de React.

### 3. Componentes visuales nuevos

Se separaran componentes pequenos, orientados a una sola responsabilidad:

- `StudentPhysicalHero`
- `StudentPhysicalTrendChart`
- `StudentPhysicalInsights`
- `StudentPhysicalRecommendations`
- `StudentPhysicalHistory`

Si durante la implementacion el repositorio sugiere otra ubicacion o naming cercano a patrones existentes, se mantendra la convencion del repo sin alterar la separacion logica.

## Modelo del perfil mixto

El perfil del estudiante se construira a partir de tres bloques:

### Bloque corporal

Metricas:

- `peso`
- `estatura`
- `IMC` derivado

Objetivo:

- aportar contexto de composicion corporal y evolucion general
- no dominar la lectura del rendimiento salvo cuando afecte de forma visible el resto de metricas

### Bloque salto y alcance

Metricas:

- `brazo_extend_inicial`
- `brazo_extend_sin_impulso`
- `brazo_extend_con_impulso`
- `fuerza_explosiva_salto_largo`
- `envergadura_brazos_extendidos_lateral`

Objetivo:

- ser el eje principal de lectura deportiva
- destacar progreso de explosividad, alcance y transferencia

### Bloque fuerza

Metricas:

- `fuerza_abdomen`
- `fuerza_brazos`
- `fuerza_piernas`
- `elevaciones_barra`

Objetivo:

- mostrar base de fuerza y relacionarla con la evolucion del rendimiento de salto

## Datos derivados por bloque

Cada bloque debe devolver:

- `current`: valores mas recientes
- `previous`: valores del test anterior cuando existan
- `baseline`: primer test util para comparar progreso acumulado
- `deltaFromPrevious`
- `deltaFromBaseline`
- `status`: `mejora`, `alerta`, `estable` o `sin_datos`
- `summary`: frase breve entendible para el estudiante

Los calculos deben hacerse por metrica disponible. La ausencia de un dato en una metrica no invalida todo el bloque.

## Reglas de interpretacion

La pantalla no debe asumir que todo aumento es bueno ni que toda disminucion es mala.

Principios:

1. En `salto y alcance`, una subida suele interpretarse como mejora.
2. En `fuerza`, una subida suele interpretarse como mejora.
3. En `bloque corporal`, el cambio se interpreta con contexto y no como mejora automatica.
4. Cuando haya conflicto entre bloques, el sistema debe priorizar una lectura prudente, no triunfalista.

Ejemplos de lectura:

- Si mejora fuerza y cae salto: sugerir trabajo de explosividad, tecnica o transferencia.
- Si sube peso y cae salto: marcar posible interferencia de carga corporal o recuperacion.
- Si el peso se mantiene y mejora salto/fuerza: resaltar consistencia positiva.
- Si faltan datos de fuerza pero hay mejora de salto: no inventar conclusiones sobre fuerza.

## Sistema de recomendaciones

Las recomendaciones deben generarse desde combinaciones de senales visibles, no desde una sola metrica.

Salida esperada:

- `headline`: conclusion principal
- `priority`: foco inmediato de trabajo
- `recommendations`: 3 a 5 acciones concretas
- `confidence`: `alta`, `media` o `preliminar`
- `disclaimer`: texto breve de seguridad cuando aplique

Caracteristicas:

- tono claro, directo y deportivo
- sin lenguaje clinico
- sin prescribir tratamiento medico
- sin sugerir precision falsa cuando hay pocos datos

Tipos de recomendaciones esperadas:

- tecnica y explosividad
- fuerza base
- consistencia y continuidad
- recuperacion y carga
- control corporal y habitos generales

Nutricion puede aparecer como apoyo, pero deja de ser el centro del modulo.

## Diseno de graficas

Se reemplaza la grilla de multiples mini barras como elemento principal por una grafica narrativa central.

### Comportamiento

- selector por bloque: `corporal`, `salto y alcance`, `fuerza`
- grafica principal de linea para evolucion temporal
- solo se muestran metricas compatibles dentro del bloque
- cada bloque tiene su propio set de colores y leyenda clara

### Reglas visuales

- no mezclar en una misma grafica `peso`, `estatura` y `repeticiones`
- ocultar series sin datos suficientes
- mostrar estados vacios utiles cuando un bloque no tiene informacion consistente
- acompanar la grafica con un resumen textual, no dejarla sola

## Hero y lectura de progreso

La primera seccion debe mostrar:

- fecha del ultimo test
- estado general del perfil
- 2 o 3 hallazgos clave
- acceso rapido a actualizar datos

Debajo de la grafica principal se mostraran tarjetas de lectura como:

- `Lo que mejoro`
- `Lo que necesita trabajo`
- `Lo que se mantiene estable`

Estas tarjetas deben estar justificadas por el perfil derivado, no por texto fijo.

## Historial de tests

El historial permanece, pero se simplifica:

- layout mas compacto
- menos ruido visual
- enfasis en metricas relevantes
- observaciones visibles solo si aportan contexto

Debe seguir funcionando bien para uno o muchos tests.

## Manejo de edge cases

### Sin tests

- mantener estado vacio claro y orientado
- explicar que la lectura aparecera cuando existan evaluaciones

### Un solo test

- mostrar snapshot actual
- no forzar tendencia ni comparativas inexistentes
- recomendaciones marcadas como preliminares

### Datos parciales

- degradar por bloque
- no romper toda la pantalla
- no mostrar comparativas inventadas

### Fechas desordenadas

- ordenar internamente por `fecha_test` antes de calcular

### Cambios ambiguos

- el bloque corporal debe evitar conclusiones simplistas
- cuando no haya suficiente evidencia, usar mensajes de observacion en vez de recomendacion fuerte

## Accesibilidad y UX

- mantener buen contraste y legibilidad sobre la estetica actual del panel
- lenguaje simple y escaneable
- contenido util en mobile y desktop
- evitar sobrecargar al estudiante con demasiadas cifras visibles al mismo tiempo

## Plan de implementacion propuesto

1. Extraer utilidades y constructor del perfil.
2. Rediseñar `StudentPhysicalTests.js` como contenedor.
3. Crear componentes visuales pequenos por seccion.
4. Sustituir recomendaciones actuales basadas en IMC por recomendaciones mixtas.
5. Reemplazar el sistema actual de mini barras por grafica central por bloque.
6. Ajustar historial y estados vacios.
7. Agregar pruebas unitarias del perfil y pruebas de render del componente.

## Estrategia de pruebas

### Unit tests del perfil derivado

Cubrir como minimo:

- sin tests
- un solo test
- mejora sostenida
- retroceso en salto con fuerza estable
- aumento de peso con caida de salto
- datos incompletos por bloque
- ordenamiento correcto por fecha

### Tests de componentes

Cubrir como minimo:

- render de estado vacio
- render de snapshot unico
- render de grafica por bloque
- render de insights
- recomendaciones preliminares vs confiables

### Riesgo principal

El mayor riesgo funcional es presentar recomendaciones mas sofisticadas sin volverlas opacas. Por eso cada recomendacion debe poder explicarse con datos que el estudiante vea en pantalla.

## Criterios de aceptacion

La mejora se considera correcta si:

1. El estudiante entiende rapidamente estado actual, mejoras y alertas.
2. La grafica principal cuenta una historia y no solo muestra barras aisladas.
3. Las recomendaciones reflejan perfil mixto: rendimiento primero, contexto corporal despues.
4. La logica de calculo queda separada de la UI y es testeable.
5. La vista funciona con cero, uno o multiples tests sin romper la experiencia.
