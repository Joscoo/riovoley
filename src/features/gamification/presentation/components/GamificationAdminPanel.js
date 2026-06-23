import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaStore, FaTrophy, FaBullseye, FaPlus, FaEdit,
  FaToggleOn, FaToggleOff, FaTimes, FaSave, FaStar,
  FaGem, FaFire, FaCoins, FaShieldAlt, FaMedal, FaLock,
  FaUnlock, FaChevronDown,
  FaUpload, FaImage, FaVolleyballBall, FaBoxOpen,
} from 'react-icons/fa';
import { gamificationAdminService } from '../../gamificationAdminService';
import { SectionHeader, Button, Modal, DataTable, EmptyState, TabNav, StatusBadge, Input, Select, Textarea, FormField } from '../../../../shared/ui';
import IdentityPortrait from './IdentityPortrait';

// ── Octalysis Core Drivers ──────────────────────────────────────────────────
const CORE_DRIVERS = [
  'Epic Meaning & Calling',
  'Development & Accomplishment',
  'Empowerment of Creativity & Feedback',
  'Ownership & Possession',
  'Social Influence & Relatedness',
  'Scarcity & Impatience',
  'Unpredictability & Curiosity',
  'Loss & Avoidance',
];

// ── Cosmetic visual options ─────────────────────────────────────────────────
const FRAME_VARIANTS = [
  { value: 'studio',     label: 'Studio (blanco perlado)' },
  { value: 'satin',      label: 'Satin (acero frío)' },
  { value: 'ribbon',     label: 'Ribbon (rosa elegante)' },
  { value: 'glass',      label: 'Glass (negro profundo)' },
  { value: 'pulse',      label: 'Pulse (gris metálico)' },
  { value: 'flame',      label: 'Flame (fuego naranja)' },
  { value: 'arc-double', label: 'Arc Doble (cobalto)' },
  { value: 'elite',      label: 'Elite (neón cyan-índigo)' },
  { value: 'crown',      label: 'Crown (dorado legendario)' },
];

const BACKGROUND_VARIANTS = [
  { value: 'portrait',     label: 'Portrait (oscuro suave)' },
  { value: 'soft-focus',   label: 'Soft Focus (rosa oscuro)' },
  { value: 'spotlight',    label: 'Spotlight (negro puro)' },
  { value: 'speed',        label: 'Speed (azul noche)' },
  { value: 'speed-grid',   label: 'Speed Grid (cyan oscuro)' },
  { value: 'deep-ocean',   label: 'Deep Ocean (océano azul)' },
  { value: 'aurora-stage', label: 'Aurora Stage (índigo aurora)' },
  { value: 'summit-stage', label: 'Summit Stage (dorado cima)' },
];

const BADGE_VARIANTS = [
  { value: 'club-seal',    label: 'Sello Club (negro/plata)' },
  { value: 'flash',        label: 'Flash (cyan/azul)' },
  { value: 'lens',         label: 'Lens (oscuro/ámbar)' },
  { value: 'attendance',   label: 'Racha (negro/verde)' },
  { value: 'record',       label: 'Record (marrón/dorado)' },
  { value: 'forge',        label: 'Forja (rojo/naranja)' },
  { value: 'crown-podium', label: 'Podio Corona (dorado/índigo)' },
];

const BADGE_ICONS = [
  { value: 'shield', label: 'Escudo',   icon: <FaShieldAlt /> },
  { value: 'star',   label: 'Estrella', icon: <FaStar /> },
  { value: 'medal',  label: 'Medalla',  icon: <FaMedal /> },
  { value: 'fire',   label: 'Fuego',    icon: <FaFire /> },
];

const EFFECT_VARIANTS = [
  { value: 'halo',        label: 'Halo (blanco suave)' },
  { value: 'sparkle',     label: 'Sparkle (destello cyan)' },
  { value: 'pulse',       label: 'Pulse (pulso ámbar)' },
  { value: 'glow',        label: 'Glow (aura brillante)' },
  { value: 'crown-burst', label: 'Corona Voltaje (legendario dorado)' },
];

const EFFECT_GLOWS = [
  { value: 'pearl',   label: 'Perla' },
  { value: 'cyan',    label: 'Cyan' },
  { value: 'amber',   label: 'Ámbar' },
  { value: 'gold',    label: 'Dorado' },
  { value: 'violet',  label: 'Violeta' },
  { value: 'magenta', label: 'Magenta' },
];

const UNLOCK_TYPES = [
  { value: 'purchase',          label: 'Compra con monedas' },
  { value: 'level',             label: 'Nivel requerido' },
  { value: 'streak',            label: 'Racha mensual' },
  { value: 'achievement_count', label: 'Cantidad de logros' },
  { value: 'leaderboard_top',   label: 'Top del ranking' },
];

const CRITERION_TYPES = [
  { value: 'tests_count',    label: 'Número de tests' },
  { value: 'delta',          label: 'Mejora en salto (cm)' },
  { value: 'strength_delta', label: 'Mejora en fuerza (reps)' },
  { value: 'monthly_streak', label: 'Racha mensual (meses)' },
  { value: 'attendance_count',label: 'Asistencias' },
];

