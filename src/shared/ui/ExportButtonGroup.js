import React from 'react';
import PropTypes from 'prop-types';
import { FaFilePdf, FaFileCsv, FaFileExcel, FaPrint } from 'react-icons/fa';
import Button from './Button';
import { cn } from '../../lib/cn';

const FORMAT_META = {
  pdf: { icon: FaFilePdf, color: 'text-red-300', hoverBorder: 'hover:border-red-400/30' },
  csv: { icon: FaFileCsv, color: 'text-emerald-300', hoverBorder: 'hover:border-emerald-400/30' },
  excel: { icon: FaFileExcel, color: 'text-green-300', hoverBorder: 'hover:border-green-400/30' },
  print: { icon: FaPrint, color: 'text-sky-300', hoverBorder: 'hover:border-sky-400/30' },
};

/**
 * ExportButtonGroup — semantically grouped export actions with format-aware coloring.
 *
 * Usage:
 *   <ExportButtonGroup
 *     items={[
 *       { label: 'Resumen PDF', format: 'pdf', onClick: fn },
 *       { label: 'Resumen CSV', format: 'csv', onClick: fn },
 *     ]}
 *     disabled={loading}
 *   />
 */
const ExportButtonGroup = ({ items, disabled = false, columns = 2, className }) => {
  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const meta = FORMAT_META[item.format] || FORMAT_META.pdf;
        const Icon = meta.icon;

        return (
          <Button
            key={item.label}
            variant="secondary"
            className={cn(
              'justify-start gap-2 transition-all duration-200',
              meta.hoverBorder
            )}
            onClick={item.onClick}
            disabled={disabled || item.disabled}
            isLoading={item.isLoading}
            loadingText={item.loadingText}
          >
            <Icon className={cn('flex-shrink-0', meta.color)} />
            <span className="truncate">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

ExportButtonGroup.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      format: PropTypes.oneOf(['pdf', 'csv', 'excel', 'print']).isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
      isLoading: PropTypes.bool,
      loadingText: PropTypes.string,
    })
  ).isRequired,
  disabled: PropTypes.bool,
  columns: PropTypes.number,
  className: PropTypes.string,
};

export default ExportButtonGroup;
