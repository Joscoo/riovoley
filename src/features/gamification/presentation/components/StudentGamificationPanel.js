import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBolt,
  FaCalendarCheck,
  FaChartLine,
  FaChevronRight,
  FaFire,
  FaFlagCheckered,
  FaLockOpen,
  FaLayerGroup,
  FaMedal,
  FaRunning,
  FaShieldAlt,
  FaStar,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import { gamificationService } from '../../gamificationService';
import { Button, Card, EmptyState, SectionHeader, StatusBadge } from '../../../../shared/ui';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible';
  return parsed.toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildRingStyle = (percent) => ({
  background: `conic-gradient(from 210deg, rgba(245, 158, 11, 1) 0deg, rgba(251, 191, 36, 1) ${percent * 3.6}deg, rgba(148, 163, 184, 0.14) ${percent * 3.6}deg 360deg)`,
});

const getNextChallenge = (challenges) => {
  const pending = (challenges || []).filter((challenge) => !challenge.isCompleted);
  if (pending.length === 0) {
    return null;
  }

  return [...pending].sort((left, right) => {
    const leftPct = left.targetValue > 0 ? left.progressValue / left.targetValue : 0;
    const rightPct = right.targetValue > 0 ? right.progressValue / right.targetValue : 0;
    return rightPct - leftPct;
  })[0];
};

const getLeaderboardTone = (position) => {
  if (position === 1) return 'border-amber-300/50 bg-amber-500/10';
  if (position === 2) return 'border-slate-300/40 bg-slate-400/10';
  if (position === 3) return 'border-orange-300/45 bg-orange-500/10';
  return 'border-white/10 bg-black/20';
};

const ProgressRing = ({ percent, level, title }) => (
  <div className="relative h-36 w-36 shrink-0 rounded-full p-2 shadow-2xl shadow-amber-400/10" style={buildRingStyle(percent)}>
    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/95 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Nivel</p>
      <p className="mt-1 text-4xl font-black text-white">{level}</p>
      <p className="mt-1 px-3 text-xs font-semibold text-slate-300">{title}</p>
    </div>
  </div>
);

ProgressRing.propTypes = {
  percent: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
};

const HighlightStat = ({ icon, label, value, helper, tone = 'default' }) => {
  const toneClass = tone === 'success'
    ? 'border-emerald-300/35 bg-emerald-900/15'
    : tone === 'warning'
      ? 'border-amber-300/35 bg-amber-900/15'
      : 'border-white/15 bg-black/20';

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200">
        <span className="text-rv-gold">{icon}</span>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{helper}</p>
    </div>
  );
};

HighlightStat.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(['default', 'success', 'warning']),
};

