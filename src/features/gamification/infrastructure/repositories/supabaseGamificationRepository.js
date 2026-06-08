import { supabase } from '../../../../config/supabase';
import { GamificationError } from '../../domain/gamificationError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const isNoRowsError = (error) =>
  error?.code === 'PGRST116' ||
  error?.details?.includes?.('0 rows') ||
  error?.message?.toLowerCase?.().includes?.('0 rows');

export class SupabaseGamificationRepository {
  async findStudentByUserId(userId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(
          id,
          nombre,
          apellido,
          fecha_nacimiento
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando estudiante para gamificacion'), error);
    }

    return data;
  }

  async findStudentById(studentId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(
          id,
          nombre,
          apellido,
          fecha_nacimiento
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando estudiante por id'), error);
    }

    return data;
  }

  async listPhysicalTests(studentId) {
    const { data, error } = await supabase
      .from('physical_tests')
      .select('*')
      .eq('student_id', studentId)
      .order('fecha_test', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando tests fisicos para gamificacion'), error);
    }

    return data || [];
  }

  async listPhysicalTestsByStudentIds(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('physical_tests')
      .select('*')
      .in('student_id', studentIds)
      .order('fecha_test', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando tests fisicos por categoria'), error);
    }

    return data || [];
  }

  async listAttendances(studentId) {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('student_id', studentId)
      .order('fecha', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando asistencias para gamificacion'), error);
    }

    return data || [];
  }

  async listAttendancesByStudentIds(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .in('student_id', studentIds)
      .order('fecha', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando asistencias por categoria'), error);
    }

    return data || [];
  }

  async listPayments(studentId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando pagos para gamificacion'), error);
    }

