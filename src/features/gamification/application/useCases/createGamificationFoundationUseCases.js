import { getEcuadorDate, getEcuadorISOString } from '../../../../utils/dateUtils';

const DAILY_LOGIN_XP = 8;

export const formatXpLedgerRows = (rows) =>
  (rows || []).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    sourceType: row.source_type,
    sourceRef: row.source_ref || null,
    xpDelta: Number(row.xp_delta || 0),
    label: row.label || 'XP',
    description: row.description || '',
    metadata: row.metadata || {},
    occurredAt: row.occurred_at || null,
    createdAt: row.created_at || null,
  }));

export const createGamificationFoundationUseCases = (repository, deps = {}) => {
  const todayProvider = deps.getEcuadorDate || getEcuadorDate;
  const isoProvider = deps.getEcuadorISOString || getEcuadorISOString;

  const loadXpLedgerUseCase = {
    execute: async ({ studentId, limit = 25 }) => {
      const rows = await repository.listXpLedger(studentId, limit);
      return formatXpLedgerRows(rows);
    },
  };

  const registerDailyLoginRewardUseCase = {
    execute: async ({ userId }) => {
      const student = await repository.findStudentByUserId(userId);
      const today = todayProvider();
      const occurredAt = isoProvider();
      const rewardState = await repository.getLoginRewardState(userId);

      if (rewardState?.reward_date === today) {
        return {
          awarded: false,
          xpDelta: 0,
          rewardDate: today,
          studentId: student.id,
        };
      }

      await repository.upsertLoginRewardState({
        user_id: userId,
        reward_date: today,
        reward_count: 1,
        updated_at: occurredAt,
      });

      await repository.appendXpLedgerEntry({
        student_id: student.id,
        source_type: 'daily_login',
        source_ref: today,
        xp_delta: DAILY_LOGIN_XP,
        label: 'Ingreso diario',
        description: 'Recompensa minima por volver hoy a la aplicacion.',
        metadata: {
          rewardDate: today,
        },
        occurred_at: occurredAt,
        created_at: occurredAt,
      });

      return {
        awarded: true,
        xpDelta: DAILY_LOGIN_XP,
        rewardDate: today,
        studentId: student.id,
      };
    },
  };

  return {
    loadXpLedgerUseCase,
    registerDailyLoginRewardUseCase,
  };
};
