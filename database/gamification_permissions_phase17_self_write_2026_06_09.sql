begin;

-- Permitir al estudiante dueño del perfil gamificado actualizar o insertar su propio registro.
drop policy if exists gamification_profiles_admin_trainer_write on gamification.student_profiles;
create policy gamification_profiles_admin_trainer_write
on gamification.student_profiles
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_profiles.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_profiles.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de los eventos de recompensa escribir su propio registro.
drop policy if exists gamification_reward_events_write on gamification.reward_events;
create policy gamification_reward_events_write
on gamification.reward_events
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = reward_events.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = reward_events.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de sus logros escribir su propio registro.
drop policy if exists gamification_student_achievements_write on gamification.student_achievements;
create policy gamification_student_achievements_write
on gamification.student_achievements
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_achievements.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_achievements.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de su reto escribir su propio progreso.
drop policy if exists gamification_student_challenge_progress_write on gamification.student_challenge_progress;
create policy gamification_student_challenge_progress_write
on gamification.student_challenge_progress
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_challenge_progress.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_challenge_progress.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de su snapshot escribir su propio ranking.
drop policy if exists gamification_leaderboard_snapshots_write on gamification.leaderboard_snapshots;
create policy gamification_leaderboard_snapshots_write
on gamification.leaderboard_snapshots
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = leaderboard_snapshots.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = leaderboard_snapshots.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de su wallet de monedas escribir su propio registro.
drop policy if exists gamification_currency_wallets_write on gamification.currency_wallets;
create policy gamification_currency_wallets_write
on gamification.currency_wallets
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_wallets.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_wallets.student_id
      and s.user_id = auth.uid()
  )
);

-- Permitir al estudiante dueño de su extracto de monedas escribir sus propios movimientos.
drop policy if exists gamification_currency_ledger_write on gamification.currency_ledger;
create policy gamification_currency_ledger_write
on gamification.currency_ledger
for all
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_ledger.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_ledger.student_id
      and s.user_id = auth.uid()
  )
);

commit;
