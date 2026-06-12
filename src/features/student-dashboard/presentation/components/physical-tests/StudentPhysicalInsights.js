import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';

const InsightColumn = ({ title, items, tone }) => (
  <div className={`rounded-2xl border p-4 ${tone}`}>
    <h4 className="text-sm font-black uppercase tracking-wide">{title}</h4>
    {items.length ? (
      <ul className="mt-3 space-y-2 text-sm text-slate-100">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-black/20 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm text-slate-300">Sin novedades relevantes en este bloque.</p>
    )}
  </div>
);

InsightColumn.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  tone: PropTypes.string.isRequired,
};

const StudentPhysicalInsights = ({ insights }) => (
  <Card className="border-white/20 bg-black/35">
    <div className="mb-4">
      <h3 className="text-lg font-black text-white">Lectura del progreso</h3>
      <p className="mt-1 text-sm text-slate-300">Resumen rapido de avances, alertas y zonas estables dentro de tu perfil.</p>
    </div>

    <div className="grid gap-3 desktop:grid-cols-3">
      <InsightColumn
        title="Lo que mejoro"
        items={insights.improved}
        tone="border-emerald-300/25 bg-emerald-500/10 text-emerald-100"
      />
      <InsightColumn
        title="Lo que necesita trabajo"
        items={insights.needsWork}
        tone="border-amber-300/25 bg-amber-500/10 text-amber-100"
      />
      <InsightColumn
        title="Lo que se mantiene estable"
        items={insights.stable}
        tone="border-sky-300/25 bg-sky-500/10 text-sky-100"
      />
    </div>
  </Card>
);

StudentPhysicalInsights.propTypes = {
  insights: PropTypes.shape({
    improved: PropTypes.arrayOf(PropTypes.string).isRequired,
    needsWork: PropTypes.arrayOf(PropTypes.string).isRequired,
    stable: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default StudentPhysicalInsights;