    return data || [];
  }

  async listPaymentsByStudentIds(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando pagos por categoria'), error);
    }

    return data || [];
  }

  async getProfile(studentId) {
    const { data, error } = await supabase
      .from('gamification_profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new GamificationError(normalizeError(error, 'Error cargando perfil gamificado'), error);
    }

    return data || null;
  }

  async getIdentity(studentId) {
    const { data, error } = await supabase
      .from('gamification_student_identity')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new GamificationError(normalizeError(error, 'Error cargando identidad del estudiante'), error);
    }

    return data || null;
  }

  async upsertIdentity(identity) {
    const { data, error } = await supabase
      .from('gamification_student_identity')
      .upsert(identity)
      .select()
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando identidad del estudiante'), error);
    }

    return data;
  }

  async upsertProfile(profile) {
    const { data, error } = await supabase
      .from('gamification_profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando perfil gamificado'), error);
    }

    return data;
  }

  async listAchievementCatalog() {
    const { data, error } = await supabase
      .from('gamification_achievement_catalog')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando catalogo de logros'), error);
    }

    return data || [];
  }

  async listStudentAchievements(studentId) {
    const { data, error } = await supabase
      .from('gamification_student_achievements')
      .select('*')
      .eq('student_id', studentId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando logros del estudiante'), error);
    }

    return data || [];
  }

  async listTitleCatalog() {
    const { data, error } = await supabase
      .from('gamification_titles_catalog')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando catalogo de titulos'), error);
    }

    return data || [];
  }

  async listCosmeticCatalog() {
    const { data, error } = await supabase
      .from('gamification_cosmetic_items_catalog')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando catalogo cosmetico'), error);
    }

    return data || [];
  }

  async listStudentCosmeticItems(studentId) {
    const { data, error } = await supabase
      .from('gamification_student_cosmetic_items')
      .select('*')
      .eq('student_id', studentId)
      .order('acquired_at', { ascending: false });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando inventario cosmetico'), error);
    }

    return data || [];
  }

  async getStudentCosmeticEquipment(studentId) {
    const { data, error } = await supabase
      .from('gamification_student_cosmetic_equipment')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new GamificationError(normalizeError(error, 'Error cargando equipamiento cosmetico'), error);
    }

    return data || null;
  }

  async purchaseCosmeticItem(studentId, itemSlug) {
    const { data, error } = await supabase.rpc('purchase_gamification_item', {
      p_student_id: studentId,
      p_item_slug: itemSlug,
    });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error comprando item cosmetico'), error);
    }

    return data;
  }

  async equipCosmeticItem(studentId, itemSlug) {
    const { data, error } = await supabase.rpc('equip_gamification_item', {
      p_student_id: studentId,
      p_item_slug: itemSlug,
    });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error equipando item cosmetico'), error);
    }

    return data;
  }

  async replaceRewardEvents(studentId, events) {
    const deleteQuery = supabase
      .from('gamification_reward_events')
      .delete()
      .eq('student_id', studentId);
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando eventos gamificados'), deleteError);
    }

    if (!events || events.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_reward_events')
      .insert(events)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando eventos gamificados'), error);
    }

    return data || [];
  }

  async listXpLedger(studentId, limit = 25) {
    let query = supabase
      .from('gamification_xp_ledger')
      .select('*')
      .eq('student_id', studentId)
      .order('occurred_at', { ascending: false });

    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando extracto de XP'), error);
    }

    return data || [];
  }

  async appendXpLedgerEntry(entry) {
    const { data, error } = await supabase
      .from('gamification_xp_ledger')
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando movimiento de XP'), error);
    }

    return data;
  }

  async getCurrencyWallet(studentId) {
    const { data, error } = await supabase
      .from('gamification_currency_wallets')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new GamificationError(normalizeError(error, 'Error cargando wallet de monedas'), error);
    }

    return data || null;
  }

  async upsertCurrencyWallet(wallet) {
    const { data, error } = await supabase
      .from('gamification_currency_wallets')
      .upsert(wallet)
      .select()
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando wallet de monedas'), error);
    }

    return data;
  }

  async listCurrencyLedger(studentId, limit = 25) {
    let query = supabase
      .from('gamification_currency_ledger')
      .select('*')
      .eq('student_id', studentId)
      .order('occurred_at', { ascending: false });

    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando extracto de monedas'), error);
    }

    return data || [];
  }

  async replaceCurrencyLedger(studentId, rows) {
    const { error: deleteError } = await supabase
      .from('gamification_currency_ledger')
      .delete()
      .eq('student_id', studentId)
      .neq('source_type', 'cosmetic_purchase');

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando extracto de monedas'), deleteError);
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_currency_ledger')
      .insert(rows)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando extracto de monedas'), error);
    }

    return data || [];
  }

  async replaceXpLedger(studentId, rows) {
    const { error: deleteError } = await supabase
      .from('gamification_xp_ledger')
      .delete()
      .eq('student_id', studentId)
      .neq('source_type', 'daily_login');

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando extracto de XP'), deleteError);
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_xp_ledger')
      .insert(rows)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando extracto de XP'), error);
    }

    return data || [];
  }

  async getLoginRewardState(userId) {
    const { data, error } = await supabase
      .from('gamification_login_rewards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new GamificationError(normalizeError(error, 'Error cargando recompensa diaria'), error);
    }

    return data || null;
  }

  async upsertLoginRewardState(row) {
    const { data, error } = await supabase
      .from('gamification_login_rewards')
      .upsert(row)
      .select()
      .single();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando recompensa diaria'), error);
    }

    return data;
  }

  async replaceStudentAchievements(studentId, achievements) {
    const { error: deleteError } = await supabase
      .from('gamification_student_achievements')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando logros del estudiante'), deleteError);
    }

    if (!achievements || achievements.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_student_achievements')
      .insert(achievements)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando logros del estudiante'), error);
    }

    return data || [];
  }

  async listActiveChallenges(today) {
    const { data, error } = await supabase
      .from('gamification_challenges_catalog')
      .select('*')
      .eq('is_active', true);
    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando retos activos'), error);
    }

    if (!today) {
      return data || [];
    }

    return (data || []).filter((challenge) => {
      const startsOk = !challenge.start_date || challenge.start_date <= today;
      const endsOk = !challenge.end_date || challenge.end_date >= today;
      return startsOk && endsOk;
    });
  }

  async listStudentChallengeProgress(studentId) {
    const { data, error } = await supabase
      .from('gamification_student_challenge_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando progreso de retos'), error);
    }

    return data || [];
  }

  async replaceChallengeProgress(studentId, rows) {
    const { error: deleteError } = await supabase
      .from('gamification_student_challenge_progress')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando progreso de retos'), deleteError);
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_student_challenge_progress')
      .insert(rows)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando progreso de retos'), error);
    }

    return data || [];
  }

  async listStudentsByCategory(category) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(
          id,
          nombre,
          apellido,
          fecha_nacimiento
        )
      `)
      .eq('categoria', category);

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando estudiantes por categoria'), error);
    }

    return data || [];
  }

  async listProfilesByStudentIds(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_profiles')
      .select('*')
      .in('student_id', studentIds);

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando perfiles para leaderboard'), error);
    }

    return data || [];
  }

  async listIdentitiesByStudentIds(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_student_identity')
      .select('*')
      .in('student_id', studentIds);

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando identidades para leaderboard'), error);
    }

    return data || [];
  }

  async replaceLeaderboardSnapshots({ category, snapshotDate, rows }) {
    const { error: deleteError } = await supabase
      .from('gamification_leaderboard_snapshots')
      .delete()
      .eq('categoria', category)
      .eq('snapshot_date', snapshotDate);

    if (deleteError) {
      throw new GamificationError(normalizeError(deleteError, 'Error limpiando leaderboard snapshot'), deleteError);
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gamification_leaderboard_snapshots')
      .insert(rows)
      .select();

    if (error) {
      throw new GamificationError(normalizeError(error, 'Error guardando leaderboard snapshot'), error);
    }

    return data || [];
  }

  async listCategoryLeaderboard({ category, ageBand, limit = 5 }) {
    let query = supabase
      .from('gamification_leaderboard_public')
      .select('*')
      .eq('categoria', category)
      .order('rank_position', { ascending: true })
      .limit(limit);

    if (ageBand) {
      query = query.eq('age_band', ageBand);
    }

    const { data, error } = await query;
    if (error) {
      throw new GamificationError(normalizeError(error, 'Error cargando leaderboard publico'), error);
    }

    return data || [];
  }
}
