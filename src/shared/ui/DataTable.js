import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import EmptyState from './EmptyState';
import { cn } from '../../lib/cn';

const wrapperClass = 'overflow-x-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]';
const headRowClass = 'border-b border-white/10 bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.16em] text-slate-400';

const flattenChildren = (children) =>
  React.Children.toArray(children).flatMap((child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      return flattenChildren(child.props.children);
    }

    return child;
  });

const isTableHeaderElement = (element) =>
  React.isValidElement(element) && element.type === 'th';

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

  const renderResponsiveRow = (row, index) => {
    const cells = flattenChildren(renderRow(row, index));

    return cells.map((cell, cellIndex) => {
      if (!React.isValidElement(cell) || cell.type !== 'td') {
        return cell;
      }

      const label = cell.props['data-label'] || columns[cellIndex]?.label || '';
      return React.cloneElement(cell, {
        'data-label': label,
        className: cn('px-4 py-4', cell.props.className),
      });
    });
  };

  return (
    <>
      <div className={cn(wrapperClass, className)} data-responsive-table="true">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead>
            <tr className={headRowClass}>
              {columns.map((col) => {
                const headerKey = col.key || col.label;

                if (isTableHeaderElement(col.headerContent)) {
                  return React.cloneElement(col.headerContent, {
                    key: headerKey,
                    className: cn('px-4 py-4', col.headerContent.props.className),
                  });
                }

                return (
                  <th key={headerKey} className="px-4 py-4">
                    {col.headerContent || col.label}
                  </th>
                );
              })}
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
                {renderResponsiveRow(row, index)}
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
