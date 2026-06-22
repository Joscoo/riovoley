const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/features/gamification/presentation/components/GamificationAdminPanel.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  "import { SectionHeader, Button, Modal } from '../../../../shared/ui';",
  "import { SectionHeader, Button, Modal, DataTable, EmptyState, TabNav, StatusBadge, Input, Select, Textarea, FormField } from '../../../../shared/ui';"
);

// 2. Remove local shared components
content = content.replace(
  /const StatusBadge = \(\{ active \}\) => \([\s\S]*?\);\n\n/g,
  ""
);

content = content.replace(
  /const FormField = \(\{ label, required, children, hint \}\) => \([\s\S]*?\);\n\n/g,
  ""
);

content = content.replace(
  /const inputClass = '.*?';\nconst selectClass = '.*?';\n\n/g,
  ""
);

content = content.replace(
  /\/\/ ── Pagination component ─+\n\nconst Pagination = \(\{ page, totalPages, total, onPage \}\) => \{[\s\S]*?^};\n\n/m,
  ""
);

// Form control tags
content = content.replace(/<input className=\{inputClass\}/g, '<Input');
content = content.replace(/<select className=\{`\$\{selectClass\}/g, '<Select className={`');
content = content.replace(/<select className=\{selectClass\}/g, '<Select');
content = content.replace(/<\/select>/g, '</Select>');
content = content.replace(/<textarea className=\{`\$\{inputClass\}/g, '<Textarea className={`');
content = content.replace(/<textarea className=\{inputClass\}/g, '<Textarea');
content = content.replace(/<\/textarea>/g, '</Textarea>');

// Status badge usage
content = content.replace(/<StatusBadge active=\{([^}]+)\} \/>/g, "<StatusBadge tone={$1 ? 'success' : 'neutral'}>{$1 ? 'Activo' : 'Inactivo'}</StatusBadge>");

// Replace CosmeticsTab table
content = content.replace(
  /\{loading \? \([\s\S]*?\) : filtered\.length === 0 \? \([\s\S]*?\) : \([\s\S]*?<div className="rounded-xl border border-slate-700\/60 bg-slate-900 shadow-sm">[\s\S]*?<\/div>\n      \)\}/m,
  `{loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaStore />}
          title={search || catFilter ? "Sin resultados" : "No hay cosméticos"}
          description={search || catFilter ? "Intenta cambiar los filtros de búsqueda" : "No hay cosméticos registrados"}
        />
      ) : (
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
                  <span className={\`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold \${RARITY_COLORS[item.rarity] || 'bg-slate-700 text-slate-300'}\`}>
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
      )}`
);

// Replace AchievementsTab table
content = content.replace(
  /\{loading \? \([\s\S]*?\) : filtered\.length === 0 \? \([\s\S]*?\) : \([\s\S]*?<div className="rounded-xl border border-slate-700\/60 bg-slate-900 shadow-sm">[\s\S]*?<\/div>\n      \)\}/m,
  `{loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaTrophy />}
          title={search ? "Sin resultados" : "No hay logros"}
          description={search ? "Intenta cambiar los filtros de búsqueda" : "No hay logros registrados"}
        />
      ) : (
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
              c.type === 'tests_count'    ? \`\${c.min} test(s)\` :
              c.type === 'delta'          ? \`+\${c.min} cm\` :
              c.type === 'monthly_streak' ? \`\${c.min} mes(es)\` :
              c.type === 'strength_delta' ? \`+\${c.min} reps\` :
              \`\${c.type}: \${c.min}\`;
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
      )}`
);

// Replace GoalsTab table
content = content.replace(
  /\{loading \? \([\s\S]*?\) : filtered\.length === 0 \? \([\s\S]*?\) : \([\s\S]*?<div className="rounded-xl border border-slate-700\/60 bg-slate-900 shadow-sm">[\s\S]*?<\/div>\n      \)\}/m,
  `{loading ? (
        <div className="flex min-h-[140px] items-center justify-center text-slate-500 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FaBullseye />}
          title={search ? "Sin resultados" : "No hay metas"}
          description={search ? "Intenta cambiar los filtros de búsqueda" : "No hay metas registradas"}
        />
      ) : (
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
      )}`
);

// TabNav Replacement
content = content.replace(
  /<div className="flex overflow-x-auto rounded-xl border border-slate-700\/60 bg-slate-800\/50">[\s\S]*?<\/div>/,
  `<TabNav items={TABS} activeId={activeTab} onChange={setActiveTab} />`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacements applied successfully');
