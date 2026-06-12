import React from 'react';
import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../../../shared/ui';

const renderChart = (data, activeSeries) => (
  <LineChart data={data}>
    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
    <XAxis dataKey="fecha" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
    <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
    <Tooltip
      contentStyle={{
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        color: '#fff',
      }}
    />
    <Legend />
    {activeSeries.map((metric) => (
      <Line
        key={metric.key}
        type="monotone"
        dataKey={metric.key}
        name={metric.label}
        stroke={metric.color}
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
        connectNulls
      />
    ))}
  </LineChart>
);

const StudentPhysicalTrendChart = ({ activeBlock, blocks, onBlockChange }) => {
  const blockEntries = Object.values(blocks || {});
  const activeConfig = blocks?.[activeBlock];
  const activeSeries = activeConfig?.metrics || [];

  return (
    <Card className="border-white/20 bg-black/35">
      <div className="flex flex-wrap gap-2">
        {blockEntries.map((block) => (
          <button
            key={block.key}
            type="button"
            onClick={() => onBlockChange(block.key)}
            className={[
              'min-h-[48px] rounded-xl border px-4 py-2 text-sm font-bold transition',
              activeBlock === block.key
                ? 'border-rv-gold/60 bg-rv-gold/20 text-white'
                : 'border-white/15 bg-black/20 text-slate-200 hover:bg-white/10',
            ].join(' ')}
          >
            {block.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-black text-white">{activeConfig?.label || 'Progreso'}</h3>
        <p className="mt-1 text-sm text-slate-300">
          Sigue la evolucion por bloque para leer el progreso sin mezclar metricas incompatibles.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {activeSeries.map((metric) => (
          <span
            key={metric.key}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold text-slate-100"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: metric.color }} />
            {metric.label}
          </span>
        ))}
      </div>

      {!activeSeries.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
          {activeConfig?.emptyMessage || 'Sin datos suficientes para este bloque.'}
        </div>
      ) : (
        <div className="mt-4 h-[320px] w-full">
          {process.env.NODE_ENV === 'test' ? (
            renderChart(activeConfig.data, activeSeries)
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(activeConfig.data, activeSeries)}
            </ResponsiveContainer>
          )}
        </div>
      )}
    </Card>
  );
};

StudentPhysicalTrendChart.propTypes = {
  activeBlock: PropTypes.string.isRequired,
  blocks: PropTypes.object.isRequired,
  onBlockChange: PropTypes.func.isRequired,
};

export default StudentPhysicalTrendChart;
