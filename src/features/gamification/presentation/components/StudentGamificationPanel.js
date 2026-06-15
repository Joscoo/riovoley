import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBolt,
  FaCoins,
  FaCalendarCheck,
  FaChartLine,
  FaChevronRight,
  FaFire,
  FaFlagCheckered,
  FaLockOpen,
  FaLayerGroup,
  FaMedal,
  FaImage,
  FaRunning,
  FaShieldAlt,
  FaStar,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import { gamificationService } from '../../gamificationService';
import { getAvatarStyleMeta } from '../../domain/avatarCatalog';
import { buildAvatarUrl } from '../../domain/buildAvatarUrl';
import { Button, Card, EmptyState, SectionHeader, StatusBadge } from '../../../../shared/ui';
import IdentityPortrait from './IdentityPortrait';

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

const buildCompetitiveChaseText = ({ entry, leader, rival, currentStudentEntry, unit }) => {
  if (!entry) return '';
  if (entry.rankPosition === 1) {
    const secondPlace = rival && rival.studentId !== entry.studentId ? rival : null;
    if (secondPlace) {
      const margin = Math.max(Number(entry.score || 0) - Number(secondPlace.score || 0), 0);
      return `${entry.publicAlias} lidera esta tabla y defiende ${margin} ${unit} sobre ${secondPlace.publicAlias}.`;
    }
    return `${entry.publicAlias} lidera esta tabla con ${entry.score} ${unit}.`;
  }

  if (entry.isCurrentStudent && rival && rival.studentId !== entry.studentId) {
    const gap = Math.max(Number(rival.score || 0) - Number(entry.score || 0), 0);
    return `Te faltan ${gap} ${unit} para superar a ${rival.publicAlias} y tomar el puesto #${rival.rankPosition}.`;
  }

  if (leader) {
    const gapToLeader = Math.max(Number(leader.score || 0) - Number(entry.score || 0), 0);
    return `${entry.publicAlias} esta a ${gapToLeader} ${unit} del lider actual.`;
  }

  return `${entry.publicAlias} compite con ${entry.score} ${unit}.`;
};

const COSMETIC_SLOT_LABELS = {
  frame: 'Marco',
  background: 'Fondo',
  badge: 'Insignia',
  effect: 'Efecto',
};

const COSMETIC_CATEGORY_FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'frame', label: 'Marcos' },
  { id: 'background', label: 'Fondos' },
  { id: 'badge', label: 'Insignias' },
  { id: 'effect', label: 'Efectos' },
];

const COSMETIC_PHOTO_FILTERS = [
  { id: 'all', label: 'Toda la foto' },
  { id: 'direct', label: 'Sobre la foto' },
  { id: 'surround', label: 'Alrededor de la foto' },
];

const COSMETIC_SORT_OPTIONS = [
  { id: 'featured', label: 'Destacados' },
  { id: 'rarity-desc', label: 'Rareza: alta a baja' },
  { id: 'rarity-asc', label: 'Rareza: baja a alta' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
];

const PANEL_TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'identity', label: 'Identidad' },
  { id: 'goals', label: 'Metas' },
  { id: 'competition', label: 'Competencia' },
];

const IDENTITY_TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'collection', label: 'Coleccion' },
  { id: 'store', label: 'Tienda' },
];

const GOALS_TABS = [
  { id: 'xp', label: 'XP y ritmo' },
  { id: 'achievements', label: 'Logros' },
  { id: 'challenges', label: 'Retos' },
];

const COMPETITION_FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'general', label: 'General' },
  { id: 'physical', label: 'Fisico' },
  { id: 'attendance', label: 'Asistencia' },
  { id: 'payments', label: 'Pagos' },
];

const PHYSICAL_LEADERBOARD_TYPES = new Set([
  'jump_approach',
  'jump_static',
  'jump_long',
  'strength_total',
  'reach_standing',
  'wingspan',
  'abs_total',
  'pushups_total',
  'squats_total',
  'pullups_total',
]);

const ATTENDANCE_LEADERBOARD_TYPES = new Set([
  'attendance_total',
  'attendance_month',
]);

const PAYMENT_LEADERBOARD_TYPES = new Set([
  'payments_total',
]);

const getCompetitionFilterForBoard = (type) => {
  if (type === 'overall') return 'general';
  if (PHYSICAL_LEADERBOARD_TYPES.has(type)) return 'physical';
  if (ATTENDANCE_LEADERBOARD_TYPES.has(type)) return 'attendance';
  if (PAYMENT_LEADERBOARD_TYPES.has(type)) return 'payments';
  return 'all';
};

const PANEL_PAGE_SIZE = 6;

const paginateItems = (items, currentPage, pageSize = PANEL_PAGE_SIZE) => {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(safeItems.length / pageSize));
  const page = clamp(currentPage || 1, 1, totalPages);
  const startIndex = (page - 1) * pageSize;
  return {
    page,
    totalPages,
    items: safeItems.slice(startIndex, startIndex + pageSize),
  };
};

const buildStorageKey = (userId, suffix) => `rv-gamification-${userId || 'guest'}-${suffix}`;

const readStoredValue = (userId, suffix, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(buildStorageKey(userId, suffix)) || fallback;
  } catch {
    return fallback;
  }
};

const writeStoredValue = (userId, suffix, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(buildStorageKey(userId, suffix), value);
  } catch {
    // no-op
  }
};

const getCosmeticPhotoNotice = (category, profileImageMode) => {
  if (profileImageMode !== 'photo') {
    return null;
  }

  switch (category) {
    case 'frame':
      return 'Con foto, este cosmetico cambia el borde visible de tu foto.';
    case 'badge':
      return 'Con foto, este cosmetico agrega una insignia sobre tu foto.';
    case 'background':
      return 'Con foto, este cosmetico no cambia la foto en si; se nota detras de ella y en tu tarjeta competitiva.';
    case 'effect':
      return 'Con foto, este cosmetico no cambia la foto en si; se nota alrededor de ella y en rankings.';
    default:
      return null;
  }
};

const getCosmeticPhotoImpactTone = (photoFocus) => {
  if (photoFocus === 'direct') {
    return 'success';
  }
  if (photoFocus === 'surround') {
    return 'info';
  }
  return 'warning';
};

const compareStoreCosmetics = (left, right, sortOrder) => {
  switch (sortOrder) {
    case 'rarity-desc':
      if (left.rarityRank !== right.rarityRank) return right.rarityRank - left.rarityRank;
      if (left.priceCoins !== right.priceCoins) return right.priceCoins - left.priceCoins;
      return left.name.localeCompare(right.name, 'es');
    case 'rarity-asc':
      if (left.rarityRank !== right.rarityRank) return left.rarityRank - right.rarityRank;
      if (left.priceCoins !== right.priceCoins) return left.priceCoins - right.priceCoins;
      return left.name.localeCompare(right.name, 'es');
    case 'price-desc':
      if (left.priceCoins !== right.priceCoins) return right.priceCoins - left.priceCoins;
      if (left.rarityRank !== right.rarityRank) return right.rarityRank - left.rarityRank;
      return left.name.localeCompare(right.name, 'es');
    case 'price-asc':
      if (left.priceCoins !== right.priceCoins) return left.priceCoins - right.priceCoins;
      if (left.rarityRank !== right.rarityRank) return right.rarityRank - left.rarityRank;
      return left.name.localeCompare(right.name, 'es');
    default:
      if (left.isOwned !== right.isOwned) return left.isOwned ? -1 : 1;
      if (left.isEquipped !== right.isEquipped) return left.isEquipped ? -1 : 1;
      if (left.isLocked !== right.isLocked) return left.isLocked ? 1 : -1;
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      if (left.rarityRank !== right.rarityRank) return right.rarityRank - left.rarityRank;
      if (left.priceCoins !== right.priceCoins) return left.priceCoins - right.priceCoins;
      return left.name.localeCompare(right.name, 'es');
  }
};

const recalculateStoreAffordability = (items, nextBalance) =>
  (items || []).map((entry) => ({
    ...entry,
    canAfford: Number(nextBalance || 0) >= Number(entry.priceCoins || 0),
    canPurchase: !entry.isOwned && entry.isUnlocked && Number(nextBalance || 0) >= Number(entry.priceCoins || 0),
  }));

const patchLeaderboardEquipmentRows = (rows, nextEquipment) =>
  (rows || []).map((entry) => (
    entry.isCurrentStudent
      ? {
          ...entry,
          cosmeticEquipment: {
            ...(entry.cosmeticEquipment || {}),
            ...nextEquipment,
          },
        }
      : entry
  ));