const JUMP_METRICS = [
  { value: 'brazo_extend_con_impulso', label: 'Brazo extendido con impulso' },
  { value: 'brazo_extend_sin_impulso', label: 'Brazo extendido sin impulso' },
  { value: 'altura_bloqueo',           label: 'Altura de bloqueo' },
];

const RIOVOLEY_PRODUCT_TYPES = [
  { value: 'camiseta',   label: '👕 Camiseta' },
  { value: 'balon',      label: '🏐 Balón' },
  { value: 'accesorio',  label: '🎽 Accesorio' },
  { value: 'otro',       label: '📦 Otro' },
];

const RARITY_LABELS = {
  common:    'Común',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Legendario',
};

const RARITY_COLORS = {
  common:    'bg-slate-200 text-slate-700',
  rare:      'bg-blue-100 text-blue-800',
  epic:      'bg-purple-100 text-purple-800',
  legendary: 'bg-amber-100 text-amber-900',
};

const CATEGORY_LABELS = {
  frame:        'Marco de avatar',
  background:   'Fondo de avatar',
  badge:        'Insignia de avatar',
  effect:       'Efecto de avatar',
  custom_frame: 'Marco personalizado',
  riovoley:     'Merch Riovoley',
};

const WINDOW_LABELS = {
  'rolling':        'Rodante',
  'calendar-month': 'Mes calendario',
};

const PAGE_SIZE = 10;

// ── Hooks ───────────────────────────────────────────────────────────────────

const usePagination = (items, pageSize = PAGE_SIZE) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const pageItems  = items.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [items.length]);

  return { pageItems, page: safePage, totalPages, setPage, total: items.length };
};

// ── Shared UI ───────────────────────────────────────────────────────────────

const ToggleButton = ({ active, onClick, loading }) => (
  <button type="button" onClick={onClick} disabled={loading} title={active ? 'Desactivar' : 'Activar'}
    className={`text-xl transition-colors disabled:opacity-40 ${
      active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
    }`}>
    {active ? <FaToggleOn /> : <FaToggleOff />}
  </button>
);

