import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';

const StudentPhysicalHistory = ({ items }) => (
  <Card className="border-white/20 bg-black/35">
    <div className="mb-4">
      <h3 className="text-lg font-black text-white">Historial de tests fisicos</h3>
      <p className="mt-1 text-sm text-slate-300">Consulta tus mediciones anteriores sin perder de vista lo realmente importante.</p>
    </div>

    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-black capitalize text-white">{item.fecha}</p>

          <div className="mt-3 grid gap-2 mobile:grid-cols-2 desktop:grid-cols-4">
            {item.metrics.map((metric) => (
              <div key={`${item.id}-${metric.label}`} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          {item.observaciones ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Observaciones</p>
              <p className="mt-1 text-sm text-slate-100">{item.observaciones}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  </Card>
);

StudentPhysicalHistory.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      fecha: PropTypes.string.isRequired,
      observaciones: PropTypes.string,
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
};

export default StudentPhysicalHistory;
