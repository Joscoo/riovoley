import React from 'react';
import PropTypes from 'prop-types';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { getAriaSort, SORT_DIRECTION } from '../lib/tableQuery';

const resolveIcon = ({ active, direction }) => {
  if (!active) return <FaSort aria-hidden="true" className="text-slate-400" />;
  if (direction === SORT_DIRECTION.ASC) return <FaSortUp aria-hidden="true" className="text-rv-gold" />;
  if (direction === SORT_DIRECTION.DESC) return <FaSortDown aria-hidden="true" className="text-rv-gold" />;
  return <FaSort aria-hidden="true" className="text-slate-400" />;
};

const SortableHeader = ({
  field,
  label,
  sort,
  onToggleSort,
  className = '',
  buttonClassName = '',
  asCell = true,
}) => {
  const isActive = sort?.field === field && sort?.direction !== SORT_DIRECTION.NONE;
  const ariaSort = getAriaSort({ sort, field });
  const icon = resolveIcon({ active: isActive, direction: sort?.direction });
  const sortDescription = { none: 'sin ordenar', ascending: 'ascendente', descending: 'descendente' }[ariaSort];

  const button = (
    <button
      type="button"
      aria-label={asCell ? undefined : `Ordenar por ${label}: ${sortDescription}`}
      onClick={() => onToggleSort(field)}
      className={`inline-flex min-h-[44px] items-center gap-2 text-left ${buttonClassName}`}
    >
      <span>{label}</span>
      {icon}
    </button>
  );

  if (!asCell) {
    return button;
  }

  return <th aria-sort={ariaSort} className={className}>{button}</th>;
};

SortableHeader.propTypes = {
  field: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sort: PropTypes.shape({
    field: PropTypes.string,
    direction: PropTypes.string,
  }),
  onToggleSort: PropTypes.func.isRequired,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  asCell: PropTypes.bool,
};

SortableHeader.defaultProps = {
  sort: {
    field: null,
    direction: SORT_DIRECTION.NONE,
  },
  className: '',
  buttonClassName: '',
  asCell: true,
};

export default SortableHeader;