const FlashMsg = ({ msg }) => msg ? (
  <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${
    msg.type === 'success'
      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border border-red-500/30 bg-red-500/10 text-red-300'
  }`}>{msg.text}</div>
) : null;

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 pt-1">
    <div className="h-px flex-1 bg-slate-700" />
    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
    <div className="h-px flex-1 bg-slate-700" />
  </div>
);



// ── Cosmetic Preview ────────────────────────────────────────────────────────

const CosmeticPreview = ({ form }) => {
  const { category, rarity, frameVariant, backgroundVariant, badgeVariant, badgeIcon,
          effectVariant, effectGlow, imageUrl: formImageUrl } = form;

  // Build equippedItems for IdentityPortrait
  const equippedItems = {};
  if (category === 'frame') {
    equippedItems.frame = { slug: 'preview', rarity, metadata: { frameVariant } };
  }
  if (category === 'background') {
    equippedItems.background = { slug: 'preview', rarity, metadata: { backgroundVariant } };
  }
  if (category === 'badge') {
    equippedItems.badge = { slug: 'preview', name: 'Preview', rarity, metadata: { badgeVariant, icon: badgeIcon } };
  }
  if (category === 'effect') {
    equippedItems.effect = { slug: 'preview', rarity, metadata: { effectVariant, glow: effectGlow } };
  }

  const isCustom   = category === 'custom_frame';
  const isRiovoley = category === 'riovoley';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Preview</p>
      {isRiovoley ? (
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
          {formImageUrl ? (
            <img src={formImageUrl} alt="Producto" className="h-full w-full object-cover" />
          ) : (
            <FaBoxOpen className="text-4xl text-slate-600" />
          )}
        </div>
      ) : isCustom ? (
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-600 bg-slate-800/50">
          {formImageUrl ? (
            <img src={formImageUrl} alt="Marco personalizado" className="h-full w-full object-contain" />
          ) : (
            <FaImage className="text-4xl text-slate-600" />
          )}
        </div>
      ) : (
        <IdentityPortrait
          equippedItems={equippedItems}
          size="lg"
          className="mx-auto"
        />
      )}
      <p className="text-center text-xs text-slate-500">
        {CATEGORY_LABELS[category] || category}
      </p>
    </div>
  );
};

// ── Image Upload Field ──────────────────────────────────────────────────────

const ImageUploadField = ({ slug, onUploaded, currentUrl, disabled }) => {
  const inputRef  = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [preview,   setPreview]   = useState(currentUrl || null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Imagen demasiado grande (máx 2 MB)'); return; }
    if (!slug) { setError('Guarda el cosmético primero para obtener un slug'); return; }

    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const url = await gamificationAdminService.uploadCosmeticAsset({ file, slug });
      onUploaded(url);
    } catch (e) {
      setError(e.message);
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
          uploading ? 'border-rv-gold/40 bg-rv-gold/5' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-[120px] max-w-[120px] rounded-lg object-contain" />
        ) : (
          <>
            <FaUpload className="text-2xl text-slate-500" />
            <p className="text-center text-xs text-slate-500">
              {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir PNG/WebP (máx 2 MB)'}
            </p>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rv-gold border-t-transparent" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/webp,image/jpeg" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} disabled={disabled || uploading} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

// ── Cosmetics Tab ───────────────────────────────────────────────────────────

const COSMETIC_EMPTY = {
  slug: '', name: '', description: '',
  rarity: 'common', category: 'frame',
  price_coins: 0, sort_order: 0, is_active: true,
  frameVariant: 'studio', backgroundVariant: 'portrait',
  badgeVariant: 'club-seal', badgeIcon: 'shield',
  effectVariant: 'halo', effectGlow: 'cyan',
  unlockType: 'purchase', unlockTarget: '', unlockHint: 'Disponible para comprar con monedas.',
  imageUrl: '',
  productType: 'camiseta', stock: '', redemptionInstructions: '',
};

const flatToForm = (item = {}) => {
  const m = item.metadata || {};
  return {
    slug:                    item.slug || '',
    name:                    item.name || '',
    description:             item.description || '',
    rarity:                  item.rarity || 'common',
    category:                item.category || 'frame',
    price_coins:             item.price_coins ?? 0,
    sort_order:              item.sort_order  ?? 0,
    is_active:               item.is_active   !== false,
    frameVariant:            m.frameVariant      || 'studio',
    backgroundVariant:       m.backgroundVariant || 'portrait',
    badgeVariant:            m.badgeVariant      || 'club-seal',
    badgeIcon:               m.icon              || 'shield',
    effectVariant:           m.effectVariant     || 'halo',
    effectGlow:              m.glow              || 'cyan',
    unlockType:              m.unlockType        || 'purchase',
    unlockTarget:            m.unlockTarget != null ? String(m.unlockTarget) : '',
    unlockHint:              m.unlockHint        || 'Disponible para comprar con monedas.',
    imageUrl:                m.imageUrl          || '',
    productType:             m.productType       || 'camiseta',
    stock:                   m.stock != null      ? String(m.stock) : '',
    redemptionInstructions:  m.redemptionInstructions || '',
  };
};

const formToItem = (form) => {
  const meta = {};
  if (form.category === 'frame')        meta.frameVariant      = form.frameVariant;
  if (form.category === 'background')   meta.backgroundVariant = form.backgroundVariant;
  if (form.category === 'badge')        { meta.badgeVariant = form.badgeVariant; meta.icon = form.badgeIcon; }
  if (form.category === 'effect')       { meta.effectVariant = form.effectVariant; meta.glow = form.effectGlow; }
  if (form.category === 'custom_frame') { meta.imageUrl = form.imageUrl; }
  if (form.category === 'riovoley') {
    meta.imageUrl                = form.imageUrl;
    meta.productType             = form.productType;
    meta.redemptionInstructions  = form.redemptionInstructions;
    if (form.stock !== '') meta.stock = Number(form.stock);
  }
  meta.unlockType = form.unlockType;
  meta.unlockHint = form.unlockHint;
  if (form.unlockType !== 'purchase' && form.unlockTarget !== '') meta.unlockTarget = Number(form.unlockTarget);

  return {
    slug: form.slug, name: form.name, description: form.description,
    rarity: form.rarity, category: form.category,
    price_coins: Number(form.price_coins), sort_order: Number(form.sort_order),
    is_active: form.is_active, metadata: meta,
  };
};

const CosmeticForm = ({ initial, isNew, onSave, onCancel, saving, error: formError }) => {
  const [form, setForm] = useState(() => ({ ...COSMETIC_EMPTY, ...flatToForm(initial) }));
  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setN = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const setB = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }));
  const setV = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const needsTarget    = form.unlockType !== 'purchase';
  const isImageBased   = form.category === 'custom_frame' || form.category === 'riovoley';
  const isAvatarBased  = !isImageBased;
  const isRiovoley     = form.category === 'riovoley';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_160px]">
      {/* Form fields */}
      <form id="cosmetic-form" onSubmit={(e) => { e.preventDefault(); onSave(formToItem(form)); }} className="flex flex-col gap-5">
        {isNew && (
          <FormField label="Slug" required hint="Solo letras, números y guión bajo. No se puede cambiar después.">
            <Input value={form.slug} onChange={set('slug')} placeholder="frame_dorado_elite" required />
          </FormField>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" required>
            <Input value={form.name} onChange={set('name')} placeholder="Marco Dorado Elite" required />
          </FormField>
          <FormField label="Categoría" required>
            <div className="relative">
              <Select className={` pr-8`} value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            </div>
          </FormField>
        </div>

        <FormField label="Descripción" required>
          <Textarea className={` min-h-[68px] resize-y`} value={form.description} onChange={set('description')} placeholder="Descripción visible para el jugador" required />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Rareza" required>
            <div className="relative">
              <Select className={` pr-8`} value={form.rarity} onChange={set('rarity')}>
                {Object.entries(RARITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            </div>
          </FormField>
          <FormField label={isRiovoley ? 'Precio (monedas canje)' : 'Precio (monedas)'} required>
            <Input type="number" min={0} value={form.price_coins} onChange={setN('price_coins')} />
          </FormField>
          <FormField label="Orden">
            <Input type="number" min={0} value={form.sort_order} onChange={setN('sort_order')} />
          </FormField>
        </div>

        {/* Visual fields by category */}
        {isAvatarBased && (
          <>
            <SectionDivider label="Apariencia visual" />
            {form.category === 'frame' && (
              <FormField label="Variante de marco" required hint="Estilo visual del borde del avatar">
                <div className="relative">
                  <Select className={` pr-8`} value={form.frameVariant} onChange={set('frameVariant')}>
                    {FRAME_VARIANTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                  <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                </div>
              </FormField>
            )}
            {form.category === 'background' && (
              <FormField label="Variante de fondo" required hint="Gradiente de fondo de la tarjeta">
                <div className="relative">
                  <Select className={` pr-8`} value={form.backgroundVariant} onChange={set('backgroundVariant')}>
                    {BACKGROUND_VARIANTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                  <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                </div>
              </FormField>
            )}
            {form.category === 'badge' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Variante de insignia" required>
                  <div className="relative">
                    <Select className={` pr-8`} value={form.badgeVariant} onChange={set('badgeVariant')}>
                      {BADGE_VARIANTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                  </div>
                </FormField>
                <FormField label="Ícono" required>
                  <div className="relative">
                    <Select className={` pr-8`} value={form.badgeIcon} onChange={set('badgeIcon')}>
                      {BADGE_ICONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                  </div>
                </FormField>
              </div>
            )}
            {form.category === 'effect' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Variante de efecto" required>
                  <div className="relative">
                    <Select className={` pr-8`} value={form.effectVariant} onChange={set('effectVariant')}>
                      {EFFECT_VARIANTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                  </div>
                </FormField>
                <FormField label="Color de resplandor" required>
                  <div className="relative">
                    <Select className={` pr-8`} value={form.effectGlow} onChange={set('effectGlow')}>
                      {EFFECT_GLOWS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                  </div>
                </FormField>
              </div>
            )}
          </>
        )}

        {/* Image upload for custom_frame / riovoley */}
        {isImageBased && (
          <>
            <SectionDivider label={isRiovoley ? 'Imagen del producto' : 'Imagen del marco (PNG transparente)'} />
            <ImageUploadField
              slug={form.slug}
              currentUrl={form.imageUrl}
              onUploaded={(url) => setV('imageUrl', url)}
            />
            {form.imageUrl && (
              <FormField label="URL de imagen (resultante)">
                <Input value={form.imageUrl} readOnly />
              </FormField>
            )}
          </>
        )}

        {/* Riovoley-specific fields */}
        {isRiovoley && (
          <>
            <SectionDivider label="Detalles del producto" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tipo de producto" required>
                <div className="relative">
                  <Select className={` pr-8`} value={form.productType} onChange={set('productType')}>
                    {RIOVOLEY_PRODUCT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                  <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                </div>
              </FormField>
              <FormField label="Stock disponible" hint="Dejar vacío si es ilimitado">
                <Input type="number" min={0} value={form.stock} onChange={set('stock')} placeholder="Ej: 20" />
              </FormField>
            </div>
            <FormField label="Instrucciones de canje" hint="Cómo el alumno puede canjear este premio">
              <Textarea className={` min-h-[60px] resize-y`} value={form.redemptionInstructions} onChange={set('redemptionInstructions')} placeholder="Ej: Preséntate a la recepción con tu código de canje." />
            </FormField>
          </>
        )}

        {/* Unlock */}
        <SectionDivider label="Condición de desbloqueo" />
        <FormField label="Tipo de desbloqueo" required>
          <div className="relative">
            <Select className={` pr-8`} value={form.unlockType} onChange={set('unlockType')}>
              {UNLOCK_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </FormField>
        {needsTarget && (
          <FormField label={
            form.unlockType === 'level' ? 'Nivel requerido' :
            form.unlockType === 'streak' ? 'Meses de racha' :
            form.unlockType === 'achievement_count' ? 'Cantidad de logros' : 'Posición en ranking'
          } required>
            <Input type="number" min={1} value={form.unlockTarget} onChange={set('unlockTarget')} placeholder="Ej: 5" required />
          </FormField>
        )}
        <FormField label="Pista de desbloqueo">
          <Input value={form.unlockHint} onChange={set('unlockHint')} placeholder="Ej: Desbloquea al llegar al nivel 5." />
        </FormField>

        {/* Estado */}
        <div className="flex items-center gap-3">
          <ToggleButton active={form.is_active} onClick={setB('is_active')} />
          <span className="text-sm text-slate-300">{form.is_active ? 'Activo' : 'Inactivo'}</span>
        </div>

        {formError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}><FaTimes className="mr-2" /> Cancelar</Button>
          <Button form="cosmetic-form" type="submit" isLoading={saving} loadingText="Guardando..."><FaSave className="mr-2" /> Guardar</Button>
        </div>
      </form>

      {/* Live preview column */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-4">
        <CosmeticPreview form={form} />
        {form.category === 'riovoley' && (
          <div className="rounded-xl border border-rv-gold/20 bg-rv-gold/5 p-3 text-xs text-rv-gold">
            <FaVolleyballBall className="mb-1.5 text-lg" />
            <p className="font-bold">Merch Riovoley</p>
            <p className="mt-1 opacity-80">Los alumnos compran con monedas y canJean en persona.</p>
          </div>
        )}
        {form.category === 'custom_frame' && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-purple-300">
            <FaImage className="mb-2 text-xl" />
            <p className="font-bold text-sm mb-1.5">Requisitos del Marco</p>
            <ul className="list-inside list-disc space-y-1 text-purple-400/80">
              <li>Formato cuadrado 1:1 (recomendado 256x256 px).</li>
              <li>Fondo y centro <strong className="text-purple-300">totalmente transparentes</strong>.</li>
              <li>El diseño debe ir solo en los bordes.</li>
              <li>Formatos: PNG o WebP.</li>
              <li>Peso máximo: 2 MB.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const CosmeticsTab = () => {
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [isNew,    setIsNew]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState(null);
  const [msg,      setMsg]      = useState(null);
  const [toggling, setToggling] = useState(null);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };
  const load  = useCallback(async () => {
    setLoading(true);
    try   { setAll(await gamificationAdminService.listCosmeticCatalog()); }
    catch (e) { flash('error', e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = all.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.slug.includes(search.toLowerCase());
    const matchCat    = !catFilter || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const { pageItems, page, totalPages, setPage } = usePagination(filtered);

  const handleSave = async (item) => {
    setSaving(true); setFormErr(null);
    try {
      await gamificationAdminService.upsertCosmeticItem({ item, isNew });
      flash('success', isNew ? 'Cosmético creado' : 'Cosmético actualizado');
      setEditItem(null); load();
    } catch (e) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item) => {
    setToggling(item.slug);
    try {
      await gamificationAdminService.upsertCosmeticItem({ item: { ...item, is_active: !item.is_active }, isNew: false });
      flash('success', `Cosmético ${!item.is_active ? 'activado' : 'desactivado'}`);
      load();
    } catch (e) { flash('error', e.message); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            className="max-w-[200px]"
            placeholder="Buscar nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="relative">
            <Select className={` max-w-[160px] pr-8`} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </div>
        <Button onClick={() => { setEditItem({ ...COSMETIC_EMPTY }); setIsNew(true); setFormErr(null); }} size="sm">
          <FaPlus className="mr-2" /> Nuevo cosmético
        </Button>
      </div>

      <FlashMsg msg={msg} />

      {editItem && (
        <Modal
          title={isNew ? 'Nuevo cosmético' : `Editar: ${editItem.name}`}
          icon={<FaGem className="text-purple-400" />}
          onClose={() => setEditItem(null)}
        >
          <CosmeticForm initial={editItem} isNew={isNew} onSave={handleSave} onCancel={() => setEditItem(null)} saving={saving} error={formErr} />
        </Modal>
      )}

      {loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaStore />}
          title={search || catFilter ? "Sin resultados" : "No hay cosméticos"}
          description={search || catFilter ? "Intenta cambiar los filtros de búsqueda" : "No hay cosméticos registrados"}
        />
      ) : (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900 shadow-sm overflow-hidden">
          <DataTable
            columns={[
              { key: 'preview', label: '' },
              { key: 'name', label: 'Nombre' },
              { key: 'category', label: 'Categoría' },
              { key: 'variant', label: 'Variante' },
              { key: 'rarity', label: 'Rareza' },
              { key: 'price', label: 'Precio' },
              { key: 'unlock', label: 'Desbloqueo' },
              { key: 'status', label: 'Estado' },
              { key: 'actions', label: '' },
            ]}
            rows={pageItems}
            keyExtractor={(item) => item.slug}
            renderRow={(item) => {
              const m       = item.metadata || {};
              const variant = m.frameVariant || m.backgroundVariant || m.badgeVariant || m.effectVariant || '—';
              const unlock  = m.unlockType === 'purchase' ? 'Compra' : m.unlockType || '—';
              const isImg   = item.category === 'custom_frame' || item.category === 'riovoley';

              const miniEquipped = {};
              if (item.category === 'frame') miniEquipped.frame = { slug: item.slug, rarity: item.rarity, metadata: m };
              if (item.category === 'background') miniEquipped.background = { slug: item.slug, rarity: item.rarity, metadata: m };
              if (item.category === 'badge') miniEquipped.badge = { slug: item.slug, name: item.name, rarity: item.rarity, metadata: m };
              if (item.category === 'effect') miniEquipped.effect = { slug: item.slug, rarity: item.rarity, metadata: m };

              return (
                <>
                  <td className="px-4 py-3 w-16">
                    {isImg ? (
                      m.imageUrl
                        ? <img src={m.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-slate-700" />
                        : <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-500"><FaImage /></div>
                    ) : (
                      <IdentityPortrait equippedItems={miniEquipped} size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{isImg ? (m.productType || '—') : variant}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${RARITY_COLORS[item.rarity] || 'bg-slate-700 text-slate-300'}`}>
                      {RARITY_LABELS[item.rarity] || item.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                      <FaCoins className="text-amber-500/70" /> {item.price_coins}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      {m.unlockType === 'purchase' ? <FaUnlock className="text-emerald-400" /> : <FaLock className="text-slate-500" />}
                      {unlock}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Inactivo'}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => { setEditItem(item); setIsNew(false); setFormErr(null); }} className="text-blue-400 hover:text-white transition-colors"><FaEdit /></button>
                      <ToggleButton active={item.is_active} onClick={() => handleToggle(item)} loading={toggling === item.slug} />
                    </div>
                  </td>
                </>
              );
            }}
            minWidth="900px"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

