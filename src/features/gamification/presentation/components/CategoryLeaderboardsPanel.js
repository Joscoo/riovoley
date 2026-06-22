import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBolt,
  FaCalendarCheck,
  FaChevronRight,
  FaCreditCard,
  FaMedal,
  FaRunning,
  FaTrophy,
} from 'react-icons/fa';
import { gamificationService } from '../../gamificationService';
import { Button, Card, EmptyState, SectionHeader } from '../../../../shared/ui';
import IdentityPortrait from './IdentityPortrait';

const FEATURED_TYPES = ['overall', 'jump_approach', 'attendance_total', 'payments_total'];

const getLeaderboardCardTone = (position, isCurrentStudent) => {
  if (isCurrentStudent && position === 1) {
    return 'border-rv-gold/60 bg-[linear-gradient(135deg,_rgba(245,158,11,0.18),_rgba(120,53,15,0.18)_55%,_rgba(15,23,42,0.7))] shadow-[0_20px_50px_-26px_rgba(245,158,11,0.75)]';
  }
  if (isCurrentStudent) {
    return 'border-rv-gold/55 bg-rv-gold/10 shadow-[0_16px_45px_-30px_rgba(245,158,11,0.65)]';
  }
  if (position === 1) {
    return 'border-amber-300/55 bg-[linear-gradient(135deg,_rgba(245,158,11,0.18),_rgba(120,53,15,0.16)_55%,_rgba(15,23,42,0.72))] shadow-[0_18px_48px_-28px_rgba(245,158,11,0.65)]';
  }
  if (position === 2) {
    return 'border-slate-200/45 bg-[linear-gradient(135deg,_rgba(226,232,240,0.12),_rgba(71,85,105,0.18)_55%,_rgba(15,23,42,0.72))] shadow-[0_18px_48px_-30px_rgba(148,163,184,0.45)]';
  }
  if (position === 3) {
    return 'border-orange-300/50 bg-[linear-gradient(135deg,_rgba(251,146,60,0.16),_rgba(154,52,18,0.18)_55%,_rgba(15,23,42,0.72))] shadow-[0_18px_48px_-30px_rgba(251,146,60,0.42)]';
  }
  return 'border-white/10 bg-black/20';
};

const getPlacementLabel = (position) => {
  if (position === 1) return 'Lider';
  if (position === 2) return 'Perseguidor';
  if (position === 3) return 'Podio';
  return `Puesto #${position}`;
};

const buildCompetitiveSummary = ({ row, leader, rival, currentStudentEntry, activeLeaderboard }) => {
  if (!row) return '';
  const unit = activeLeaderboard?.unit || '';
  if (row.rankPosition === 1) {
    const secondPlace = rival && rival.studentId !== row.studentId ? rival : null;
    if (secondPlace) {
      const margin = Math.max(Number(row.score || 0) - Number(secondPlace.score || 0), 0);
      return `${row.publicAlias} sostiene ${formatScore(margin, unit)} de ventaja sobre ${secondPlace.publicAlias}.`;
    }
    return `${row.publicAlias} tiene la mejor marca actual en ${activeLeaderboard?.title?.toLowerCase() || 'esta tabla'}.`;
  }

  if (row.isCurrentStudent && rival && rival.studentId !== row.studentId) {
    const gap = Math.max(Number(rival.score || 0) - Number(row.score || 0), 0);
    return `Te faltan ${formatScore(gap, unit)} para quitarle el puesto #${rival.rankPosition} a ${rival.publicAlias}.`;
  }

  if (leader) {
    const gapToLeader = Math.max(Number(leader.score || 0) - Number(row.score || 0), 0);
    return `${row.publicAlias} esta a ${formatScore(gapToLeader, unit)} del lider.`;
  }

  return `${row.publicAlias} compite en ${activeLeaderboard?.title?.toLowerCase() || 'esta tabla'}.`;
};

const formatScore = (score, unit) => {
  if (score == null) return '--';
  if (Number.isInteger(Number(score))) {
    return `${Number(score)}${unit ? ` ${unit}` : ''}`;
  }

  return `${Number(score).toFixed(1)}${unit ? ` ${unit}` : ''}`;
};

const defaultSummaryText = (board) => {
  const leader = board?.rows?.[0];
  if (!leader) {
    return 'Todavia no hay suficientes registros en esta categoria.';
  }

  return `${leader.publicAlias} lidera con ${formatScore(leader.score, board.unit)}.`;
};

