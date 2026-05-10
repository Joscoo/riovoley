# athletes

Feature clean-lite para gestion de atletas.

## Responsabilidades
- Cargar listado de atletas con informacion de usuario asociada.
- Encapsular operaciones de actualizacion y eliminacion en repositorio Supabase.
- Resolver limpieza de usuarios huerfanos sin exponer `supabase` a la UI.

## Capas
- `presentation/createAthletesService.js`: orquesta casos de uso consumidos por UI.
- `domain/athletesError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAthletesRepository.js`: acceso a tablas `students` y `users`.

## Contrato publico
- `athletesService.loadAtletas()`
- `athletesService.updateAtleta({ editingAtleta, formData })`
- `athletesService.deleteAtletaRecords({ atleta })`
- `athletesService.listOrphanUsers()`
- `athletesService.deleteUserRecord({ userId })`

