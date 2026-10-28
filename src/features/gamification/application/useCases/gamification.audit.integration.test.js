// Integración local: módulos reales + repositorio en memoria; no valida PostgreSQL/RLS/RPC.
import { createGamificationService } from '../../presentation/createGamificationService';
import { createAttendanceUseCases } from '../../../attendance/application/useCases/createAttendanceUseCases';
import { createPaymentsUseCases } from '../../../payments/application/useCases/createPaymentsUseCases';
import { createPhysicalTestsUseCases } from '../../../physical-tests/application/useCases/createPhysicalTestsUseCases';

jest.mock('../../../../config/supabase', () => ({ supabase: {} }));
jest.mock('../../../../shared/infrastructure/mobile', () => ({ pushNotificationGateway: {} }));

const TODAY = '2026-06-07';
function fixture() {
  const student = { id: 'audit-student', user_id: 'audit-user', categoria: 'iniciacion_hombres', users: { nombre: 'Fixture', apellido: 'Auditoria' } };
  const state = { attendances: [], payments: [], tests: [], xp: [], coins: [], achievements: [], challenges: [], profile: null, wallet: null, login: null };
  const repo = {
    findStudentById: async () => student,
    findStudentByUserId: async () => student,
    listPhysicalTests: async () => state.tests,
    listAttendances: async () => state.attendances,
    listPayments: async () => state.payments,
    listPhysicalTestsByStudentIds: async () => state.tests,
    listAttendancesByStudentIds: async () => state.attendances,
    listPaymentsByStudentIds: async () => state.payments,
    getProfile: async () => state.profile,
    upsertProfile: async value => { state.profile = value; },
    getCurrencyWallet: async () => state.wallet,
    upsertCurrencyWallet: async value => { state.wallet = value; },
    listXpLedger: async () => state.xp,
    replaceXpLedger: async (_id, rows) => { state.xp = rows; },
    appendXpLedgerEntry: async row => { state.xp.push(row); },
    listCurrencyLedger: async () => state.coins,
    replaceCurrencyLedger: async (_id, rows) => { state.coins = rows; },
    listStudentAchievements: async () => state.achievements,
    replaceStudentAchievements: async (_id, rows) => { state.achievements = rows; },
    listStudentChallengeProgress: async () => state.challenges,
    replaceChallengeProgress: async (_id, rows) => { state.challenges = rows; },
    listAchievementCatalog: async () => [],
    listActiveChallenges: async () => [],
    listStudentsByCategory: async () => [student],
    replaceRewardEvents: async () => {},
    replaceLeaderboardSnapshots: async () => {},
    getLoginRewardState: async () => state.login,
    upsertLoginRewardState: async value => { state.login = value; },
  };
  const gamification = createGamificationService(repo, { notificationService: {} });
  const attendance = createAttendanceUseCases({
    findAttendanceByStudentAndDate: async (id, date) => state.attendances.find(a => a.student_id === id && a.fecha === date),
    createAttendance: async value => { const row = { id: 'audit-attendance', ...value }; state.attendances.push(row); return row; },
    updateAttendance: async (id, value) => { Object.assign(state.attendances.find(a => a.id === id), value); },
  }, { gamificationService: gamification });
  const payments = createPaymentsUseCases({
    createPayment: async value => { const row = { id: 'audit-payment', ...value, fecha_inicio: TODAY, estado: 'activo' }; state.payments.push(row); return row; },
    getAthleteByStudentId: async () => null,
    getPaymentById: async id => state.payments.find(p => p.id === id),
    updatePayment: async (id, value) => { Object.assign(state.payments.find(p => p.id === id), value); },
  }, { gamificationService: gamification, getEcuadorDate: () => TODAY });
  const physical = createPhysicalTestsUseCases({
    createTest: async value => { const row = { id: 'audit-test', ...value }; state.tests.push(row); return row; },
    updateTest: async (id, value) => { const row = state.tests.find(t => t.id === id); Object.assign(row, value); return [row]; },
  }, { gamificationService: gamification });
  return { state, student, gamification, attendance, payments, physical };
}

