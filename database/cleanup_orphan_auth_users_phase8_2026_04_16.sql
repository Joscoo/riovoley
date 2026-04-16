-- Fase P7 - Limpieza de usuarios huerfanos en auth.users
-- Fecha: 2026-04-16
-- Objetivo:
--   Eliminar cuentas en auth.users que bloquean recreacion de atletas,
--   pero que NO existen en core.users.
--
-- Uso:
--   1) Edita la lista de emails en target_emails.
--   2) Ejecuta el bloque de previsualizacion.
--   3) Si el resultado es correcto, ejecuta el bloque DELETE.

begin;

-- 1) Lista de correos a limpiar (EDITAR)
create temporary table target_emails (email text primary key) on commit drop;

insert into target_emails (email)
values
  ('gh6kus0iuw@lnovic.com'),
  ('faniq6ajwi@lnovic.com'),
  ('camizavala1995@gmail.com'),
  ('ingird_steffy@hotmail.com'),
  ('jsatf97d1i@xkxkud.com'),
  ('shwi44fh35@yzcalo.com'),
  ('toaohh9y7c@bwmyga.com');

-- 2) Previsualizacion: que se va a eliminar
-- Solo candidatos huerfanos (en auth.users pero no en core.users)
select
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  case when cu.id is null then 'ORPHAN' else 'HAS_CORE_USER' end as status
from auth.users au
left join core.users cu on cu.id = au.id
join target_emails te on te.email = au.email
order by au.created_at desc;

-- 3) DELETE seguro: solo huerfanos
-- Descomenta para ejecutar despues de validar el SELECT anterior.
delete from auth.users au
using target_emails te
where au.email = te.email
  and not exists (
    select 1
    from core.users cu
    where cu.id = au.id
  );

-- 4) Verificacion post-delete
select
  au.id,
  au.email,
  au.created_at
from auth.users au
join target_emails te on te.email = au.email
order by au.created_at desc;

commit;

-- Consulta opcional: detectar TODOS los huerfanos en auth (solo lectura)
-- select au.id, au.email, au.created_at
-- from auth.users au
-- left join core.users cu on cu.id = au.id
-- where cu.id is null
-- order by au.created_at desc;
