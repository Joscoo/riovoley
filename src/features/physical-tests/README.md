# physical-tests

Feature clean-lite para gestion de tests fisicos.

## Responsabilidades
- Cargar atletas y listado de evaluaciones fisicas con filtros.
- Crear, actualizar y eliminar tests fisicos desde un servicio desacoplado de UI.
- Encapsular consultas Supabase en un repositorio del feature.

## Capas
- `presentation/createPhysicalTestsService.js`: orquestacion y mapeo de datos para UI.
- `domain/physicalTestsError.js`: error funcional del feature.
- `infrastructure/repositories/supabasePhysicalTestsRepository.js`: acceso a `students` y `physical_tests`.

## Contrato publico
- `physicalTestsService.loadAtletas()`
- `physicalTestsService.loadTests({ filters })`
- `physicalTestsService.createTest({ formData })`
- `physicalTestsService.updateTest({ testId, formData })`
- `physicalTestsService.deleteTest({ testId })`

