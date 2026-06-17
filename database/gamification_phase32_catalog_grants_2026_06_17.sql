begin;

-- Grant write permissions on catalog tables to authenticated role.
-- Note: Row Level Security (RLS) policies are already in place to restrict
-- these operations exclusively to administrators. However, without these
-- table-level grants, the 'authenticated' role gets "permission denied"
-- regardless of what the RLS policy says.

grant insert, update, delete on
  gamification.cosmetic_items_catalog,
  gamification.achievement_catalog,
  gamification.challenges_catalog,
  gamification.titles_catalog,
  gamification.athlete_stages_catalog,
  gamification.campaigns_catalog,
  gamification.hidden_rewards_catalog
to authenticated;

-- Also ensure that PostgREST compatibility views have the correct grants
-- since we route requests through the public schema.
grant insert, update, delete on
  public.gamification_cosmetic_items_catalog,
  public.gamification_achievement_catalog,
  public.gamification_challenges_catalog,
  public.gamification_titles_catalog,
  public.gamification_athlete_stages_catalog,
  public.gamification_campaigns_catalog,
  public.gamification_hidden_rewards_catalog
to authenticated;

commit;
