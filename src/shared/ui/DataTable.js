import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import EmptyState from './EmptyState';
import { cn } from '../../lib/cn';

const wrapperClass = 'overflow-x-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]';
const headRowClass = 'border-b border-white/10 bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.16em] text-slate-400';

/**
 * DataTable — unified data table with consistent header styling, alternating rows, pagination and empty state.
 */
const DataTable = ({
  columns,
  rows,
  renderRow,
  keyExtractor,
  emptyIcon,
  emptyTitle = 'Sin datos',
  emptyDescription,
  page,
  totalPages,
  onPageChange,
  minWidth = '900px',
  className,
}) => {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      <div className={cn(wrapperClass, className)}>
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead>
            <tr className={headRowClass}>
              {columns.map((col) => (
                <th key={col.key || col.label} className="px-4 py-4">
                  {col.headerContent || col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={keyExtractor ? keyExtractor(row, index) : index}
                className={cn(
                  'border-b border-white/10 text-white transition-colors duration-150 hover:bg-white/[0.04]',
                  index % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'
                )}
              >
                {renderRow(row, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <span className="text-sm text-slate-300">
            Pagina <strong className="text-white">{page}</strong> de{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      headerContent: PropTypes.node,
    })
  ).isRequired,
  rows: PropTypes.array.isRequired,
  renderRow: PropTypes.func.isRequired,
  keyExtractor: PropTypes.func,
  emptyIcon: PropTypes.node,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  minWidth: PropTypes.string,
  className: PropTypes.string,
};

export default DataTable;
