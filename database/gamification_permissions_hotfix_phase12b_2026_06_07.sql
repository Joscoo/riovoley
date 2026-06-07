begin;

grant usage on schema gamification to authenticated;
grant usage on schema gamification to anon;

grant select on
  gamification.student_profiles,
  gamification.reward_events,
  gamification.achievement_catalog,
  gamification.student_achievements,
  gamification.challenges_catalog,
  gamification.student_challenge_progress,
  gamification.leaderboard_snapshots
to authenticated;

grant insert, update, delete on
  gamification.student_profiles,
  gamification.reward_events,
  gamification.student_achievements,
  gamification.student_challenge_progress,
  gamification.leaderboard_snapshots
to authenticated;

grant select on
  gamification.achievement_catalog,
  gamification.challenges_catalog,
  gamification.leaderboard_snapshots
to anon;

commit;