const StudentGamificationPanel = ({ gamification, userId, onRefresh, onIdentityUpdated, loading = false }) => {
  const profile = gamification?.profile;
  const identity = gamification?.identity || null;
  const achievements = gamification?.achievements || [];
  const lockedAchievements = gamification?.lockedAchievements || [];
  const challenges = gamification?.challenges || [];
  const recommendations = gamification?.recommendations || [];
  const upcomingChallenges = gamification?.upcomingChallenges || [];
  const nudges = gamification?.nudges || [];
  const xpLedger = gamification?.xpLedger || [];
  const leaderboard = gamification?.leaderboard || [];
  const leaderboards = gamification?.leaderboards || [];
  const [selectedLeaderboardType, setSelectedLeaderboardType] = useState('overall');
  const [nickname, setNickname] = useState(identity?.nickname || '');
  const [selectedTitleSlug, setSelectedTitleSlug] = useState(identity?.selectedTitleSlug || '');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState(null);

  useEffect(() => {
    setNickname(identity?.nickname || '');
    setSelectedTitleSlug(identity?.selectedTitleSlug || '');
  }, [identity?.nickname, identity?.selectedTitleSlug]);

  if (!profile) {
    return (
      <Card className="overflow-hidden border-amber-300/25 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.94))]" padding="lg">
        <SectionHeader
          title="Tu ruta de progreso"
          subtitle="Aqui podras ver tu avance deportivo a medida que completes tus evaluaciones fisicas."
          icon={<FaTrophy />}
          actions={(
            <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
              <FaSyncAlt className="mr-2" />
              Actualizar
            </Button>
          )}
        />
        <EmptyState
          icon={<FaLayerGroup />}
          title="Aun no tienes progreso disponible"
          description="Necesitas al menos un test fisico para activar tu progreso y empezar a subir de nivel."
        />
      </Card>
    );
  }

  const progressPercent = clamp(Math.round(profile.progressPctToNextLevel || 0), 0, 100);
  const summary = profile.summary || {};
  const completedChallenges = challenges.filter((challenge) => challenge.isCompleted).length;
  const nextChallenge = getNextChallenge(challenges);
  const nextChallengePercent = nextChallenge?.targetValue
    ? clamp(Math.round((nextChallenge.progressValue / nextChallenge.targetValue) * 100), 0, 100)
    : 0;
  const topAchievements = achievements.slice(0, 3);
  const jumpDelta = Number(summary.jumpDelta || 0);
  const strengthDelta = Number(summary.strengthDelta || 0);
  const testsCount = Number(summary.testsCount || 0);
  const paymentsCount = Number(summary.totalPayments || 0);
  const hasActivePayment = Boolean(summary.hasActivePayment);
  const paymentStatusLabel = summary.latestPaymentStatus
    ? summary.latestPaymentStatus.replaceAll('_', ' ')
    : 'sin registro';
  const strengthTotal = Number(summary.strengthTotal || 0);
  const activeLeaderboard = leaderboards.find((entry) => entry.type === selectedLeaderboardType)
    || leaderboards.find((entry) => entry.type === 'overall')
    || (leaderboard.length > 0
      ? {
          type: 'overall',
          title: 'Progreso general',
          description: 'Ranking por experiencia total acumulada.',
          unit: 'XP',
          scoreLabel: 'Puntaje',
          currentStudentRank: leaderboard.find((entry) => entry.isCurrentStudent)?.rankPosition || null,
          totalParticipants: leaderboard.length,
          rows: leaderboard,
        }
      : null);
  const rankingPosition = activeLeaderboard?.currentStudentRank || leaderboard.find((entry) => entry.isCurrentStudent)?.rankPosition || null;
  const availableTitles = identity?.availableTitles || [];
  const unlockedTitles = availableTitles.filter((title) => title.isUnlocked);
  const currentTitle = identity?.equippedTitle || null;

  const handleSaveIdentity = async () => {
    if (!userId) return;
    setSavingIdentity(true);
    setIdentityMessage(null);
    try {
      const updatedGamification = await gamificationService.updateStudentIdentity({
        userId,
        nickname,
        selectedTitleSlug: selectedTitleSlug || null,
      });
      if (typeof onIdentityUpdated === 'function') {
        onIdentityUpdated(updatedGamification);
      }
      setIdentityMessage({ tone: 'success', text: 'Tu identidad competitiva se actualizo.' });
    } catch (error) {
      console.error('Error actualizando identidad competitiva:', error);
      setIdentityMessage({
        tone: 'warning',
        text: error?.message || 'No se pudo guardar tu apodo o titulo.',
      });
    } finally {
      setSavingIdentity(false);
    }
  };

  return (
    <Card className="overflow-hidden border-amber-300/25 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_26%),linear-gradient(180deg,_rgba(2,6,23,0.99),_rgba(15,23,42,0.96))]" padding="lg">
      <SectionHeader
        title="Tu ruta de progreso"
        subtitle="Revisa cuanto has avanzado, lo que te falta para subir de nivel y los retos que te acercan a tu siguiente meta."
        icon={<FaTrophy />}
        actions={(
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <FaSyncAlt className="mr-2" />
            Actualizar
          </Button>
        )}
      />

      <div className="grid gap-4 desktop:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-amber-300/30 bg-[linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(15,23,42,0.15)_45%,_rgba(34,197,94,0.14))] p-5 shadow-[0_22px_70px_-35px_rgba(245,158,11,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.12),_transparent_26%),radial-gradient(circle_at_85%_18%,_rgba(255,255,255,0.08),_transparent_20%)]" />
          <div className="relative flex flex-col gap-5 desktop:flex-row desktop:items-center desktop:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-100">
                <FaStar className="text-rv-gold" />
                Progreso activo
              </p>
              <h3 className="mt-4 text-3xl font-black text-white mobile:text-4xl">
                {profile.totalXp} XP acumulados
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="info">{identity?.displayName || 'Sin apodo'}</StatusBadge>
                {currentTitle?.name ? <StatusBadge tone="success">{currentTitle.name}</StatusBadge> : null}
              </div>
              <p className="mt-2 max-w-lg text-sm text-slate-100 mobile:text-base">
                {profile.xpToNextLevel > 0
                  ? `Te faltan ${profile.xpToNextLevel} XP para alcanzar ${profile.nextLevel}.`
                  : 'Ya alcanzaste el nivel mas alto disponible por ahora.'}
              </p>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100">
                    Avance al siguiente nivel
                  </span>
                  <span className="text-sm font-black text-white">{progressPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#f59e0b,_#facc15,_#34d399)] shadow-[0_0_18px_rgba(250,204,21,0.45)] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                  <span>{profile.currentLevelMinXp} XP</span>
                  <span>{profile.nextLevelMinXp ? `${profile.nextLevelMinXp} XP` : 'Tope actual'}</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <ProgressRing percent={progressPercent} level={profile.currentLevel} title={profile.levelTitle} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-1">
          <HighlightStat
            icon={<FaFire />}
            label="Racha activa"
            value={`${profile.activeStreak} mes${profile.activeStreak === 1 ? '' : 'es'}`}
            helper={`Tu mejor racha es de ${profile.longestStreak} mes${profile.longestStreak === 1 ? '' : 'es'}.`}
            tone={profile.activeStreak > 0 ? 'success' : 'warning'}
          />
          <HighlightStat
            icon={<FaCalendarCheck />}
            label="Racha habil"
            value={`${profile.summary?.weekdayAttendanceStreak || 0} dia${(profile.summary?.weekdayAttendanceStreak || 0) === 1 ? '' : 's'}`}
            helper="Cuenta tus dias habiles seguidos de entrenamiento."
            tone={(profile.summary?.weekdayAttendanceStreak || 0) > 0 ? 'success' : 'default'}
          />
          <HighlightStat
            icon={<FaFlagCheckered />}
            label="Retos superados"
            value={`${completedChallenges}/${challenges.length}`}
            helper={nextChallenge ? `Tu siguiente reto es: ${nextChallenge.title}` : 'Por ahora no tienes retos pendientes.'}
            tone={completedChallenges > 0 ? 'success' : 'default'}
          />
          <HighlightStat
            icon={<FaMedal />}
            label="Logros desbloqueados"
            value={`${achievements.length}`}
            helper={achievements.length > 0 ? `Ultimo logro: ${achievements[0].title}` : 'Completa evaluaciones para desbloquear logros.'}
          />
          <HighlightStat
            icon={<FaTrophy />}
            label="Posicion actual"
            value={rankingPosition ? `#${rankingPosition}` : 'Sin ranking'}
            helper={rankingPosition ? 'Estas dentro del ranking de tu categoria.' : 'El ranking aun se esta preparando.'}
          />
          <HighlightStat
            icon={<FaShieldAlt />}
            label="Mensualidad"
            value={hasActivePayment ? 'Activa' : 'Por revisar'}
            helper={hasActivePayment ? 'Tu cobertura vigente suma a tu progreso.' : 'Pon tu mensualidad al dia para seguir sumando.'}
            tone={hasActivePayment ? 'success' : 'warning'}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 desktop:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/15 bg-black/25" padding="sm">
          <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
            <FaShieldAlt className="text-rv-gold" />
            Siguiente objetivo
          </h3>

          {nextChallenge ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-black text-white">{nextChallenge.title}</p>
                  <StatusBadge tone={nextChallenge.isCompleted ? 'success' : 'info'}>
                    {nextChallenge.progressValue}/{nextChallenge.targetValue}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-100">{nextChallenge.description}</p>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-200">
                    <span>Avance del reto</span>
                    <span>{nextChallengePercent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-black/25">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#38bdf8,_#f59e0b)] transition-all duration-500"
                      style={{ width: `${nextChallengePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 mobile:grid-cols-2">
                <MiniInsight
                  icon={<FaChartLine />}
                  label="Salto con carrera"
                  value={`${jumpDelta > 0 ? '+' : ''}${jumpDelta} cm`}
                  helper="Comparado con tu linea base."
                />
                <MiniInsight
                  icon={<FaBolt />}
                  label="Mejora de fuerza"
                  value={`${strengthDelta > 0 ? '+' : ''}${strengthDelta} reps`}
                  helper="Tomando tu mejor avance acumulado."
                />
                <MiniInsight
                  icon={<FaFlagCheckered />}
                  label="Tests registrados"
                  value={`${testsCount}`}
                  helper="Cada evaluacion suma experiencia real."
                />
                <MiniInsight
                  icon={<FaFire />}
                  label="Este mes"
                  value={`${summary.currentMonthTests || 0} test${summary.currentMonthTests === 1 ? '' : 's'}`}
                  helper="Tus evaluaciones del mes actual."
                />
                <MiniInsight
                  icon={<FaShieldAlt />}
                  label="Mensualidades"
                  value={`${paymentsCount}`}
                  helper={`Estado actual: ${paymentStatusLabel}.`}
                />
                <MiniInsight
                  icon={<FaBolt />}
                  label="Fuerza total"
                  value={`${strengthTotal}`}
                  helper="Suma de tus pruebas de fuerza."
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-300">Por ahora no tienes retos pendientes. Sigue entrenando para desbloquear nuevos objetivos.</p>
          )}
        </Card>

        <Card className="border-white/15 bg-black/25" padding="sm">
          <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
            <FaMedal className="text-rv-gold" />
            Logros recientes
          </h3>
          {topAchievements.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {topAchievements.map((achievement, index) => (
                <div
                  key={achievement.achievementSlug}
                  className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,_rgba(245,158,11,0.16),_rgba(15,23,42,0.18)_55%,_rgba(34,197,94,0.12))] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">
                        Logro reciente #{index + 1}
                      </p>
                      <p className="mt-1 text-lg font-black text-white">{achievement.title}</p>
                    </div>
                    <StatusBadge tone="success">+{achievement.xpReward} XP</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">{achievement.description}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <FaChevronRight className="text-rv-gold" />
                    Lo desbloqueaste el {formatDate(achievement.earnedAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-300">Aun no desbloqueas logros. Tu primera evaluacion activara esta seccion.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <div className="grid gap-4 desktop:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.16),_rgba(15,23,42,0.18)_55%,_rgba(245,158,11,0.12))] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Tu identidad competitiva</p>
            <p className="mt-3 text-2xl font-black text-white">{identity?.displayName || 'Sin apodo todavia'}</p>
            <p className="mt-1 text-sm text-slate-300">Nombre real: {identity?.realName || 'Estudiante'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">{currentTitle?.name || 'Sin titulo equipado'}</StatusBadge>
              <StatusBadge tone="success">{unlockedTitles.length} titulos desbloqueados</StatusBadge>
            </div>
            <p className="mt-3 text-sm text-slate-200">
              {currentTitle?.description || 'Desbloquea logros, niveles y liderazgos para equipar titulos visibles en los rankings.'}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Personaliza tu perfil</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Apodo para rankings</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={24}
                  placeholder="Ej: Rayo Leo"
                  className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
                />
                <span className="text-xs text-slate-400">Entre 3 y 24 caracteres. Usa algo claro y reconocible.</span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Titulo visible</span>
                <select
                  value={selectedTitleSlug}
                  onChange={(event) => setSelectedTitleSlug(event.target.value)}
                  className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
                >
                  <option value="">Sin titulo</option>
                  {unlockedTitles.map((title) => (
                    <option key={title.slug} value={title.slug}>
                      {title.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">Solo puedes equipar titulos que ya hayas ganado.</span>
              </label>

              {identityMessage ? (
                <div className={`rounded-2xl border px-3 py-2 text-sm ${
                  identityMessage.tone === 'success'
                    ? 'border-emerald-300/35 bg-emerald-900/15 text-emerald-100'
                    : 'border-amber-300/35 bg-amber-900/15 text-amber-100'
                }`}>
                  {identityMessage.text}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Tu apodo y tu titulo apareceran en los rankings de competencia.</p>
                <Button variant="secondary" size="sm" onClick={handleSaveIdentity} disabled={savingIdentity || loading}>
                  <FaSyncAlt className={`mr-2 ${savingIdentity ? 'animate-spin' : ''}`} />
                  Guardar identidad
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaBolt className="text-rv-gold" />
          Impulso de hoy
        </h3>
        {nudges.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-3">
            {nudges.map((nudge) => (
              <div
                key={nudge.id}
                className={`rounded-2xl border p-4 ${
                  nudge.tone === 'success'
                    ? 'border-emerald-300/35 bg-emerald-900/15'
                    : nudge.tone === 'warning'
                      ? 'border-amber-300/35 bg-amber-900/15'
                      : 'border-cyan-300/30 bg-cyan-900/15'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200">{nudge.title}</p>
                <p className="mt-2 text-sm font-semibold text-white">{nudge.message}</p>
                <p className="mt-3 text-xs font-bold text-rv-gold">{nudge.cta}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Sigue entrenando. Cuando haya una oportunidad clara de avance, te la mostraremos aqui.</p>
        )}
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaBolt className="text-rv-gold" />
          Extracto de XP
        </h3>
        {xpLedger.length > 0 ? (
          <div className="mt-3 space-y-2">
            {xpLedger.slice(0, 12).map((entry) => (
              <div key={`${entry.id || entry.sourceRef || entry.occurredAt}-${entry.label}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{entry.label}</p>
                    <p className="mt-1 text-xs text-slate-300">{entry.description}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {formatDate(entry.occurredAt)}
                    </p>
                  </div>
                  <StatusBadge tone="success">+{entry.xpDelta} XP</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no hay movimientos de XP suficientes para mostrar un extracto detallado.</p>
        )}
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaRunning className="text-rv-gold" />
          Recomendaciones para tu siguiente marca
        </h3>
        {recommendations.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">{recommendation.focus}</p>
                    <p className="mt-1 text-lg font-black text-white">{recommendation.title}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-200">{recommendation.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Cuando tengamos suficiente contexto de tus medidas, aqui veras recomendaciones mas finas.</p>
        )}
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaLayerGroup className="text-rv-gold" />
          Logros por desbloquear
        </h3>
        {lockedAchievements.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {lockedAchievements.slice(0, 9).map((achievement) => (
              <div
                key={achievement.achievementSlug}
                className={`rounded-2xl border p-4 ${achievement.isHidden ? 'border-dashed border-fuchsia-300/30 bg-fuchsia-500/5' : 'border-white/10 bg-black/20'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                      {achievement.isHidden ? 'Sorpresa' : 'Bloqueado'}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{achievement.title}</p>
                  </div>
                  <StatusBadge tone="warning">+{achievement.xpReward} XP</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{achievement.description}</p>
                <p className="mt-3 text-xs font-semibold text-slate-300">{achievement.hint}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-300">
                    <span>Progreso</span>
                    <span>{achievement.progressValue}/{achievement.targetValue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${achievement.isHidden ? 'bg-gradient-to-r from-fuchsia-400 to-violet-500' : 'bg-gradient-to-r from-slate-300 to-rv-gold'}`}
                      style={{ width: `${Math.max(8, achievement.progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Ya desbloqueaste todos los logros disponibles por ahora.</p>
        )}
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaLockOpen className="text-rv-gold" />
          Lo que viene despues
        </h3>
        {upcomingChallenges.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {upcomingChallenges.map((challenge) => (
              <div key={challenge.slug} className="rounded-2xl border border-cyan-300/20 bg-cyan-950/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-black text-white">{challenge.title}</p>
                    <p className="mt-1 text-sm text-slate-200">{challenge.description}</p>
                  </div>
                  <StatusBadge tone="info">Meta: {challenge.targetValue}</StatusBadge>
                </div>
                <div className="mt-3 grid gap-2 mobile:grid-cols-2">
                  <MiniInsight
                    icon={<FaFlagCheckered />}
                    label="Meta actual"
                    value={`${challenge.currentProgressValue}/${challenge.currentTargetValue}`}
                    helper="Asi vas con el objetivo de este ciclo."
                  />
                  <MiniInsight
                    icon={<FaChevronRight />}
                    label="Siguiente ciclo"
                    value={`${challenge.targetValue}`}
                    helper={`Se abre desde ${challenge.startsOn}.`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Cuando cierres mas retos, aqui te mostraremos los del siguiente ciclo para que te anticipes.</p>
        )}
      </Card>

      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
            <FaTrophy className="text-rv-gold" />
            Rankings de tu categoria
          </h3>
          {rankingPosition ? (
            <StatusBadge tone="info">Tu posicion: #{rankingPosition}</StatusBadge>
          ) : null}
        </div>

        {leaderboards.length > 0 ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {leaderboards.map((board) => (
                <button
                  key={board.type}
                  type="button"
                  onClick={() => setSelectedLeaderboardType(board.type)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                    activeLeaderboard?.type === board.type
                      ? 'border-rv-gold bg-rv-gold/15 text-rv-gold'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-rv-gold/40 hover:text-white'
                  }`}
                >
                  {board.title}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{activeLeaderboard?.title}</p>
                  <p className="mt-1 max-w-2xl text-sm text-slate-300">{activeLeaderboard?.description}</p>
                </div>
                <div className="rounded-2xl border border-rv-gold/25 bg-rv-gold/10 px-3 py-2 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">Participantes</p>
                  <p className="mt-1 text-xl font-black text-white">{activeLeaderboard?.totalParticipants || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
              {(activeLeaderboard?.rows || []).map((entry) => (
              <div
                key={`${activeLeaderboard?.type}-${entry.studentId}-${entry.rankPosition}`}
                className={`rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${entry.isCurrentStudent ? 'border-rv-gold/55 bg-rv-gold/10 shadow-[0_16px_45px_-30px_rgba(245,158,11,0.65)]' : getLeaderboardTone(entry.rankPosition)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                      Puesto #{entry.rankPosition}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{entry.publicAlias}</p>
                    {entry.equippedTitle?.name ? (
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                        {entry.equippedTitle.name}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-300">
                      {entry.rankPosition === 1
                        ? `${entry.publicAlias} lidera esta tabla con ${entry.score} ${entry.unit}.`
                        : `${entry.publicAlias} compite con ${entry.score} ${entry.unit}.`}
                    </p>
                  </div>
                  {entry.isCurrentStudent ? <StatusBadge tone="success">Tu</StatusBadge> : null}
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-300">Nivel</p>
                    <p className="text-2xl font-black text-white">{entry.currentLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-300">{entry.scoreLabel}</p>
                    <p className="text-xl font-black text-rv-gold">
                      {entry.score} {entry.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no hay suficientes datos para mostrar el ranking de tu categoria.</p>
        )}
      </Card>
    </Card>
  );
};

const MiniInsight = ({ icon, label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
    <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
      <span className="text-rv-gold">{icon}</span>
      {label}
    </p>
    <p className="mt-2 text-xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{helper}</p>
  </div>
);

MiniInsight.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
};

StudentGamificationPanel.propTypes = {
  gamification: PropTypes.shape({
    profile: PropTypes.shape({
      currentLevel: PropTypes.number,
      levelTitle: PropTypes.string,
      currentLevelMinXp: PropTypes.number,
      nextLevelMinXp: PropTypes.number,
      totalXp: PropTypes.number,
      xpToNextLevel: PropTypes.number,
      nextLevel: PropTypes.string,
      activeStreak: PropTypes.number,
      longestStreak: PropTypes.number,
      lastTestDate: PropTypes.string,
      progressPctToNextLevel: PropTypes.number,
      summary: PropTypes.object,
    }),
    identity: PropTypes.shape({
      nickname: PropTypes.string,
      displayName: PropTypes.string,
      realName: PropTypes.string,
      selectedTitleSlug: PropTypes.string,
      equippedTitle: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
      availableTitles: PropTypes.array,
    }),
    achievements: PropTypes.array,
    lockedAchievements: PropTypes.array,
    challenges: PropTypes.array,
    recommendations: PropTypes.array,
    upcomingChallenges: PropTypes.array,
    nudges: PropTypes.array,
    xpLedger: PropTypes.array,
    leaderboard: PropTypes.array,
    leaderboards: PropTypes.array,
  }),
  userId: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onIdentityUpdated: PropTypes.func,
  loading: PropTypes.bool,
};

export default StudentGamificationPanel;