// ── Achievements Tab ────────────────────────────────────────────────────────

const ACHIEVEMENT_EMPTY = {
  slug: '', title: '', description: '',
  core_driver: CORE_DRIVERS[1], xp_reward: 100, sort_order: 0, is_active: true,
  criteriaType: 'tests_count', criteriaMin: 1, criteriaMetric: JUMP_METRICS[0].value,
};

const achievementToForm = (item = {}) => {
  const c = item.criteria || {};
  return {
    slug:          item.slug        || '',
    title:         item.title       || '',
    description:   item.description || '',
    core_driver:   item.core_driver || CORE_DRIVERS[1],
    xp_reward:     item.xp_reward   ?? 100,
    sort_order:    item.sort_order  ?? 0,
    is_active:     item.is_active   !== false,
    criteriaType:  c.type           || 'tests_count',
    criteriaMin:   c.min            ?? 1,
    criteriaMetric:c.metric         || JUMP_METRICS[0].value,
  };
};

const formToAchievement = (form) => {
  const criteria = { type: form.criteriaType, min: Number(form.criteriaMin) };
  if (form.criteriaType === 'delta') criteria.metric = form.criteriaMetric;
  return {
    slug: form.slug, title: form.title, description: form.description,
    core_driver: form.core_driver, xp_reward: Number(form.xp_reward),
    sort_order: Number(form.sort_order), is_active: form.is_active, criteria,
  };
};