beforeEach(() => { jest.useFakeTimers('modern'); jest.setSystemTime(new Date('2026-06-07T17:00:00Z')); });
afterEach(() => { jest.useRealTimers(); });

test('auditoria: registrar asistencia produce XP mediante el servicio y casos de uso reales', async () => {
  const f = fixture();
  await f.attendance.registerAttendanceWithPaymentUseCase.execute({ athleteId: f.student.id, selectedDate: TODAY, paymentTypeId: 1 });
  expect(f.state.xp).toEqual(expect.arrayContaining([expect.objectContaining({ source_type: 'attendance', source_ref: 'audit-attendance', xp_delta: 35 })]));
  expect(f.state.profile.total_xp).toBeGreaterThanOrEqual(35);
  expect(f.state.wallet.balance).toBeGreaterThan(0);
});

test('auditoria: actualizar la misma asistencia no duplica XP ni monedas', async () => {
  const f = fixture();
  const input = { athleteId: f.student.id, selectedDate: TODAY, paymentTypeId: 1 };
  await f.attendance.registerAttendanceWithPaymentUseCase.execute(input);
  const previous = { xp: f.state.profile.total_xp, coins: f.state.wallet.balance };
  await f.attendance.registerAttendanceWithPaymentUseCase.execute({ ...input, paymentTypeId: 2 });
  expect(f.state.attendances).toHaveLength(1);
  expect(f.state.xp.filter(x => x.source_type === 'attendance')).toHaveLength(1);
  expect(f.state.profile.total_xp).toBe(previous.xp);
  expect(f.state.wallet.balance).toBe(previous.coins);
});

test('auditoria: crear y modificar un pago recalcula el ledger sin duplicar la fuente', async () => {
  const f = fixture();
  const formData = { student_id: f.student.id, membership_type_id: '1', fecha_pago: TODAY };
  await f.payments.createPaymentUseCase.execute({ formData });
  expect(f.state.xp).toEqual(expect.arrayContaining([expect.objectContaining({ source_type: 'payment', source_ref: 'audit-payment', xp_delta: 90 })]));
  const previous = f.state.profile.total_xp;
  await f.payments.updatePaymentUseCase.execute({ paymentId: 'audit-payment', formData });
  expect(f.state.xp.filter(x => x.source_type === 'payment')).toHaveLength(1);
  expect(f.state.profile.total_xp).toBe(previous);
});

test('auditoria: crear y modificar una evaluacion conserva un unico movimiento base de XP', async () => {
  const f = fixture();
  const formData = { student_id: f.student.id, fecha_test: TODAY, fuerza_abdomen: '20' };
  await f.physical.createTestUseCase.execute({ formData });
  expect(f.state.xp).toEqual(expect.arrayContaining([expect.objectContaining({ source_type: 'physical_test', source_ref: 'audit-test', xp_delta: 100 })]));
  const previous = f.state.profile.total_xp;
  await f.physical.updateTestUseCase.execute({ testId: 'audit-test', formData: { ...formData, fuerza_abdomen: '25' } });
  expect(f.state.xp.filter(x => x.source_type === 'physical_test')).toHaveLength(1);
  expect(f.state.profile.total_xp).toBe(previous);
});

test('auditoria: el servicio de recompensa diaria conserva el estado entre dos llamadas', async () => {
  const f = fixture();
  const first = await f.gamification.registerDailyLoginReward({ userId: f.student.user_id });
  const second = await f.gamification.registerDailyLoginReward({ userId: f.student.user_id });
  expect(first.awarded).toBe(true);
  expect(second.awarded).toBe(false);
  expect(f.state.xp.filter(x => x.source_type === 'daily_login')).toHaveLength(1);
  expect(f.state.xp.find(x => x.source_type === 'daily_login').xp_delta).toBe(8);
});
