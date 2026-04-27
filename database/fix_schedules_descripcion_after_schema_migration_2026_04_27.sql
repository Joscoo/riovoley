-- Fix: restaurar columna descripcion en training.schedules tras migracion de esquemas
-- Fecha: 2026-04-27
-- Contexto: public.schedules ahora es una vista hacia training.schedules.
-- Si la columna no existe en training.schedules, PostgREST devuelve:
-- "Could not find the 'descripcion' column of 'schedules' in the schema cache"

begin;

alter table if exists training.schedules
add column if not exists descripcion text;

update training.schedules
set descripcion = case categoria
  when 'iniciacion_hombres' then 'Perfecto para quienes se inician en el voleibol. Aprende los fundamentos basicos: recepcion, saque, golpe de dedos, antebrazo y posicionamiento en cancha. Entrenamiento progresivo y didactico.'
  when 'iniciacion_mujeres' then 'Ideal para principiantes que quieren aprender voleibol desde cero. Desarrolla tecnica basica, coordinacion y trabajo en equipo en un ambiente motivador y de apoyo constante.'
  when 'perfeccionamiento_hombres' then 'Para jugadores con experiencia que buscan mejorar su tecnica y tactica de juego. Enfoque en remates, bloqueos, sistemas defensivos y estrategias avanzadas de competicion.'
  when 'perfeccionamiento_mujeres' then 'Entrenamiento avanzado para jugadoras con bases solidas. Perfecciona tus habilidades tecnicas, lee el juego rival, mejora tu tactica individual y colectiva para competir al maximo nivel.'
  when 'master_mujeres' then 'Categoria especial para atletas mayores de 18 anos con experiencia previa en voleibol. Manten tu nivel competitivo, mejora tu condicion fisica y disfruta del juego con companeras de tu edad y experiencia.'
  when 'open_gym' then 'Sesion de juego libre para todos los niveles. Practica lo aprendido, conoce jugadores de diferentes categorias y disfruta partidos recreativos en un ambiente divertido y competitivo.'
  else null
end
where descripcion is null;

-- Importante: la vista public.schedules no incorpora automaticamente
-- columnas nuevas agregadas a training.schedules.
create or replace view public.schedules as
select * from training.schedules;

grant select, insert, update, delete on public.schedules to authenticated;
grant select on public.schedules to anon;

commit;

-- Forzar recarga de cache de PostgREST para que reconozca la nueva columna.
select pg_notify('pgrst', 'reload schema');

-- Verificacion: debe devolver columna_existe = true.
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'training'
    and table_name = 'schedules'
    and column_name = 'descripcion'
) as columna_existe;