const normalizeGamificationError = (error) => {
  const rawMessage = error?.message || '';

  switch (rawMessage) {
    case 'item_not_owned':
      return {
        text: 'Ese cosmetico ya no esta en tu inventario. Recargamos tu coleccion para sincronizarla.',
        shouldRefresh: true,
      };
    case 'item_already_owned':
      return {
        text: 'Ese cosmetico ya figura en tu coleccion. Recargamos tu panel para sincronizarlo.',
        shouldRefresh: true,
      };
    case 'insufficient_coins':
      return {
        text: 'No tienes monedas suficientes para completar esa compra.',
        shouldRefresh: false,
      };
    case 'item_not_found':
      return {
        text: 'Ese cosmetico ya no esta disponible en el catalogo.',
        shouldRefresh: true,
      };
    case 'Debes subir una foto antes de usarla como imagen de perfil.':
      return {
        text: 'Primero sube una foto para poder usarla como imagen principal.',
        shouldRefresh: false,
      };
    default:
      return {
        text: rawMessage || 'No se pudo completar la accion cosmetica.',
        shouldRefresh: false,
      };
  }
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

const PaginationControls = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Pagina {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};

PaginationControls.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

const StudentGamificationPanel = ({ gamification, userId, onRefresh, onIdentityUpdated, loading = false }) => {
  const profile = gamification?.profile;
  const identity = gamification?.identity || null;
  const achievements = gamification?.achievements || [];
  const lockedAchievements = gamification?.lockedAchievements || [];
  const secretAchievements = gamification?.secretAchievements || [];
  const discoveredHiddenRewards = gamification?.discoveredHiddenRewards || [];
  const hiddenRewardHints = gamification?.hiddenRewardHints || [];
  const surpriseChains = gamification?.surpriseChains || [];
  const challenges = gamification?.challenges || [];
  const campaigns = gamification?.campaigns || [];
  const recommendations = gamification?.recommendations || [];
  const strategicRoutes = gamification?.strategicRoutes || [];
  const upcomingChallenges = gamification?.upcomingChallenges || [];
  const nudges = gamification?.nudges || [];
  const xpLedger = gamification?.xpLedger || [];
  const currency = gamification?.currency || { balance: 0, totalEarned: 0, totalSpent: 0, ledger: [] };
  const cosmetics = gamification?.cosmetics || { items: [], equipment: {}, inventoryCount: 0 };
  const leaderboard = gamification?.leaderboard || [];
  const leaderboards = gamification?.leaderboards || [];
  const [selectedLeaderboardType, setSelectedLeaderboardType] = useState(() => readStoredValue(userId, 'leaderboard', 'overall'));
  const [selectedPanelTab, setSelectedPanelTab] = useState(() => readStoredValue(userId, 'panel-tab', 'summary'));
  const [selectedIdentityTab, setSelectedIdentityTab] = useState(() => readStoredValue(userId, 'identity-tab', 'profile'));
  const [selectedGoalsTab, setSelectedGoalsTab] = useState(() => readStoredValue(userId, 'goals-tab', 'xp'));
  const [selectedCompetitionFilter, setSelectedCompetitionFilter] = useState(() => readStoredValue(userId, 'competition-filter', 'all'));
  const [selectedStoreCategoryFilter, setSelectedStoreCategoryFilter] = useState(() => readStoredValue(userId, 'store-category-filter', 'all'));
  const [selectedStorePhotoFilter, setSelectedStorePhotoFilter] = useState(() => readStoredValue(userId, 'store-photo-filter', 'all'));
  const [selectedStoreSort, setSelectedStoreSort] = useState(() => readStoredValue(userId, 'store-sort', 'featured'));
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [sectionPages, setSectionPages] = useState({
    nudges: 1,
    xpLedger: 1,
    currencyLedger: 1,
    recommendations: 1,
    earnedAchievements: 1,
    secretAchievements: 1,
    discoveredHiddenRewards: 1,
    hiddenRewardHints: 1,
    surpriseChains: 1,
    lockedAchievements: 1,
    campaigns: 1,
    upcomingChallenges: 1,
    ownedCosmetics: 1,
    storeCosmetics: 1,
    leaderboard: 1,
  });
  const [nickname, setNickname] = useState(identity?.nickname || '');
  const [selectedTitleSlug, setSelectedTitleSlug] = useState(identity?.selectedTitleSlug || '');
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState(identity?.avatarStyle || 'adventurer-neutral');
  const [selectedAvatarModelSlug, setSelectedAvatarModelSlug] = useState(identity?.avatarModelSlug || '');
  const [selectedProfileImageMode, setSelectedProfileImageMode] = useState(identity?.profileImageMode || 'avatar');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState(identity?.profilePhotoUrl || '');
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [previewItemSlug, setPreviewItemSlug] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState(null);
  const [cosmeticMessage, setCosmeticMessage] = useState(null);
  const [cosmeticActionSlug, setCosmeticActionSlug] = useState('');
  const photoInputRef = useRef(null);
  const storeCosmetics = cosmetics.items || [];
  const storeCosmeticsBySlug = Object.fromEntries(storeCosmetics.map((item) => [item.slug, item]));

  useEffect(() => {
    setNickname(identity?.nickname || '');
    setSelectedTitleSlug(identity?.selectedTitleSlug || '');
    setSelectedAvatarStyle(identity?.avatarStyle || 'adventurer-neutral');
    setSelectedAvatarModelSlug(identity?.avatarModelSlug || '');
    setSelectedProfileImageMode(identity?.profileImageMode || 'avatar');
    setProfilePhotoFile(null);
    setProfilePhotoPreviewUrl(identity?.profilePhotoUrl || '');
    setRemoveProfilePhoto(false);
    setPreviewItemSlug('');
  }, [identity?.nickname, identity?.selectedTitleSlug, identity?.avatarStyle, identity?.avatarModelSlug, identity?.profileImageMode, identity?.profilePhotoUrl]);

  useEffect(() => () => {
    if (profilePhotoPreviewUrl && profilePhotoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }
  }, [profilePhotoPreviewUrl]);

  useEffect(() => {
    const styleMeta = getAvatarStyleMeta(selectedAvatarStyle || identity?.avatarStyle || 'adventurer-neutral');
    const allowedModels = styleMeta.models.map((model) => model.slug);

    if (!allowedModels.includes(selectedAvatarModelSlug)) {
      const fallbackModel = styleMeta.models.find((model) => model.isBase) || styleMeta.models[0];
      setSelectedAvatarModelSlug(fallbackModel?.slug || '');
    }
  }, [selectedAvatarStyle, selectedAvatarModelSlug, identity?.avatarStyle]);

  useEffect(() => {
    writeStoredValue(userId, 'panel-tab', selectedPanelTab);
  }, [selectedPanelTab, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'identity-tab', selectedIdentityTab);
  }, [selectedIdentityTab, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'goals-tab', selectedGoalsTab);
  }, [selectedGoalsTab, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'competition-filter', selectedCompetitionFilter);
  }, [selectedCompetitionFilter, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'store-category-filter', selectedStoreCategoryFilter);
  }, [selectedStoreCategoryFilter, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'store-photo-filter', selectedStorePhotoFilter);
  }, [selectedStorePhotoFilter, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'store-sort', selectedStoreSort);
  }, [selectedStoreSort, userId]);

  useEffect(() => {
    writeStoredValue(userId, 'leaderboard', selectedLeaderboardType);
  }, [selectedLeaderboardType, userId]);

  useEffect(() => {
    setSectionPage('storeCosmetics', 1);
  }, [selectedStoreCategoryFilter, selectedStorePhotoFilter, selectedStoreSort]);

  const setSectionPage = (section, page) => {
    setSectionPages((current) => ({
      ...current,
      [section]: page,
    }));
  };

  const filteredLeaderboards = selectedCompetitionFilter === 'all'
    ? leaderboards
    : leaderboards.filter((board) => getCompetitionFilterForBoard(board.type) === selectedCompetitionFilter);

  useEffect(() => {
    if (filteredLeaderboards.length === 0) {
      if (selectedLeaderboardType !== 'overall') {
        setSelectedLeaderboardType('overall');
      }
      return;
    }

    const currentStillVisible = filteredLeaderboards.some((board) => board.type === selectedLeaderboardType);
    if (!currentStillVisible) {
      setSelectedLeaderboardType(filteredLeaderboards[0].type);
    }
  }, [filteredLeaderboards, selectedLeaderboardType]);

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
  const activeLeaderboard = filteredLeaderboards.find((entry) => entry.type === selectedLeaderboardType)
    || filteredLeaderboards.find((entry) => entry.type === 'overall')
    || filteredLeaderboards[0]
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
  const activeLeaderboardRows = activeLeaderboard?.rows || [];
  const featuredLeaderboardRows = activeLeaderboardRows.slice(0, 3);
  const leaderboardLeader = activeLeaderboardRows[0] || null;
  const currentStudentLeaderboardEntry = activeLeaderboardRows.find((entry) => entry.isCurrentStudent) || null;
  const rivalEntry = currentStudentLeaderboardEntry
    ? activeLeaderboardRows.find((entry) => entry.rankPosition === Math.max(currentStudentLeaderboardEntry.rankPosition - 1, 1))
    : activeLeaderboardRows[1] || activeLeaderboardRows[0] || null;
  const rivalGap = currentStudentLeaderboardEntry && rivalEntry && rivalEntry.studentId !== currentStudentLeaderboardEntry.studentId
    ? Math.max(Number(rivalEntry.score || 0) - Number(currentStudentLeaderboardEntry.score || 0), 0)
    : 0;
  const availableTitles = identity?.availableTitles || [];
  const unlockedTitles = availableTitles.filter((title) => title.isUnlocked);
  const currentTitle = identity?.equippedTitle || null;
  const currentStage = identity?.currentStage || null;
  const stageHistory = identity?.stageHistory || [];
  const selectedStyleModelOptions = identity?.avatarModelsByStyle?.[selectedAvatarStyle]
    || identity?.avatarModelOptions
    || { available: [], blocked: [] };
  const availableAvatarModels = selectedStyleModelOptions.available || [];
  const blockedAvatarModels = selectedStyleModelOptions.blocked || [];
  const activeAvatarModel = availableAvatarModels.find((model) => model.slug === selectedAvatarModelSlug)
    || identity?.avatarModelMeta
    || availableAvatarModels[0]
    || null;
  const ownedCosmetics = storeCosmetics.filter((item) => item.isOwned);
  const filteredStoreCosmetics = storeCosmetics
    .filter((item) => (selectedStoreCategoryFilter === 'all' ? true : item.category === selectedStoreCategoryFilter))
    .filter((item) => (selectedStorePhotoFilter === 'all' ? true : item.photoFocus === selectedStorePhotoFilter))
    .sort((left, right) => compareStoreCosmetics(left, right, selectedStoreSort));
  const pagedNudges = paginateItems(nudges, sectionPages.nudges);
  const pagedXpLedger = paginateItems(xpLedger, sectionPages.xpLedger);
  const pagedCurrencyLedger = paginateItems(currency.ledger || [], sectionPages.currencyLedger);
  const pagedRecommendations = paginateItems(recommendations, sectionPages.recommendations);
  const pagedEarnedAchievements = paginateItems(achievements, sectionPages.earnedAchievements);
  const pagedSecretAchievements = paginateItems(secretAchievements, sectionPages.secretAchievements);
  const pagedDiscoveredHiddenRewards = paginateItems(discoveredHiddenRewards, sectionPages.discoveredHiddenRewards);
  const pagedHiddenRewardHints = paginateItems(hiddenRewardHints, sectionPages.hiddenRewardHints);
  const pagedSurpriseChains = paginateItems(surpriseChains, sectionPages.surpriseChains);
  const pagedLockedAchievements = paginateItems(lockedAchievements, sectionPages.lockedAchievements);
  const pagedCampaigns = paginateItems(campaigns, sectionPages.campaigns);
  const pagedUpcomingChallenges = paginateItems(upcomingChallenges, sectionPages.upcomingChallenges);
  const pagedOwnedCosmetics = paginateItems(ownedCosmetics, sectionPages.ownedCosmetics);
  const pagedStoreCosmetics = paginateItems(filteredStoreCosmetics, sectionPages.storeCosmetics);
  const pagedExpandedLeaderboardRows = paginateItems(activeLeaderboardRows.slice(3), sectionPages.leaderboard);
  const previewItem = previewItemSlug ? storeCosmeticsBySlug[previewItemSlug] || null : null;
  const previewEquipment = previewItem
    ? {
        ...(cosmetics.equipment || {}),
        [previewItem.category]: previewItem.slug,
      }
    : (cosmetics.equipment || {});
  const previewEquippedItems = {
    frame: storeCosmeticsBySlug[previewEquipment.frame] || null,
    background: storeCosmeticsBySlug[previewEquipment.background] || null,
    badge: storeCosmeticsBySlug[previewEquipment.badge] || null,
    effect: storeCosmeticsBySlug[previewEquipment.effect] || null,
  };
  const previewAvatarUrl = buildAvatarUrl({
    seed: `${identity?.studentId || userId || 'student'}-${identity?.displayName || 'estudiante'}`,
    style: selectedAvatarStyle || 'adventurer-neutral',
    modelSlug: selectedAvatarModelSlug || activeAvatarModel?.slug || null,
    equipment: previewEquipment,
  });
  const previewProfileImageUrl = selectedProfileImageMode === 'photo' && profilePhotoPreviewUrl
    ? profilePhotoPreviewUrl
    : previewAvatarUrl;
  const hasProfilePhoto = Boolean(profilePhotoPreviewUrl);
  const secretAchievementsPreview = secretAchievements.slice(0, 6);
  const xpMomentsCount = xpLedger.length;
  const activeGoalSummaryCards = {
    xp: [
      {
        icon: <FaBolt />,
        label: 'Eventos XP',
        value: `${xpMomentsCount}`,
        helper: xpMomentsCount > 0 ? 'Ya tienes trazabilidad de tu progreso.' : 'Tu extracto crecera con cada accion verificada.',
      },
      {
        icon: <FaFire />,
        label: 'Ritmo activo',
        value: `${profile.activeStreak} mes${profile.activeStreak === 1 ? '' : 'es'}`,
        helper: `Racha habil: ${profile.summary?.weekdayAttendanceStreak || 0} dias.`,
      },
      {
        icon: <FaCalendarCheck />,
        label: 'Retos vivos',
        value: `${challenges.filter((challenge) => !challenge.isCompleted).length}`,
        helper: nextChallenge ? `Mas cerca: ${nextChallenge.title}` : 'Sin retos pendientes por ahora.',
      },
    ],
    achievements: [
      {
        icon: <FaStar />,
        label: 'Secretos visibles',
        value: `${secretAchievementsPreview.length + hiddenRewardHints.length}`,
        helper: secretAchievementsPreview.length + hiddenRewardHints.length > 0 ? 'Hay pistas abiertas para descubrir.' : 'Aun no hay secretos proyectados.',
      },
      {
        icon: <FaLayerGroup />,
        label: 'Bloqueados',
        value: `${lockedAchievements.length}`,
        helper: lockedAchievements.length > 0 ? 'Tienes bastante margen de progreso.' : 'Ya agotaste este bloque por ahora.',
      },
      {
        icon: <FaMedal />,
        label: 'Desbloqueados',
        value: `${achievements.length}`,
        helper: achievements.length > 0 ? `Ya puedes revisar todos tus logros ganados.` : 'Tus logros apareceran aqui.',
      },
      {
        icon: <FaFlagCheckered />,
        label: 'Etapa actual',
        value: `${currentStage?.currentStageName || 'Semilla'}`,
        helper: currentStage?.progressHint || 'Tu etapa narrativa aparecera aqui.',
      },
    ],
    challenges: [
      {
        icon: <FaRunning />,
        label: 'Rutas abiertas',
        value: `${strategicRoutes.length || recommendations.length}`,
        helper: strategicRoutes.length > 0 ? 'Ya tienes una principal y alternativas medibles.' : recommendations.length > 0 ? 'Ya hay enfoque sugerido para tu siguiente mejora.' : 'Esperando mas contexto de tus medidas.',
      },
      {
        icon: <FaLockOpen />,
        label: 'Siguiente ciclo',
        value: `${upcomingChallenges.length}`,
        helper: upcomingChallenges.length > 0 ? 'Ya tienes preparacion futura visible.' : 'Todavia no se abren pre-retos.',
      },
      {
        icon: <FaFire />,
        label: 'Campañas vivas',
        value: `${campaigns.length}`,
        helper: campaigns.length > 0 ? 'Hay ventanas activas que no conviene dejar pasar.' : 'No hay campañas activas en este momento.',
      },
      {
        icon: <FaFlagCheckered />,
        label: 'Retos completados',
        value: `${completedChallenges}/${challenges.length}`,
        helper: challenges.length > 0 ? 'Tu progreso del ciclo sigue acumulando XP.' : 'Aun no hay retos cargados.',
      },
    ],
  };
  const activeCompetitionSummary = [
    {
      icon: <FaTrophy />,
      label: 'Tablas visibles',
      value: `${filteredLeaderboards.length}`,
      helper: selectedCompetitionFilter === 'all'
        ? 'Estas viendo todas las categorias competitivas.'
        : `Filtro activo: ${COMPETITION_FILTERS.find((filter) => filter.id === selectedCompetitionFilter)?.label || 'Competencia'}.`,
    },
    {
      icon: <FaChartLine />,
      label: 'Ranking activo',
      value: rankingPosition ? `#${rankingPosition}` : 'N/A',
      helper: activeLeaderboard?.title || 'Todavia no hay tabla activa.',
    },
    {
      icon: <FaChevronRight />,
      label: 'Brecha rival',
      value: currentStudentLeaderboardEntry && rivalEntry && rivalEntry.studentId !== currentStudentLeaderboardEntry.studentId
        ? `${rivalGap} ${activeLeaderboard?.unit || ''}`.trim()
        : 'Sin gap',
      helper: currentStudentLeaderboardEntry && rivalEntry && rivalEntry.studentId !== currentStudentLeaderboardEntry.studentId
        ? `Te acerca al puesto #${rivalEntry.rankPosition}.`
        : 'Cuando haya una persecucion clara la veras aqui.',
    },
  ];
  const buildModelPreviewUrl = (modelSlug) => buildAvatarUrl({
    seed: `${identity?.studentId || userId || 'student'}-${identity?.displayName || 'estudiante'}`,
    style: selectedAvatarStyle || 'adventurer-neutral',
    modelSlug,
    equipment: previewEquipment,
  });

  const handleSaveIdentity = async () => {
    if (!userId) return;
    setSavingIdentity(true);
    setIdentityMessage(null);
    try {
      const updatedGamification = await gamificationService.updateStudentIdentity({
        userId,
        nickname,
        selectedTitleSlug: selectedTitleSlug || null,
        avatarStyle: selectedAvatarStyle,
        avatarModelSlug: selectedAvatarModelSlug || activeAvatarModel?.slug || null,
        profileImageMode: selectedProfileImageMode,
        profilePhotoFile,
        removeProfilePhoto,
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

  const handleProfilePhotoChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    const maxSizeBytes = 4 * 1024 * 1024;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    if (!allowedTypes.has(nextFile.type)) {
      setIdentityMessage({ tone: 'warning', text: 'La foto debe estar en formato JPG, PNG o WEBP.' });
      return;
    }

    if (Number(nextFile.size || 0) > maxSizeBytes) {
      setIdentityMessage({ tone: 'warning', text: 'La foto no puede superar los 4 MB.' });
      return;
    }

    if (profilePhotoPreviewUrl && profilePhotoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }

    setProfilePhotoFile(nextFile);
    setRemoveProfilePhoto(false);
    setSelectedProfileImageMode('photo');
    setProfilePhotoPreviewUrl(URL.createObjectURL(nextFile));
    setIdentityMessage(null);
  };

  const handleRemoveProfilePhoto = () => {
    if (profilePhotoPreviewUrl && profilePhotoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }

    setProfilePhotoFile(null);
    setProfilePhotoPreviewUrl('');
    setRemoveProfilePhoto(Boolean(identity?.profilePhotoUrl));
    setSelectedProfileImageMode('avatar');
  };

  const applyGamificationPatch = (patchBuilder) => {
    if (typeof onIdentityUpdated !== 'function') {
      return;
    }

    onIdentityUpdated((current) => {
      if (!current) {
        return current;
      }

      const nextState = typeof patchBuilder === 'function' ? patchBuilder(current) : patchBuilder;
      return nextState || current;
    });
  };

  const handlePurchaseCosmetic = async (itemSlug) => {
    if (!userId) return;
    setCosmeticActionSlug(itemSlug);
    setCosmeticMessage(null);
    try {
      const purchaseResult = await gamificationService.purchaseCosmeticItem({ userId, itemSlug });
      applyGamificationPatch((current) => {
        const currentItems = current?.cosmetics?.items || [];
        const purchasedItem = currentItems.find((entry) => entry.slug === itemSlug);
        const priceCoins = Number(purchaseResult?.priceCoins || purchasedItem?.priceCoins || 0);
        const nextBalance = Math.max(Number(current?.currency?.balance || 0) - priceCoins, 0);
        const nextItems = recalculateStoreAffordability(
          currentItems.map((entry) => (
            entry.slug === itemSlug
              ? {
                  ...entry,
                  isOwned: true,
                  isLocked: false,
                  canPurchase: false,
                }
              : entry
          )),
          nextBalance,
        );

        return {
          ...current,
          currency: {
            ...(current.currency || {}),
            balance: nextBalance,
            totalSpent: Number(current?.currency?.totalSpent || 0) + priceCoins,
          },
          cosmetics: {
            ...(current.cosmetics || {}),
            items: nextItems,
            inventoryCount: nextItems.filter((entry) => entry.isOwned).length,
          },
        };
      });
      setCosmeticMessage({ tone: 'success', text: 'Item comprado y agregado a tu coleccion.' });
    } catch (error) {
      console.error('Error comprando item cosmetico:', error);
      const normalizedError = normalizeGamificationError(error);
      if (normalizedError.shouldRefresh && typeof onRefresh === 'function') {
        await onRefresh();
      }
      setCosmeticMessage({ tone: 'warning', text: normalizedError.text });
    } finally {
      setCosmeticActionSlug('');
    }
  };

  const handleEquipCosmetic = async (itemSlug) => {
    if (!userId) return;
    setCosmeticActionSlug(itemSlug);
    setCosmeticMessage(null);
    try {
      const equipResult = await gamificationService.equipCosmeticItem({ userId, itemSlug });
      applyGamificationPatch((current) => {
        const currentItems = current?.cosmetics?.items || [];
        const equippedItem = currentItems.find((entry) => entry.slug === itemSlug);
        const category = equipResult?.category || equippedItem?.category;

        if (!category) {
          return current;
        }

        const nextItems = currentItems.map((entry) => (
          entry.category === category
            ? {
                ...entry,
                isEquipped: entry.slug === itemSlug,
              }
            : entry
        ));
        const nextEquipment = {
          ...(current?.cosmetics?.equipment || {}),
          [category]: itemSlug,
        };
        const nextEquippedItems = {
          ...(current?.cosmetics?.equippedItems || {}),
          [category]: equippedItem || null,
        };

        return {
          ...current,
          cosmetics: {
            ...(current.cosmetics || {}),
            items: nextItems,
            equipment: nextEquipment,
            equippedItems: nextEquippedItems,
          },
          leaderboards: (current.leaderboards || []).map((board) => ({
            ...board,
            rows: patchLeaderboardEquipmentRows(board.rows, {
              [`${category}_item_slug`]: itemSlug,
            }),
          })),
          leaderboard: patchLeaderboardEquipmentRows(current.leaderboard || [], {
            [`${category}_item_slug`]: itemSlug,
          }),
        };
      });
      setCosmeticMessage({ tone: 'success', text: 'Tu equipamiento cosmetico se actualizo.' });
    } catch (error) {
      console.error('Error equipando item cosmetico:', error);
      const normalizedError = normalizeGamificationError(error);
      if (normalizedError.shouldRefresh && typeof onRefresh === 'function') {
        await onRefresh();
      }
      setCosmeticMessage({ tone: 'warning', text: normalizedError.text });
    } finally {
      setCosmeticActionSlug('');
    }
  };

  const handleUnequipCosmetic = async (category) => {
    if (!userId) return;
    setCosmeticActionSlug(category);
    setCosmeticMessage(null);
    try {
      await gamificationService.unequipCosmeticItem({ userId, category });
      applyGamificationPatch((current) => {
        const nextItems = (current?.cosmetics?.items || []).map((entry) => (
          entry.category === category
            ? {
                ...entry,
                isEquipped: false,
              }
            : entry
        ));
        const nextEquipment = {
          ...(current?.cosmetics?.equipment || {}),
          [category]: null,
        };
        const nextEquippedItems = {
          ...(current?.cosmetics?.equippedItems || {}),
          [category]: null,
        };

        return {
          ...current,
          cosmetics: {
            ...(current.cosmetics || {}),
            items: nextItems,
            equipment: nextEquipment,
            equippedItems: nextEquippedItems,
          },
          leaderboards: (current.leaderboards || []).map((board) => ({
            ...board,
            rows: patchLeaderboardEquipmentRows(board.rows, {
              [`${category}_item_slug`]: null,
            }),
          })),
          leaderboard: patchLeaderboardEquipmentRows(current.leaderboard || [], {
            [`${category}_item_slug`]: null,
          }),
        };
      });
      setPreviewItemSlug((current) => {
        const currentPreview = current ? storeCosmeticsBySlug[current] : null;
        return currentPreview?.category === category ? '' : current;
      });
      setCosmeticMessage({ tone: 'success', text: `Se retiro el ${COSMETIC_SLOT_LABELS[category] || 'cosmetico'} de tu perfil.` });
    } catch (error) {
      console.error('Error desequipando item cosmetico:', error);
      const normalizedError = normalizeGamificationError(error);
      if (normalizedError.shouldRefresh && typeof onRefresh === 'function') {
        await onRefresh();
      }
      setCosmeticMessage({ tone: 'warning', text: normalizedError.text });
    } finally {
      setCosmeticActionSlug('');
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

      <div className="mt-4 flex flex-wrap gap-2">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedPanelTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              selectedPanelTab === tab.id
                ? 'border-rv-gold/60 bg-rv-gold/15 text-white shadow-[0_0_22px_rgba(245,158,11,0.16)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedPanelTab === 'summary' ? (
      <>
      <div className="mt-4 grid gap-4 desktop:grid-cols-[1.15fr_0.85fr]">
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
          <HighlightStat
            icon={<FaCoins />}
            label="Monedas"
            value={`${currency.balance || 0}`}
            helper="Sirven para futuros decorativos, efectos y personalizacion."
            tone={(currency.balance || 0) > 0 ? 'success' : 'default'}
          />
        </div>
      </div>

      {currentStage ? (
        <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
          <div className="grid gap-4 desktop:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-rv-gold/25 bg-[linear-gradient(135deg,_rgba(245,158,11,0.14),_rgba(15,23,42,0.2)_55%,_rgba(34,197,94,0.08))] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">Etapa del atleta</p>
              <p className="mt-3 text-3xl font-black text-white">{currentStage.currentStageName || currentStage.currentStageSlug}</p>
              {currentStage.currentStageDescription ? (
                <p className="mt-2 text-sm text-slate-200">{currentStage.currentStageDescription}</p>
              ) : null}
              <p className="mt-3 text-sm font-semibold text-rv-gold">{currentStage.progressHint}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Desglose de evidencia</p>
              <div className="mt-3 grid gap-3 mobile:grid-cols-2">
                <MiniInsight
                  icon={<FaChartLine />}
                  label="Tests"
                  value={`${currentStage.metadata?.tests?.current || 0}`}
                  helper={`Meta: ${currentStage.metadata?.tests?.required || 0}`}
                />
                <MiniInsight
                  icon={<FaCalendarCheck />}
                  label="Asistencias"
                  value={`${currentStage.metadata?.attendances?.current || 0}`}
                  helper={`Meta: ${currentStage.metadata?.attendances?.required || 0}`}
                />
                <MiniInsight
                  icon={<FaCoins />}
                  label="Pagos"
                  value={`${currentStage.metadata?.payments?.current || 0}`}
                  helper={`Meta: ${currentStage.metadata?.payments?.required || 0}`}
                />
                <MiniInsight
                  icon={<FaMedal />}
                  label="Logros"
                  value={`${currentStage.metadata?.achievements?.current || 0}`}
                  helper={`Meta: ${currentStage.metadata?.achievements?.required || 0}`}
                />
              </div>
            </div>
          </div>
        </Card>
      ) : null}

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
      </>
      ) : null}

      {selectedPanelTab === 'identity' ? (
      <>
      <div className="mt-4 flex flex-wrap gap-2">
        {IDENTITY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedIdentityTab(tab.id)}
            className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              selectedIdentityTab === tab.id
                ? 'border-cyan-300/50 bg-cyan-400/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {(selectedIdentityTab === 'collection' || selectedIdentityTab === 'store') ? (
        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-950/15 px-4 py-3 text-sm text-cyan-100">
          {selectedIdentityTab === 'collection'
            ? 'Aqui ves tu coleccion equipada, tu preview y los cosmeticos que ya son tuyos.'
            : 'Aqui ves tu wallet, el extracto de monedas y el catalogo disponible para comprar.'}
        </div>
      ) : null}
      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <div className={`grid gap-4 ${selectedIdentityTab === 'collection' || selectedIdentityTab === 'store' ? 'desktop:grid-cols-1' : 'desktop:grid-cols-[0.95fr_1.05fr]'}`}>
          <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.16),_rgba(15,23,42,0.18)_55%,_rgba(245,158,11,0.12))] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Vista previa de tu perfil</p>
            <div className="mt-4 grid gap-4 mobile:grid-cols-[auto_1fr] mobile:items-center">
              <IdentityPortrait
                imageUrl={previewProfileImageUrl}
                displayName={identity?.displayName || 'estudiante'}
                equipment={previewEquipment}
                equippedItems={previewEquippedItems}
                size="lg"
                showBadgeLabel
              />
              <div>
                <p className="text-2xl font-black text-white">{identity?.displayName || 'Sin apodo todavia'}</p>
                <p className="mt-1 text-sm text-slate-300">Nombre real: {identity?.realName || 'Estudiante'}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                  Imagen principal: {selectedProfileImageMode === 'photo' ? 'Foto personal' : identity?.avatarStyleMeta?.name || 'Avatar'}
                </p>
                {selectedProfileImageMode === 'avatar' && activeAvatarModel ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
                    Modelo activo: {activeAvatarModel.name}
                  </p>
                ) : null}
                {previewItem ? (
                  <p className="mt-2 text-sm font-semibold text-amber-100">
                    Previsualizando: {previewItem.name}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">{currentTitle?.name || 'Sin titulo equipado'}</StatusBadge>
              <StatusBadge tone="success">{unlockedTitles.length} titulos desbloqueados</StatusBadge>
            </div>
            <p className="mt-3 text-sm text-slate-200">
              {currentTitle?.description || 'Tu marco rodea la foto o avatar principal, tu insignia aparece sobre la imagen y el efecto le da presencia en rankings.'}
            </p>

            <div className="mt-4 grid gap-3 mobile:grid-cols-2">
              {['frame', 'background', 'badge', 'effect'].map((slot) => {
                const equippedItem = previewEquippedItems[slot];
                return (
                  <div
                    key={slot}
                    className={`rounded-2xl border border-white/10 bg-black/20 p-3 ${
                      selectedIdentityTab === 'collection' || selectedIdentityTab === 'profile' ? '' : 'hidden'
                    }`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">{COSMETIC_SLOT_LABELS[slot]}</p>
                    <p className="mt-2 text-sm font-bold text-white">{equippedItem?.name || 'Sin equipar'}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {slot === 'frame'
                        ? 'Se ve como el borde de tu foto o avatar.'
                        : slot === 'badge'
                          ? 'Aparece como sello destacado sobre tu perfil.'
                          : slot === 'background'
                            ? 'Define el fondo de tu tarjeta competitiva.'
                            : 'Agrega brillo y presencia visual.'}
                    </p>
                    {getCosmeticPhotoNotice(slot, selectedProfileImageMode) ? (
                      <p className="mt-2 text-[11px] font-semibold text-cyan-100">
                        {getCosmeticPhotoNotice(slot, selectedProfileImageMode)}
                      </p>
                    ) : null}
                    {cosmetics.equipment?.[slot] ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        disabled={cosmeticActionSlug === slot}
                        onClick={() => handleUnequipCosmetic(slot)}
                      >
                        <FaSyncAlt className={`mr-2 ${cosmeticActionSlug === slot ? 'animate-spin' : ''}`} />
                        Desequipar
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-3xl border border-white/10 bg-black/20 p-4 ${selectedIdentityTab === 'collection' || selectedIdentityTab === 'store' ? 'hidden' : ''}`}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleProfilePhotoChange}
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Personaliza tu perfil</p>
            <div className="mt-4 grid gap-3">
              <div className={selectedIdentityTab === 'profile' ? '' : 'hidden'}>
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

              <div className="grid gap-2">
                <span className="text-sm font-bold text-white">Imagen principal del perfil</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProfileImageMode('avatar')}
                    className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                      selectedProfileImageMode === 'avatar'
                        ? 'border-rv-gold/60 bg-rv-gold/15 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    Usar avatar
                  </button>
                  <button
                    type="button"
                    onClick={() => hasProfilePhoto && setSelectedProfileImageMode('photo')}
                    disabled={!hasProfilePhoto}
                    className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                      selectedProfileImageMode === 'photo'
                        ? 'border-cyan-300/60 bg-cyan-400/15 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-45'
                    }`}
                  >
                    Usar foto
                  </button>
                </div>
                <span className="text-xs text-slate-400">Tu avatar o foto se mostrara como imagen principal del perfil y en los leaderboards.</span>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-bold text-white">Foto de perfil</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => photoInputRef.current?.click()}>
                    <FaImage className="mr-2" />
                    {hasProfilePhoto ? 'Cambiar foto' : 'Subir foto'}
                  </Button>
                  {hasProfilePhoto ? (
                    <Button variant="secondary" size="sm" onClick={handleRemoveProfilePhoto}>
                      Quitar foto
                    </Button>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400">Formatos: JPG, PNG o WEBP. Maximo 4 MB.</span>
              </div>
              </div>

              <div className={selectedIdentityTab === 'avatar' ? '' : 'hidden'}>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white">Estilo del avatar</span>
                <select
                  value={selectedAvatarStyle}
                  onChange={(event) => setSelectedAvatarStyle(event.target.value)}
                  className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
                >
                  {(identity?.avatarStyleOptions || []).map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">Si usas avatar, este estilo sera tu imagen de perfil base.</span>
              </label>

                <div className="grid gap-3">
                  <div>
                    <span className="text-sm font-bold text-white">Modelo del avatar</span>
                    <p className="mt-1 text-xs text-slate-400">
                      Cada estilo tiene modelos propios. Algunos son base y otros se desbloquean por progreso.
                    </p>
                    {selectedProfileImageMode === 'photo' ? (
                      <p className="mt-2 text-[11px] font-semibold text-cyan-100">
                        Mientras uses foto, cambiar estilo o modelo no modifica tu imagen principal. Se vera cuando vuelvas a usar avatar.
                      </p>
                    ) : null}
                  </div>
                <div className="grid gap-3 mobile:grid-cols-2">
                  {availableAvatarModels.map((model) => (
                    <button
                      key={model.slug}
                      type="button"
                      onClick={() => setSelectedAvatarModelSlug(model.slug)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selectedAvatarModelSlug === model.slug
                          ? 'border-cyan-300/50 bg-cyan-400/12'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="mb-3 flex justify-center">
                        <IdentityPortrait
                          imageUrl={buildModelPreviewUrl(model.slug)}
                          displayName={model.name}
                          equipment={previewEquipment}
                          equippedItems={previewEquippedItems}
                          size="sm"
                        />
                      </div>
                      <p className="text-sm font-black text-white">{model.name}</p>
                      <p className="mt-1 text-xs text-slate-300">{model.description}</p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                        {model.unlockHint || 'Disponible'}
                      </p>
                    </button>
                  ))}
                </div>
                {blockedAvatarModels.length > 0 ? (
                  <div className="grid gap-3 mobile:grid-cols-2">
                    {blockedAvatarModels.map((model) => (
                      <div key={model.slug} className="rounded-2xl border border-dashed border-fuchsia-300/30 bg-fuchsia-500/5 p-3">
                        <div className="mb-3 flex justify-center opacity-80">
                          <IdentityPortrait
                            imageUrl={buildModelPreviewUrl(model.slug)}
                            displayName={model.name}
                            equipment={previewEquipment}
                            equippedItems={previewEquippedItems}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-black text-white">{model.name}</p>
                            <p className="mt-1 text-xs text-slate-300">{model.description}</p>
                          </div>
                          <StatusBadge tone="warning">Bloqueado</StatusBadge>
                        </div>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fuchsia-200">
                          {model.unlockHint || 'Sigue avanzando para desbloquearlo'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              </div>

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
                <p className="text-xs text-slate-400">Tu apodo, tu imagen principal y tu titulo apareceran en los rankings de competencia.</p>
                <Button variant="secondary" size="sm" onClick={handleSaveIdentity} disabled={savingIdentity || loading}>
                  <FaSyncAlt className={`mr-2 ${savingIdentity ? 'animate-spin' : ''}`} />
                  Guardar identidad
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedIdentityTab === 'store' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaCoins className="text-rv-gold" />
          Monedas de personalizacion
        </h3>
        <div className="mt-3 grid gap-3 desktop:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-emerald-300/20 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(15,23,42,0.18)_55%,_rgba(245,158,11,0.12))] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Wallet activa</p>
            <p className="mt-3 text-4xl font-black text-white">{currency.balance || 0}</p>
            <div className="mt-4 grid gap-3 mobile:grid-cols-2">
              <MiniInsight
                icon={<FaCoins />}
                label="Ganadas"
                value={`${Number(currency.totalEarned || currency.total_earned || 0)}`}
                helper="Todo lo que ya acumulaste."
              />
              <MiniInsight
                icon={<FaShieldAlt />}
                label="Gastadas"
                value={`${Number(currency.totalSpent || currency.total_spent || 0)}`}
                helper={Number(currency.totalSpent || currency.total_spent || 0) > 0
                  ? 'Gastos registrados en compras cosmeticas.'
                  : 'Por ahora se mantiene en cero.'}
              />
            </div>
            <p className="mt-4 text-sm text-slate-200">
              Estas monedas quedaran listas para canjear cosmeticos, efectos de perfil y futuras piezas visuales del avatar.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Extracto de monedas</p>
                {currency.ledger?.length > 0 ? (
                  <div className="mt-3 space-y-2">
                {pagedCurrencyLedger.items.map((entry) => (
                  <div key={`${entry.id || entry.sourceRef || entry.occurredAt}-${entry.label}`} className="rounded-2xl border border-white/10 bg-slate-950/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{entry.label}</p>
                        <p className="mt-1 text-xs text-slate-300">{entry.description}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {entry.occurredAt ? formatDate(entry.occurredAt) : 'Recompensa estructural'}
                        </p>
                      </div>
                      <StatusBadge tone={Number(entry.coinsDelta || 0) >= 0 ? 'success' : 'warning'}>
                        {Number(entry.coinsDelta || 0) >= 0 ? `+${entry.coinsDelta}` : `${entry.coinsDelta}`}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
                <PaginationControls
                  page={pagedCurrencyLedger.page}
                  totalPages={pagedCurrencyLedger.totalPages}
                  onChange={(page) => setSectionPage('currencyLedger', page)}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-300">Aun no tienes movimientos de monedas visibles.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedIdentityTab === 'collection' ? '' : 'hidden'}`} padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
            <FaStar className="text-rv-gold" />
            Tu coleccion
          </h3>
          <StatusBadge tone="info">{cosmetics.inventoryCount || 0} items en tu coleccion</StatusBadge>
        </div>

        <div className="mt-3">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Coleccion equipada</p>
            <div className="mt-3 grid gap-3 mobile:grid-cols-2">
              <MiniInsight
                icon={<FaShieldAlt />}
                label="Marco"
                value={previewEquippedItems.frame?.name || 'Sin equipar'}
                helper="Es el borde de tu foto o avatar."
              />
              <MiniInsight
                icon={<FaLayerGroup />}
                label="Fondo"
                value={previewEquippedItems.background?.name || 'Sin equipar'}
                helper="Se ve detras de tu imagen."
              />
              <MiniInsight
                icon={<FaMedal />}
                label="Insignia"
                value={previewEquippedItems.badge?.name || 'Sin equipar'}
                helper="Destaca tu perfil sobre la imagen."
              />
              <MiniInsight
                icon={<FaBolt />}
                label="Efecto"
                value={previewEquippedItems.effect?.name || 'Sin equipar'}
                helper="Agrega brillo y energia visual."
              />
            </div>

            {cosmeticMessage ? (
              <div className={`mt-4 rounded-2xl border px-3 py-2 text-sm ${
                cosmeticMessage.tone === 'success'
                  ? 'border-emerald-300/35 bg-emerald-900/15 text-emerald-100'
                  : 'border-amber-300/35 bg-amber-900/15 text-amber-100'
              }`}>
                {cosmeticMessage.text}
              </div>
            ) : null}

            <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.1),_rgba(15,23,42,0.2)_55%,_rgba(245,158,11,0.08))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">Preview en tu perfil</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {previewItem ? `Estas viendo como se vera ${previewItem.name} en tu perfil.` : 'Asi se vera tu perfil con lo que ya tienes equipado.'}
                  </p>
                </div>
                {previewItem ? (
                  <Button variant="secondary" size="sm" onClick={() => setPreviewItemSlug('')}>
                    Quitar preview
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 flex justify-center">
                <IdentityPortrait
                  imageUrl={previewProfileImageUrl}
                  displayName={identity?.displayName || 'estudiante'}
                  equipment={previewEquipment}
                  equippedItems={previewEquippedItems}
                  size="lg"
                  showBadgeLabel
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {ownedCosmetics.length > 0 ? pagedOwnedCosmetics.items.map((item) => (
                <div key={`owned-${item.slug}`} className="rounded-2xl border border-white/10 bg-slate-950/80 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                    </div>
                    <StatusBadge tone={item.isEquipped ? 'success' : 'info'}>
                      {item.isEquipped ? 'Equipado' : 'Disponible'}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{COSMETIC_SLOT_LABELS[item.category] || item.category}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setPreviewItemSlug((current) => current === item.slug ? '' : item.slug)}>
                        Previsualizar
                      </Button>
                      {item.isEquipped ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={cosmeticActionSlug === item.category}
                          onClick={() => handleUnequipCosmetic(item.category)}
                        >
                          <FaSyncAlt className={`mr-2 ${cosmeticActionSlug === item.category ? 'animate-spin' : ''}`} />
                          Desequipar
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={cosmeticActionSlug === item.slug}
                          onClick={() => handleEquipCosmetic(item.slug)}
                        >
                          <FaSyncAlt className={`mr-2 ${cosmeticActionSlug === item.slug ? 'animate-spin' : ''}`} />
                          Equipar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-slate-300">
                  Aun no tienes cosmeticos en tu coleccion. Compra uno en el catalogo para empezar a personalizar tu perfil.
                </div>
              )}
              <PaginationControls
                page={pagedOwnedCosmetics.page}
                totalPages={pagedOwnedCosmetics.totalPages}
                onChange={(page) => setSectionPage('ownedCosmetics', page)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedIdentityTab === 'store' ? '' : 'hidden'}`} padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
            <FaCoins className="text-rv-gold" />
            Tienda cosmetica
          </h3>
          <StatusBadge tone="info">{currency.balance || 0} monedas disponibles</StatusBadge>
        </div>

        <div className="mt-4 grid gap-4 desktop:grid-cols-[320px,minmax(0,1fr)] desktop:items-start">
          <div className="space-y-4 desktop:sticky desktop:top-24">
            <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.16),_rgba(15,23,42,0.22)_55%,_rgba(245,158,11,0.08))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Preview siempre visible</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {previewItem ? `Estas viendo ${previewItem.name} aplicado a tu perfil.` : 'Asi se vera tu perfil con lo que ya tienes equipado.'}
                  </p>
                </div>
                {previewItem ? (
                  <Button variant="secondary" size="sm" onClick={() => setPreviewItemSlug('')}>
                    Quitar preview
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 flex justify-center">
                <IdentityPortrait
                  imageUrl={previewProfileImageUrl}
                  displayName={identity?.displayName || 'estudiante'}
                  equipment={previewEquipment}
                  equippedItems={previewEquippedItems}
                  size="lg"
                  showBadgeLabel
                />
              </div>

              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Modo visual</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedProfileImageMode === 'photo' ? 'Foto de perfil activa' : 'Avatar como imagen principal'}
                  </p>
                </div>
                {previewItem ? (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-950/15 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100">Impacto del item</p>
                    <p className="mt-1 text-sm font-semibold text-white">{previewItem.photoFocusLabel}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {getCosmeticPhotoNotice(previewItem.category, selectedProfileImageMode) || 'Tambien se reflejara en tu presencia competitiva y rankings.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.12),_rgba(15,23,42,0.18)_55%,_rgba(245,158,11,0.08))] p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Catalogo cosmetico</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Mas piezas visuales pensadas para que tu foto de perfil se vea mejor en el panel y en rankings.
                    </p>
                  </div>
                  <StatusBadge tone="info">{filteredStoreCosmetics.length} items visibles</StatusBadge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {COSMETIC_CATEGORY_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedStoreCategoryFilter(filter.id)}
                      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                        selectedStoreCategoryFilter === filter.id
                          ? 'border-rv-gold/60 bg-rv-gold/15 text-white shadow-[0_0_18px_rgba(245,158,11,0.14)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 mobile:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Impacto en foto</span>
                    <select
                      value={selectedStorePhotoFilter}
                      onChange={(event) => setSelectedStorePhotoFilter(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/45"
                    >
                      {COSMETIC_PHOTO_FILTERS.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Ordenar por</span>
                    <select
                      value={selectedStoreSort}
                      onChange={(event) => setSelectedStoreSort(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/45"
                    >
                      {COSMETIC_SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-3 mobile:grid-cols-2">
              {pagedStoreCosmetics.items.map((item) => (
                <div
                  key={item.slug}
                  className={`rounded-2xl border p-4 ${
                    item.isLocked
                      ? 'border-fuchsia-300/25 bg-fuchsia-950/10'
                      : 'border-white/10 bg-black/25'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rv-gold">{item.rarity}</p>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {COSMETIC_SLOT_LABELS[item.category] || item.category}
                        </span>
                      </div>
                    </div>
                    <StatusBadge tone={item.isOwned ? 'success' : item.isLocked ? 'warning' : item.canAfford ? 'info' : 'warning'}>
                      {item.isOwned ? 'Tuyo' : item.isLocked ? 'Bloqueado' : `${item.priceCoins} monedas`}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-slate-200">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                      {item.unlockLabel}
                    </span>
                    <StatusBadge tone={getCosmeticPhotoImpactTone(item.photoFocus)}>{item.photoFocusLabel}</StatusBadge>
                  </div>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                    Variante: {item.variantLabel || 'base'}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-300">{item.unlockHint}</p>
                  {getCosmeticPhotoNotice(item.category, selectedProfileImageMode) ? (
                    <p className="mt-2 text-[11px] font-semibold text-cyan-100">
                      {getCosmeticPhotoNotice(item.category, selectedProfileImageMode)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setPreviewItemSlug((current) => current === item.slug ? '' : item.slug)}>
                      {previewItemSlug === item.slug ? 'Ocultar preview' : 'Previsualizar'}
                    </Button>
                    {item.isOwned ? (
                      item.isEquipped ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={cosmeticActionSlug === item.category}
                          onClick={() => handleUnequipCosmetic(item.category)}
                        >
                          <FaSyncAlt className={`mr-2 ${cosmeticActionSlug === item.category ? 'animate-spin' : ''}`} />
                          Desequipar
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={cosmeticActionSlug === item.slug}
                          onClick={() => handleEquipCosmetic(item.slug)}
                        >
                          <FaSyncAlt className={`mr-2 ${cosmeticActionSlug === item.slug ? 'animate-spin' : ''}`} />
                          Equipar
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!item.canPurchase || cosmeticActionSlug === item.slug}
                        onClick={() => handlePurchaseCosmetic(item.slug)}
                      >
                        <FaCoins className="mr-2" />
                        {item.isLocked ? 'Aun bloqueado' : 'Comprar'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pagedStoreCosmetics.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-slate-300">
                No hay cosmeticos que coincidan con ese filtro. Cambia el tipo, el impacto visual o el orden para ver mas opciones.
              </div>
            ) : null}

            <PaginationControls
              page={pagedStoreCosmetics.page}
              totalPages={pagedStoreCosmetics.totalPages}
              onChange={(page) => setSectionPage('storeCosmetics', page)}
            />
          </div>
        </div>
      </Card>
      </>
      ) : null}

      {selectedPanelTab === 'goals' ? (
      <>
      <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
        <div className="flex flex-wrap gap-2">
          {GOALS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGoalsTab(tab.id)}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                selectedGoalsTab === tab.id
                  ? 'border-rv-gold/60 bg-rv-gold/15 text-white shadow-[0_0_18px_rgba(245,158,11,0.14)]'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-3 desktop:grid-cols-3">
        {(activeGoalSummaryCards[selectedGoalsTab] || []).map((card) => (
          <MiniInsight
            key={`${selectedGoalsTab}-${card.label}`}
            icon={card.icon}
            label={card.label}
            value={card.value}
            helper={card.helper}
          />
        ))}
      </div>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'xp' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaBolt className="text-rv-gold" />
          Impulso de hoy
        </h3>
        {nudges.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-3">
            {pagedNudges.items.map((nudge) => (
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
        <PaginationControls
          page={pagedNudges.page}
          totalPages={pagedNudges.totalPages}
          onChange={(page) => setSectionPage('nudges', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'xp' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaBolt className="text-rv-gold" />
          Extracto de XP
        </h3>
        {xpLedger.length > 0 ? (
          <div className="mt-3 space-y-2">
            {pagedXpLedger.items.map((entry) => (
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
            <PaginationControls
              page={pagedXpLedger.page}
              totalPages={pagedXpLedger.totalPages}
              onChange={(page) => setSectionPage('xpLedger', page)}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no hay movimientos de XP suficientes para mostrar un extracto detallado.</p>
        )}
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'challenges' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaFire className="text-rv-gold" />
          Campañas activas
        </h3>
        {campaigns.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {pagedCampaigns.items.map((campaign) => (
              <div key={campaign.slug} className="rounded-3xl border border-orange-300/20 bg-[linear-gradient(135deg,_rgba(249,115,22,0.10),_rgba(15,23,42,0.18)_55%,_rgba(234,179,8,0.08))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-100">
                      {campaign.focusArea} · {campaign.windowType === 'weekly' ? 'Semanal' : campaign.windowType === 'monthly' ? 'Mensual' : 'Flash'}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{campaign.title}</p>
                  </div>
                  <StatusBadge tone={campaign.isCompleted ? 'success' : 'warning'}>
                    {campaign.isCompleted ? 'Completada' : `${campaign.daysRemaining ?? 0} dias`}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{campaign.description}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,_#f59e0b,_#fb7185)]" style={{ width: `${campaign.progressPct || 0}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-300">
                  <span>{campaign.progressValue} / {campaign.targetValue}</span>
                  <span>{campaign.rewardLabel}</span>
                </div>
                {campaign.hint ? (
                  <p className="mt-3 text-sm text-orange-100">{campaign.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Cuando activemos una ventana temporal, la veras aqui con su progreso y recompensa exacta.</p>
        )}
        <PaginationControls
          page={pagedCampaigns.page}
          totalPages={pagedCampaigns.totalPages}
          onChange={(page) => setSectionPage('campaigns', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'challenges' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaRunning className="text-rv-gold" />
          Rutas estrategicas para tu siguiente marca
        </h3>
        {strategicRoutes.length > 0 ? (
          <div className="mt-3 space-y-3">
            {strategicRoutes.map((route) => (
              <div
                key={route.id}
                className={`rounded-3xl border p-4 ${route.priority === 'primary'
                  ? 'border-rv-gold/35 bg-[linear-gradient(135deg,_rgba(245,158,11,0.14),_rgba(15,23,42,0.18)_55%,_rgba(34,197,94,0.08))]'
                  : 'border-white/10 bg-black/20'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${route.priority === 'primary' ? 'text-amber-100' : 'text-slate-300'}`}>
                      {route.priority === 'primary' ? 'Ruta principal' : 'Ruta alternativa'} · {route.focus}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{route.title}</p>
                  </div>
                  <StatusBadge tone={route.priority === 'primary' ? 'warning' : 'info'}>
                    {route.progressLabel}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-100">{route.actionLabel}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Impacto deportivo</p>
                <p className="mt-1 text-sm text-slate-300">{route.sportsBenefit}</p>
                {route.immediateRewards?.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Ganas ahora</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {route.immediateRewards.map((reward) => (
                        <StatusBadge key={`${route.id}-${reward}`} tone="success">{reward}</StatusBadge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {route.chainedRewards?.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Cadena corta</p>
                    <div className="mt-2 grid gap-2 mobile:grid-cols-2">
                      {route.chainedRewards.map((reward) => (
                        <div key={`${route.id}-${reward}`} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
                          {reward}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {pagedRecommendations.items.map((recommendation) => (
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
          <p className="mt-3 text-sm text-slate-300">Cuando tengamos suficiente contexto de tus medidas y competencia, aqui veras rutas mas finas y medibles.</p>
        )}
        {strategicRoutes.length === 0 ? (
          <PaginationControls
            page={pagedRecommendations.page}
            totalPages={pagedRecommendations.totalPages}
            onChange={(page) => setSectionPage('recommendations', page)}
          />
        ) : null}
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        {stageHistory.length > 0 ? (
          <div className="mb-4 rounded-3xl border border-cyan-300/20 bg-cyan-950/15 p-4">
            <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
              <FaTrophy className="text-rv-gold" />
              Historial de etapas
            </h3>
            <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
              {stageHistory.slice(0, 6).map((entry) => (
                <div key={`${entry.stageSlug}-${entry.awardedAt}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-black text-white">{entry.stageName || entry.stageSlug}</p>
                  <p className="mt-1 text-xs text-slate-300">{entry.awardedReason}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {formatDate(entry.awardedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaMedal className="text-rv-gold" />
          Logros obtenidos
        </h3>
        {achievements.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {pagedEarnedAchievements.items.map((achievement) => (
              <div
                key={`earned-${achievement.achievementSlug}`}
                className="rounded-2xl border border-emerald-300/20 bg-emerald-950/10 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                      Desbloqueado
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{achievement.title}</p>
                  </div>
                  <StatusBadge tone="success">+{achievement.xpReward} XP</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{achievement.description}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-100">
                  Ganado el {formatDate(achievement.earnedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no has desbloqueado logros. Aqui veras tu historial completo cuando empieces a ganarlos.</p>
        )}
        <PaginationControls
          page={pagedEarnedAchievements.page}
          totalPages={pagedEarnedAchievements.totalPages}
          onChange={(page) => setSectionPage('earnedAchievements', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaTrophy className="text-rv-gold" />
          Descubrimientos sorpresa
        </h3>
        {discoveredHiddenRewards.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {pagedDiscoveredHiddenRewards.items.map((reward) => (
              <div key={reward.slug} className="rounded-2xl border border-cyan-300/20 bg-cyan-950/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Descubierto</p>
                    <p className="mt-1 text-lg font-black text-white">{reward.title}</p>
                  </div>
                  <StatusBadge tone="success">{reward.rewardLabel}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{reward.description}</p>
                <p className="mt-3 text-xs font-semibold text-cyan-100">Descubierto el {formatDate(reward.discoveredAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no has descubierto recompensas sorpresa persistidas.</p>
        )}
        <PaginationControls
          page={pagedDiscoveredHiddenRewards.page}
          totalPages={pagedDiscoveredHiddenRewards.totalPages}
          onChange={(page) => setSectionPage('discoveredHiddenRewards', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaRunning className="text-rv-gold" />
          Cadenas sorpresa
        </h3>
        {surpriseChains.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {pagedSurpriseChains.items.map((chain) => (
              <div key={chain.id} className="rounded-2xl border border-violet-300/20 bg-[linear-gradient(135deg,_rgba(139,92,246,0.12),_rgba(15,23,42,0.2)_55%,_rgba(34,211,238,0.08))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
                      {chain.status === 'revealed' ? 'Revelada' : chain.status === 'active' ? 'Activa' : 'Calentando'}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{chain.title}</p>
                  </div>
                  <StatusBadge tone={chain.status === 'revealed' ? 'success' : 'info'}>
                    {chain.progressLabel}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{chain.teaser}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Paso actual</p>
                <p className="mt-1 text-sm text-slate-100">{chain.currentStep}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Siguiente giro</p>
                <p className="mt-1 text-sm text-cyan-100">{chain.nextStep}</p>
                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-200">
                  {chain.rewardPreview}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Todavia no hay cadenas sorpresa activas sobre tus descubrimientos actuales.</p>
        )}
        <PaginationControls
          page={pagedSurpriseChains.page}
          totalPages={pagedSurpriseChains.totalPages}
          onChange={(page) => setSectionPage('surpriseChains', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaStar className="text-rv-gold" />
          Pistas ocultas persistidas
        </h3>
        {hiddenRewardHints.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {pagedHiddenRewardHints.items.map((reward) => (
              <div key={reward.slug} className="rounded-2xl border border-dashed border-sky-300/30 bg-sky-500/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">Pista sorpresa</p>
                    <p className="mt-1 text-lg font-black text-white">???</p>
                  </div>
                  <StatusBadge tone="warning">{reward.rewardLabel}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{reward.teaser}</p>
                <p className="mt-3 text-xs font-semibold text-sky-100">{reward.hint}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-300">
                    <span>Progreso oculto</span>
                    <span>{reward.progressValue}/{reward.targetValue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.max(8, reward.progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No hay pistas ocultas adicionales activas en este momento.</p>
        )}
        <PaginationControls
          page={pagedHiddenRewardHints.page}
          totalPages={pagedHiddenRewardHints.totalPages}
          onChange={(page) => setSectionPage('hiddenRewardHints', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaStar className="text-rv-gold" />
          Logros secretos
        </h3>
        {secretAchievements.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {pagedSecretAchievements.items.map((achievement) => (
              <div
                key={achievement.achievementSlug}
                className="rounded-2xl border border-dashed border-fuchsia-300/30 bg-fuchsia-500/5 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-200">
                      Logro secreto
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{achievement.title}</p>
                  </div>
                  <StatusBadge tone="warning">+{achievement.xpReward} XP</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-200">{achievement.description}</p>
                <p className="mt-3 text-xs font-semibold text-fuchsia-100">{achievement.hint}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-300">
                    <span>Pista de avance</span>
                    <span>{achievement.progressValue}/{achievement.targetValue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500 transition-all duration-500"
                      style={{ width: `${Math.max(8, achievement.progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no aparece ningun logro secreto por descubrir.</p>
        )}
        <PaginationControls
          page={pagedSecretAchievements.page}
          totalPages={pagedSecretAchievements.totalPages}
          onChange={(page) => setSectionPage('secretAchievements', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'achievements' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaLayerGroup className="text-rv-gold" />
          Logros por desbloquear
        </h3>
        {lockedAchievements.length > 0 ? (
          <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            {pagedLockedAchievements.items.map((achievement) => (
              <div
                key={achievement.achievementSlug}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                      Bloqueado
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
                      className="h-full rounded-full bg-gradient-to-r from-slate-300 to-rv-gold transition-all duration-500"
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
        <PaginationControls
          page={pagedLockedAchievements.page}
          totalPages={pagedLockedAchievements.totalPages}
          onChange={(page) => setSectionPage('lockedAchievements', page)}
        />
      </Card>

      <Card className={`mt-4 border-white/15 bg-black/25 ${selectedGoalsTab === 'challenges' ? '' : 'hidden'}`} padding="sm">
        <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
          <FaLockOpen className="text-rv-gold" />
          Lo que viene despues
        </h3>
        {upcomingChallenges.length > 0 ? (
          <div className="mt-3 grid gap-3 desktop:grid-cols-2">
            {pagedUpcomingChallenges.items.map((challenge) => (
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
        <PaginationControls
          page={pagedUpcomingChallenges.page}
          totalPages={pagedUpcomingChallenges.totalPages}
          onChange={(page) => setSectionPage('upcomingChallenges', page)}
        />
      </Card>
      </>
      ) : null}

      {selectedPanelTab === 'competition' ? (
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
              {COMPETITION_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setSelectedCompetitionFilter(filter.id);
                    setShowFullLeaderboard(false);
                  }}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                    selectedCompetitionFilter === filter.id
                      ? 'border-cyan-300/60 bg-cyan-400/12 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/35 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 desktop:grid-cols-3">
              {activeCompetitionSummary.map((card) => (
                <MiniInsight
                  key={`competition-${card.label}`}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  helper={card.helper}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {filteredLeaderboards.map((board) => (
                <button
                  key={board.type}
                  type="button"
                  onClick={() => {
                    setSelectedLeaderboardType(board.type);
                    setShowFullLeaderboard(false);
                  }}
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

            {filteredLeaderboards.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-slate-300">
                Aun no tienes tablas visibles en esta categoria competitiva. Sigue registrando actividad para activarla.
              </div>
            ) : null}

            {activeLeaderboard ? (
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
            ) : null}

            {activeLeaderboard ? (
            <div className="mt-3 grid gap-3 desktop:grid-cols-2">
              <div className="rounded-3xl border border-rv-gold/30 bg-[linear-gradient(135deg,_rgba(245,158,11,0.14),_rgba(15,23,42,0.3)_58%,_rgba(249,115,22,0.14))] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">Lider actual</p>
                {leaderboardLeader ? (
                  <div className="mt-3 flex items-start gap-3">
                    <IdentityPortrait
                      imageUrl={leaderboardLeader.profileImageUrl || leaderboardLeader.avatarUrl}
                      displayName={leaderboardLeader.publicAlias}
                      equipment={leaderboardLeader.cosmeticEquipment}
                      equippedItems={leaderboardLeader.equippedCosmeticItems}
                      size="md"
                      showBadgeLabel
                    />
                    <div className="min-w-0">
                      <p className="text-xl font-black text-white">{leaderboardLeader.publicAlias}</p>
                      {leaderboardLeader.equippedTitle?.name ? (
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                          {leaderboardLeader.equippedTitle.name}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-slate-200">
                        Marca a superar: <span className="font-black text-rv-gold">{leaderboardLeader.score} {leaderboardLeader.unit}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">Aun no hay un lider visible en esta tabla.</p>
                )}
              </div>

              <div className="rounded-3xl border border-cyan-300/25 bg-[linear-gradient(135deg,_rgba(34,211,238,0.14),_rgba(15,23,42,0.34)_58%,_rgba(14,165,233,0.1))] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Rival a superar</p>
                {rivalEntry ? (
                  <div className="mt-3 flex items-start gap-3">
                    <IdentityPortrait
                      imageUrl={rivalEntry.profileImageUrl || rivalEntry.avatarUrl}
                      displayName={rivalEntry.publicAlias}
                      equipment={rivalEntry.cosmeticEquipment}
                      equippedItems={rivalEntry.equippedCosmeticItems}
                      size="md"
                      showBadgeLabel
                    />
                    <div className="min-w-0">
                      <p className="text-xl font-black text-white">{rivalEntry.publicAlias}</p>
                      {rivalEntry.equippedTitle?.name ? (
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                          {rivalEntry.equippedTitle.name}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-slate-200">
                        {currentStudentLeaderboardEntry && rivalEntry.studentId !== currentStudentLeaderboardEntry.studentId
                          ? <>Te faltan <span className="font-black text-cyan-200">{rivalGap} {activeLeaderboard?.unit}</span> para alcanzarlo.</>
                          : 'Sigue sumando y aqui te mostraremos el competidor inmediato a superar.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">En cuanto existan mas participantes, aqui veras tu perseguidor natural.</p>
                )}
              </div>
            </div>
            ) : null}

            {featuredLeaderboardRows.length > 0 ? (
            <div className="mt-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
              {featuredLeaderboardRows.map((entry) => (
              <div
                key={`${activeLeaderboard?.type}-${entry.studentId}-${entry.rankPosition}`}
                className={`rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${getLeaderboardCardTone(entry.rankPosition, entry.isCurrentStudent)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <IdentityPortrait
                      imageUrl={entry.profileImageUrl || entry.avatarUrl}
                      displayName={entry.publicAlias}
                      equipment={entry.cosmeticEquipment}
                      equippedItems={entry.equippedCosmeticItems}
                      size="sm"
                      showBadgeLabel
                    />
                    <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                      {getPlacementLabel(entry.rankPosition)}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{entry.publicAlias}</p>
                    {entry.equippedTitle?.name ? (
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                        {entry.equippedTitle.name}
                      </p>
                    ) : null}
                    {entry.avatarModelName ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                        {entry.avatarModelName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-300">
                      {buildCompetitiveChaseText({
                        entry,
                        leader: leaderboardLeader,
                        rival: rivalEntry,
                        currentStudentEntry: currentStudentLeaderboardEntry,
                        unit: entry.unit,
                      })}
                    </p>
                  </div>
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
            ) : null}

            {activeLeaderboardRows.length > 3 ? (
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowFullLeaderboard((current) => !current)}>
                  {showFullLeaderboard ? 'Ocultar tabla completa' : 'Ver tabla completa'}
                </Button>
              </div>
            ) : null}

            {showFullLeaderboard ? (
            <div className="mt-4 grid gap-3">
              {pagedExpandedLeaderboardRows.items.map((entry) => (
                <div
                  key={`full-${activeLeaderboard?.type}-${entry.studentId}-${entry.rankPosition}`}
                  className={`rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${getLeaderboardCardTone(entry.rankPosition, entry.isCurrentStudent)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <IdentityPortrait
                        imageUrl={entry.profileImageUrl || entry.avatarUrl}
                        displayName={entry.publicAlias}
                        equipment={entry.cosmeticEquipment}
                        equippedItems={entry.equippedCosmeticItems}
                        size="sm"
                        showBadgeLabel
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                          {getPlacementLabel(entry.rankPosition)}
                        </p>
                        <p className="mt-1 text-lg font-black text-white">{entry.publicAlias}</p>
                        {entry.equippedTitle?.name ? (
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rv-gold">
                            {entry.equippedTitle.name}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-300">
                          {buildCompetitiveChaseText({
                            entry,
                            leader: leaderboardLeader,
                            rival: rivalEntry,
                            currentStudentEntry: currentStudentLeaderboardEntry,
                            unit: entry.unit,
                          })}
                        </p>
                      </div>
                    </div>
                    {entry.isCurrentStudent ? <StatusBadge tone="success">Tu</StatusBadge> : null}
                  </div>
                </div>
              ))}
              <PaginationControls
                page={pagedExpandedLeaderboardRows.page}
                totalPages={pagedExpandedLeaderboardRows.totalPages}
                onChange={(page) => setSectionPage('leaderboard', page)}
              />
            </div>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Aun no hay suficientes datos para mostrar el ranking de tu categoria.</p>
        )}
      </Card>
      ) : null}
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
      avatarStyle: PropTypes.string,
      avatarModelSlug: PropTypes.string,
      avatarModelMeta: PropTypes.object,
      avatarStyleOptions: PropTypes.array,
      avatarModelsByStyle: PropTypes.object,
      avatarModelOptions: PropTypes.shape({
        available: PropTypes.array,
        blocked: PropTypes.array,
      }),
      profileImageMode: PropTypes.string,
      profilePhotoUrl: PropTypes.string,
      profileImageUrl: PropTypes.string,
      avatarUrl: PropTypes.string,
      currentStage: PropTypes.shape({
        currentStageSlug: PropTypes.string,
        currentStageName: PropTypes.string,
        currentStageDescription: PropTypes.string,
        progressHint: PropTypes.string,
        metadata: PropTypes.object,
      }),
      stageHistory: PropTypes.array,
      equippedTitle: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
      availableTitles: PropTypes.array,
    }),
    currency: PropTypes.shape({
      balance: PropTypes.number,
      totalEarned: PropTypes.number,
      totalSpent: PropTypes.number,
      ledger: PropTypes.array,
    }),
    cosmetics: PropTypes.shape({
      inventoryCount: PropTypes.number,
      equipment: PropTypes.object,
      equippedItems: PropTypes.object,
      items: PropTypes.array,
    }),
    achievements: PropTypes.array,
    lockedAchievements: PropTypes.array,
    secretAchievements: PropTypes.array,
    discoveredHiddenRewards: PropTypes.array,
    hiddenRewardHints: PropTypes.array,
    surpriseChains: PropTypes.array,
    challenges: PropTypes.array,
    campaigns: PropTypes.array,
    strategicRoutes: PropTypes.array,
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
