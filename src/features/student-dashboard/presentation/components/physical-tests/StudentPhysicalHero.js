import React from 'react';
import PropTypes from 'prop-types';
import { FaCalendarAlt, FaSyncAlt, FaUser } from 'react-icons/fa';
import { Button, Card } from '../../../../../shared/ui';

const StudentPhysicalHero = ({ hero, onRefresh }) => (
  <Card className="border-white/20 bg-black/35">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-rv-gold/90">Estado actual</p>
          <h3 className="mt-1 text-2xl font-black text-white mobile:text-3xl">{hero.headline}</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 mobile:text-base">{hero.summary}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1">
            <FaCalendarAlt className="text-rv-gold" />
            Ultimo test: {hero.latestDateLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 capitalize">
            <FaUser className="text-rv-gold" />
            Categoria: {hero.categoryLabel.replaceAll('_', ' ')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-500/15 px-3 py-1 text-amber-100">
            Lectura {hero.confidence}
          </span>
        </div>
      </div>

      <Button variant="secondary" size="sm" onClick={onRefresh}>
        <FaSyncAlt className="mr-2" />
        Actualizar
      </Button>
    </div>

    {hero.hallazgos?.length ? (
      <div className="mt-4 grid gap-2 mobile:grid-cols-3">
        {hero.hallazgos.map((hallazgo) => (
          <div key={hallazgo} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-semibold text-slate-100">
            {hallazgo}
          </div>
        ))}
      </div>
    ) : null}
  </Card>
);

StudentPhysicalHero.propTypes = {
  hero: PropTypes.shape({
    headline: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    confidence: PropTypes.string.isRequired,
    latestDateLabel: PropTypes.string.isRequired,
    categoryLabel: PropTypes.string.isRequired,
    hallazgos: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default StudentPhysicalHero;