const CategoryLeaderboardsPanel = ({
  categories,
  title = 'Competencia por categoria',
  subtitle = 'Revisa quien lidera cada medicion y donde esta el nivel a superar.',
  limit = 5,
}) => {
  const availableCategories = (categories || []).filter((category) => Number(category.total || 0) > 0);
  const [selectedCategory, setSelectedCategory] = useState(availableCategories[0]?.code || '');
  const [selectedBoardType, setSelectedBoardType] = useState('overall');
  const [leaderboards, setLeaderboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!availableCategories.length) {
      setSelectedCategory('');
      return;
    }

    if (!availableCategories.some((category) => category.code === selectedCategory)) {
      setSelectedCategory(availableCategories[0].code);
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      setLeaderboards([]);
      return;
    }

    let isMounted = true;

    const loadLeaderboards = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await gamificationService.listCategoryLeaderboards({
          category: selectedCategory,
          limit,
        });

        if (!isMounted) return;
        setLeaderboards(result || []);
      } catch (loadError) {
        if (!isMounted) return;
        console.error('Error cargando leaderboards por categoria:', loadError);
        setError('No se pudo cargar la competencia de esta categoria.');
        setLeaderboards([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeaderboards();

    return () => {
      isMounted = false;
    };
  }, [limit, selectedCategory]);

  const activeCategory = availableCategories.find((category) => category.code === selectedCategory) || null;
  const activeLeaderboard = leaderboards.find((board) => board.type === selectedBoardType)
    || leaderboards.find((board) => board.type === 'overall')
    || leaderboards[0]
    || null;
  const featuredBoards = FEATURED_TYPES
    .map((type) => leaderboards.find((board) => board.type === type))
    .filter((board) => board?.rows?.length);
  const currentStudentEntry = activeLeaderboard?.rows?.find((row) => row.isCurrentStudent) || null;
  const rivalEntry = currentStudentEntry
    ? activeLeaderboard?.rows?.find((row) => row.rankPosition === Math.max(currentStudentEntry.rankPosition - 1, 1))
    : activeLeaderboard?.rows?.[1] || null;
  const rivalGap = currentStudentEntry && rivalEntry && rivalEntry.studentId !== currentStudentEntry.studentId
    ? Math.max(Number(rivalEntry.score || 0) - Number(currentStudentEntry.score || 0), 0)
    : 0;

  return (
    <Card className="overflow-hidden border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95))]" padding="lg">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={<FaTrophy />}
        actions={(
          <Button variant="secondary" size="sm" onClick={() => setSelectedCategory((current) => current)}>
            <FaBolt className="mr-2" />
            Ranking en vivo
          </Button>
        )}
      />

      {!availableCategories.length ? (
        <EmptyState
          icon={<FaRunning />}
          title="Aun no hay categorias con actividad"
          description="Los rankings apareceran cuando existan estudiantes con tests, asistencias o mensualidades registradas."
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-4">
            {availableCategories.map((category) => (
              <button
                key={category.code}
                type="button"
                onClick={() => setSelectedCategory(category.code)}
                className={`rounded-3xl border px-4 py-3 text-left transition ${
                  category.code === selectedCategory
                    ? 'border-rv-gold/60 bg-rv-gold/20 text-white shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <span className="block text-sm font-black uppercase tracking-[0.12em]">{category.label}</span>
                <span className="mt-1 block text-sm text-slate-300">{category.total} atletas con actividad</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 desktop:grid-cols-4">
            {(featuredBoards.length ? featuredBoards : leaderboards.slice(0, 4)).map((board) => {
              const leader = board.rows?.[0];
              const icon = board.type === 'attendance_total'
                ? <FaCalendarCheck />
                : board.type === 'payments_total'
                  ? <FaCreditCard />
                  : <FaMedal />;

              return (
                <div key={board.type} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                    <span className="text-rv-gold">{icon}</span>
                    {board.title}
                  </p>
                  <div className="mt-3">
                    <IdentityPortrait
                      imageUrl={leader?.profileImageUrl || leader?.avatarUrl}
                      displayName={leader?.publicAlias}
                      equipment={leader?.cosmeticEquipment}
                      equippedItems={leader?.equippedCosmeticItems}
                      size="sm"
                      showBadgeLabel
                    />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">
                    {leader ? leader.publicAlias : 'Sin marca'}
                  </p>
                  {leader?.equippedTitle?.name ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                      {leader.equippedTitle.name}
                    </p>
                  ) : null}
                  {leader?.avatarModelName ? (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                      {leader.avatarModelName}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-rv-gold">
                    {leader ? formatScore(leader.score, board.unit) : 'Aun sin registros'}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {defaultSummaryText(board)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4 mobile:p-5">
            <div className="flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-200">
                  Categoria activa
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {activeCategory?.label || 'Categoria'}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  {activeLeaderboard?.description || 'Consulta la marca actual a superar dentro de esta categoria.'}
                </p>
              </div>
              <div className="rounded-2xl border border-rv-gold/25 bg-rv-gold/10 px-4 py-3 text-sm text-slate-100">
                <span className="font-bold text-white">
                  {activeLeaderboard?.rows?.[0]?.publicAlias || 'Sin lider todavia'}
                </span>
                <span className="mx-2 text-rv-gold">
                  <FaChevronRight className="inline" />
                </span>
                <span>{activeLeaderboard ? formatScore(activeLeaderboard.rows?.[0]?.score, activeLeaderboard.unit) : 'Sin marca'}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {leaderboards.map((board) => (
                <button
                  key={board.type}
                  type="button"
                  onClick={() => setSelectedBoardType(board.type)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] transition ${
                    board.type === activeLeaderboard?.type
                      ? 'border-cyan-300/50 bg-cyan-400/15 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {board.title}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 desktop:grid-cols-2">
              <div className="rounded-3xl border border-rv-gold/25 bg-[linear-gradient(135deg,_rgba(245,158,11,0.14),_rgba(15,23,42,0.3)_58%,_rgba(249,115,22,0.14))] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-100">Marca lider</p>
                <p className="mt-2 text-lg font-black text-white">
                  {activeLeaderboard?.rows?.[0]?.publicAlias || 'Sin lider todavia'}
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {activeLeaderboard?.rows?.[0]
                    ? `${formatScore(activeLeaderboard.rows[0].score, activeLeaderboard.unit)} es la referencia actual en esta tabla.`
                    : 'Esta medicion todavia no tiene una referencia registrada.'}
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-300/25 bg-[linear-gradient(135deg,_rgba(34,211,238,0.14),_rgba(15,23,42,0.34)_58%,_rgba(14,165,233,0.1))] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Presion competitiva</p>
                <p className="mt-2 text-lg font-black text-white">
                  {rivalEntry?.publicAlias || 'Todavia sin rival directo'}
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {currentStudentEntry && rivalEntry && rivalEntry.studentId !== currentStudentEntry.studentId
                    ? `Al estudiante actual le faltan ${formatScore(rivalGap, activeLeaderboard?.unit)} para alcanzarlo.`
                    : 'Cuando haya mas participantes, aqui se mostrara el rival inmediato a superar.'}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex min-h-[180px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
                </div>
              ) : error ? (
                <EmptyState
                  icon={<FaTrophy />}
                  title="No se pudo cargar el ranking"
                  description={error}
                />
              ) : !activeLeaderboard?.rows?.length ? (
                <EmptyState
                  icon={<FaTrophy />}
                  title="Todavia no hay competencia visible"
                  description="Esta tabla aparecera cuando existan registros suficientes para esa medicion."
                />
              ) : (
                <div className="space-y-3">
                  {activeLeaderboard.rows.map((row) => (
                    <div
                      key={`${activeLeaderboard.type}-${row.studentId}`}
                      className={`rounded-2xl border px-4 py-4 ${getLeaderboardCardTone(row.rankPosition, row.isCurrentStudent)}`}
                    >
                      <div className="flex flex-col gap-3 mobile:flex-row mobile:items-center mobile:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <IdentityPortrait
                            imageUrl={row.profileImageUrl || row.avatarUrl}
                            displayName={row.publicAlias}
                            equipment={row.cosmeticEquipment}
                            equippedItems={row.equippedCosmeticItems}
                            size="sm"
                            showBadgeLabel
                          />
                          <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                            {getPlacementLabel(row.rankPosition)}
                          </p>
                          <p className="mt-1 truncate text-lg font-black text-white">
                            {row.publicAlias}
                          </p>
                          {row.equippedTitle?.name ? (
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                              {row.equippedTitle.name}
                            </p>
                          ) : null}
                          {row.avatarModelName ? (
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                              {row.avatarModelName}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {buildCompetitiveSummary({
                              row,
                              leader: activeLeaderboard.rows?.[0] || null,
                              rival: rivalEntry,
                              currentStudentEntry,
                              activeLeaderboard,
                            })}
                          </p>
                        </div>
                        </div>
                        <div className="shrink-0 text-left mobile:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                            {activeLeaderboard.scoreLabel}
                          </p>
                          <p className="mt-1 text-2xl font-black text-rv-gold">
                            {formatScore(row.score, activeLeaderboard.unit)}
                          </p>
                          <p className="mt-1 text-xs text-slate-300">
                            Nivel {row.currentLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

CategoryLeaderboardsPanel.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    total: PropTypes.number,
  })),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  limit: PropTypes.number,
};

export default CategoryLeaderboardsPanel;