const AchievementForm = ({ initial, isNew, onSave, onCancel, saving, error: formError }) => {
  const [form, setForm] = useState(() => ({ ...ACHIEVEMENT_EMPTY, ...achievementToForm(initial) }));
  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setN = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const setB = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }));

  return (
    <form id="achievement-form" onSubmit={(e) => { e.preventDefault(); onSave(formToAchievement(form)); }} className="flex flex-col gap-5">
      {isNew && (
        <FormField label="Slug" required hint="Solo letras, números y guión bajo. No se puede cambiar después.">
          <Input value={form.slug} onChange={set('slug')} placeholder="salto_cinco_cm" required />
        </FormField>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Título" required>
          <Input value={form.title} onChange={set('title')} placeholder="Primer gran salto" required />
        </FormField>
        <FormField label="Core Driver (Octalysis)" required>
          <div className="relative">
            <Select className={` pr-8`} value={form.core_driver} onChange={set('core_driver')}>
              {CORE_DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </FormField>
      </div>
      <FormField label="Descripción" required>
        <Textarea className={` min-h-[68px] resize-y`} value={form.description} onChange={set('description')} placeholder="Lo que ve el jugador sobre este logro" required />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Recompensa XP" required>
          <Input type="number" min={0} value={form.xp_reward} onChange={setN('xp_reward')} />
        </FormField>
        <FormField label="Orden">
          <Input type="number" min={0} value={form.sort_order} onChange={setN('sort_order')} />
        </FormField>
      </div>
      <SectionDivider label="Criterio de desbloqueo" />
      <FormField label="Tipo de criterio" required>
        <div className="relative">
          <Select className={` pr-8`} value={form.criteriaType} onChange={set('criteriaType')}>
            {CRITERION_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
        </div>
      </FormField>
      {form.criteriaType === 'delta' && (
        <FormField label="Métrica de salto" required>
          <div className="relative">
            <Select className={` pr-8`} value={form.criteriaMetric} onChange={set('criteriaMetric')}>
              {JUMP_METRICS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </FormField>
      )}
      <FormField label={form.criteriaType === 'delta' ? 'Mejora mínima (cm)' : form.criteriaType === 'strength_delta' ? 'Mejora mínima (reps)' : 'Valor mínimo'} required>
        <Input type="number" min={0} step="0.1" value={form.criteriaMin} onChange={setN('criteriaMin')} required />
      </FormField>
      <div className="flex items-center gap-3">
        <ToggleButton active={form.is_active} onClick={setB('is_active')} />
        <span className="text-sm text-slate-300">{form.is_active ? 'Activo' : 'Inactivo'}</span>
      </div>
      {formError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}><FaTimes className="mr-2" /> Cancelar</Button>
        <Button form="achievement-form" type="submit" isLoading={saving} loadingText="Guardando..."><FaSave className="mr-2" /> Guardar</Button>
      </div>
    </form>
  );
};

const AchievementsTab = () => {
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [isNew,    setIsNew]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState(null);
  const [msg,      setMsg]      = useState(null);
  const [toggling, setToggling] = useState(null);
  const [search,   setSearch]   = useState('');

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };
  const load  = useCallback(async () => {
    setLoading(true);
    try   { setAll(await gamificationAdminService.listAchievementCatalog()); }
    catch (e) { flash('error', e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = all.filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.slug.includes(search.toLowerCase()));
  const { pageItems, page, totalPages, setPage } = usePagination(filtered);

  const handleSave = async (item) => {
    setSaving(true); setFormErr(null);
    try {
      await gamificationAdminService.upsertAchievement({ item, isNew });
      flash('success', isNew ? 'Logro creado' : 'Logro actualizado');
      setEditItem(null); load();
    } catch (e) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item) => {
    setToggling(item.slug);
    try {
      await gamificationAdminService.upsertAchievement({ item: { ...item, is_active: !item.is_active }, isNew: false });
      flash('success', `Logro ${!item.is_active ? 'activado' : 'desactivado'}`);
      load();
    } catch (e) { flash('error', e.message); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input className="max-w-[240px]" placeholder="Buscar logros..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={() => { setEditItem({ ...ACHIEVEMENT_EMPTY }); setIsNew(true); setFormErr(null); }} size="sm">
          <FaPlus className="mr-2" /> Nuevo logro
        </Button>
      </div>
      <FlashMsg msg={msg} />
      {editItem && (
        <Modal title={isNew ? 'Nuevo logro' : `Editar: ${editItem.title}`} icon={<FaTrophy className="text-amber-400" />} onClose={() => setEditItem(null)}>
          <AchievementForm initial={editItem} isNew={isNew} onSave={handleSave} onCancel={() => setEditItem(null)} saving={saving} error={formErr} />
        </Modal>
      )}
      {loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaTrophy />}
          title={search ? "Sin resultados" : "No hay logros"}
          description={search ? "Intenta cambiar los filtros de búsqueda" : "No hay logros registrados"}
        />
      ) : (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900 shadow-sm overflow-hidden">
          <DataTable
            columns={[
              { key: 'title', label: 'Título' },
              { key: 'coreDriver', label: 'Core Driver' },
              { key: 'criteria', label: 'Criterio' },
              { key: 'xp', label: 'XP' },
              { key: 'status', label: 'Estado' },
              { key: 'actions', label: '' },
            ]}
            rows={pageItems}
            keyExtractor={(item) => item.slug}
            renderRow={(item) => {
              const c = item.criteria || {};
              const criteriaLabel =
                c.type === 'tests_count'    ? `${c.min} test(s)` :
                c.type === 'delta'          ? `+${c.min} cm` :
                c.type === 'monthly_streak' ? `${c.min} mes(es)` :
                c.type === 'strength_delta' ? `+${c.min} reps` :
                `${c.type}: ${c.min}`;
              return (
                <>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.slug}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <span className="text-xs text-slate-400 line-clamp-2">{item.core_driver}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{criteriaLabel}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-300">
                      <FaStar className="text-indigo-400/70" /> {item.xp_reward}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Inactivo'}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => { setEditItem(item); setIsNew(false); setFormErr(null); }} className="text-blue-400 hover:text-white transition-colors"><FaEdit /></button>
                      <ToggleButton active={item.is_active} onClick={() => handleToggle(item)} loading={toggling === item.slug} />
                    </div>
                  </td>
                </>
              );
            }}
            minWidth="700px"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

// ── Goals Tab ───────────────────────────────────────────────────────────────

const GOAL_EMPTY = {
  slug: '', title: '', description: '',
  core_driver: CORE_DRIVERS[7], target_metric: '', target_value: 1,
  window_type: 'rolling', is_active: true, start_date: '', end_date: '',
};

const GoalForm = ({ initial, isNew, onSave, onCancel, saving, error: formError }) => {
  const [form, setForm] = useState(() => ({ ...GOAL_EMPTY, ...initial }));
  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setN = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const setB = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }));

  return (
    <form id="goal-form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, start_date: form.start_date || null, end_date: form.end_date || null }); }} className="flex flex-col gap-5">
      {isNew && (
        <FormField label="Slug" required hint="Solo letras, números y guión bajo.">
          <Input value={form.slug} onChange={set('slug')} placeholder="salto_mayo" required />
        </FormField>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Título" required>
          <Input value={form.title} onChange={set('title')} placeholder="Meta del mes" required />
        </FormField>
        <FormField label="Core Driver (Octalysis)" required>
          <div className="relative">
            <Select className={` pr-8`} value={form.core_driver} onChange={set('core_driver')}>
              {CORE_DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </FormField>
      </div>
      <FormField label="Descripción" required>
        <Textarea className={` min-h-[68px] resize-y`} value={form.description} onChange={set('description')} placeholder="Lo que ve el jugador" required />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Métrica objetivo" required hint="Ej: monthly_tests">
          <Input value={form.target_metric} onChange={set('target_metric')} placeholder="monthly_tests" required />
        </FormField>
        <FormField label="Valor objetivo" required>
          <Input type="number" min={0} step="0.01" value={form.target_value} onChange={setN('target_value')} />
        </FormField>
        <FormField label="Ventana" required>
          <div className="relative">
            <Select className={` pr-8`} value={form.window_type} onChange={set('window_type')}>
              {Object.entries(WINDOW_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          </div>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fecha inicio (opcional)">
          <Input type="date" value={form.start_date || ''} onChange={set('start_date')} />
        </FormField>
        <FormField label="Fecha fin (opcional)">
          <Input type="date" value={form.end_date || ''} onChange={set('end_date')} />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <ToggleButton active={form.is_active} onClick={setB('is_active')} />
        <span className="text-sm text-slate-300">{form.is_active ? 'Activo' : 'Inactivo'}</span>
      </div>
      {formError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}><FaTimes className="mr-2" /> Cancelar</Button>
        <Button form="goal-form" type="submit" isLoading={saving} loadingText="Guardando..."><FaSave className="mr-2" /> Guardar</Button>
      </div>
    </form>
  );
};

const GoalsTab = () => {
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [isNew,    setIsNew]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState(null);
  const [msg,      setMsg]      = useState(null);
  const [toggling, setToggling] = useState(null);
  const [search,   setSearch]   = useState('');

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };
  const load  = useCallback(async () => {
    setLoading(true);
    try   { setAll(await gamificationAdminService.listGoalsCatalog()); }
    catch (e) { flash('error', e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = all.filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.slug.includes(search.toLowerCase()));
  const { pageItems, page, totalPages, setPage } = usePagination(filtered);

  const handleSave = async (item) => {
    setSaving(true); setFormErr(null);
    try {
      await gamificationAdminService.upsertGoal({ item, isNew });
      flash('success', isNew ? 'Meta creada' : 'Meta actualizada');
      setEditItem(null); load();
    } catch (e) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item) => {
    setToggling(item.slug);
    try {
      await gamificationAdminService.upsertGoal({ item: { ...item, is_active: !item.is_active }, isNew: false });
      flash('success', `Meta ${!item.is_active ? 'activada' : 'desactivada'}`);
      load();
    } catch (e) { flash('error', e.message); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input className="max-w-[240px]" placeholder="Buscar metas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={() => { setEditItem({ ...GOAL_EMPTY }); setIsNew(true); setFormErr(null); }} size="sm">
          <FaPlus className="mr-2" /> Nueva meta
        </Button>
      </div>
      <FlashMsg msg={msg} />
      {editItem && (
        <Modal title={isNew ? 'Nueva meta' : `Editar: ${editItem.title}`} icon={<FaBullseye className="text-red-400" />} onClose={() => setEditItem(null)}>
          <GoalForm initial={editItem} isNew={isNew} onSave={handleSave} onCancel={() => setEditItem(null)} saving={saving} error={formErr} />
        </Modal>
      )}
      {loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaBullseye />}
          title={search ? "Sin resultados" : "No hay metas"}
          description={search ? "Intenta cambiar los filtros de búsqueda" : "No hay metas registradas"}
        />
      ) : (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900 shadow-sm overflow-hidden">
          <DataTable
            columns={[
              { key: 'title', label: 'Título' },
              { key: 'coreDriver', label: 'Core Driver' },
              { key: 'metric', label: 'Métrica' },
              { key: 'value', label: 'Valor' },
              { key: 'window', label: 'Ventana' },
              { key: 'status', label: 'Estado' },
              { key: 'actions', label: '' },
            ]}
            rows={pageItems}
            keyExtractor={(item) => item.slug}
            renderRow={(item) => (
              <>
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.slug}</div>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <span className="text-xs text-slate-400 line-clamp-2">{item.core_driver}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{item.target_metric}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-bold text-orange-300">
                    <FaFire className="text-orange-400/70" /> {item.target_value}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200">
                    {WINDOW_LABELS[item.window_type] || item.window_type}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Activo' : 'Inactivo'}</StatusBadge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => { setEditItem(item); setIsNew(false); setFormErr(null); }} className="text-blue-400 hover:text-white transition-colors"><FaEdit /></button>
                    <ToggleButton active={item.is_active} onClick={() => handleToggle(item)} loading={toggling === item.slug} />
                  </div>
                </td>
              </>
            )}
            minWidth="750px"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

// ── Main Panel ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'cosmeticos', label: 'Tienda',  icon: FaStore },
  { id: 'logros',     label: 'Logros',  icon: FaTrophy },
  { id: 'metas',      label: 'Metas',   icon: FaBullseye },
];

const GamificationAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('cosmeticos');

  return (
    <div className="space-y-4">
      <SectionHeader
        guideId="gamification-admin-header"
        title="Gamificación"
        subtitle="Gestiona la tienda, logros y metas del sistema"
        icon={<FaTrophy />}
      />

      <TabNav
        items={TABS.map((tab) => ({ ...tab, guideId: `gamification-tab-${tab.id}` }))}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <div>
        {activeTab === 'cosmeticos' && <CosmeticsTab />}
        {activeTab === 'logros'     && <AchievementsTab />}
        {activeTab === 'metas'      && <GoalsTab />}
      </div>
    </div>
  );
};

export default GamificationAdminPanel;
