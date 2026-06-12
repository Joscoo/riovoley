import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';

const StudentPhysicalRecommendations = ({ recommendations }) => (
  <Card className="border-emerald-300/25 bg-emerald-950/20">
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">Recomendaciones por perfil</p>
        <h3 className="mt-1 text-xl font-black text-white">{recommendations.headline}</h3>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">Prioridad actual</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{recommendations.priority}</p>
      </div>

      <ul className="grid gap-2">
        {recommendations.recommendations.map((item) => (
          <li key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-100">
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-100">
          Confianza {recommendations.confidence}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-semibold text-slate-200">
          Perfil mixto
        </span>
      </div>

      <p className="text-xs font-semibold text-slate-300">{recommendations.disclaimer}</p>
    </div>
  </Card>
);

StudentPhysicalRecommendations.propTypes = {
  recommendations: PropTypes.shape({
    headline: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    recommendations: PropTypes.arrayOf(PropTypes.string).isRequired,
    confidence: PropTypes.string.isRequired,
    disclaimer: PropTypes.string.isRequired,
  }).isRequired,
};

export default StudentPhysicalRecommendations;
