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

const FEATURED_TYPES = ['overall', 'jump_approach', 'attendance_total', 'payments_total'];

const getLeaderboardTone = (position) => {
  if (position === 1) return 'border-amber-300/40 bg-amber-500/10';
  if (position === 2) return 'border-slate-300/30 bg-slate-400/10';
  if (position === 3) return 'border-orange-300/30 bg-orange-500/10';
  return 'border-white/10 bg-black/20';
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
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <button
                key={category.code}
                type="button"
                onClick={() => setSelectedCategory(category.code)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  category.code === selectedCategory
                    ? 'border-rv-gold/60 bg-rv-gold/20 text-white shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                {category.label}
                <span className="ml-2 text-xs text-slate-300">{category.total}</span>
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
                  <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                    <span className="text-rv-gold">{icon}</span>
                    {board.title}
                  </p>
                  {leader?.avatarUrl ? (
                    <div className="mt-3 h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-1">
                      <img src={leader.avatarUrl} alt={`Avatar de ${leader.publicAlias}`} className="h-full w-full rounded-xl object-cover" />
                    </div>
                  ) : null}
                  <p className="mt-3 text-lg font-black text-white">
                    {leader ? leader.publicAlias : 'Sin marca'}
                  </p>
                  {leader?.equippedTitle?.name ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                      {leader.equippedTitle.name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-rv-gold">
                    {leader ? formatScore(leader.score, board.unit) : 'Aun sin registros'}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    {defaultSummaryText(board)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4 mobile:p-5">
            <div className="flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
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
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                    board.type === activeLeaderboard?.type
                      ? 'border-cyan-300/50 bg-cyan-400/15 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {board.title}
                </button>
              ))}
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
                      className={`rounded-2xl border px-4 py-4 ${getLeaderboardTone(row.rankPosition)}`}
                    >
                      <div className="flex flex-col gap-3 mobile:flex-row mobile:items-center mobile:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          {row.avatarUrl ? (
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-1">
                              <img src={row.avatarUrl} alt={`Avatar de ${row.publicAlias}`} className="h-full w-full rounded-xl object-cover" />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                            Puesto #{row.rankPosition}
                          </p>
                          <p className="mt-1 truncate text-lg font-black text-white">
                            {row.publicAlias}
                          </p>
                          {row.equippedTitle?.name ? (
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                              {row.equippedTitle.name}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm text-slate-300">
                            {row.rankPosition === 1
                              ? `${row.publicAlias} tiene la mejor marca actual en ${activeLeaderboard.title.toLowerCase()}.`
                              : `Necesita ${formatScore((activeLeaderboard.rows?.[0]?.score || 0) - row.score, activeLeaderboard.unit)} para alcanzar al lider.`}
                          </p>
                        </div>
                        </div>
                        <div className="shrink-0 text-left mobile:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
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
