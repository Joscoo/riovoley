# schedules

Feature clean-lite para gestion y consulta de horarios.

## Responsabilidades
- Cargar horarios ordenados por dia y hora.
- Crear y actualizar horarios con fallback cuando la columna `descripcion` no exista en BD.
- Eliminar horarios desde componentes sin acceso directo a `supabase`.

## Capas
- `application/useCases/createSchedulesUseCases.js`: reglas de guardado/listado y fallback.
- `presentation/createSchedulesService.js`: fachada consumida por UI.
- `domain/schedulesError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseSchedulesRepository.js`: acceso a tabla `schedules`.

## Contrato publico
- `schedulesService.loadHorarios()`
- `schedulesService.updateHorario({ scheduleId, hora_inicio, hora_fin, categoria, descripcion })`
- `schedulesService.createHorarios({ diasParaCrear, categorias, hora_inicio, hora_fin, descripcionResolver })`
- `schedulesService.deleteHorario({ scheduleId })`
