import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortableHeader from './SortableHeader';
import { SORT_DIRECTION } from '../lib/tableQuery';

describe('SortableHeader', () => {
  test('renders with aria-sort none by default', () => {
    const onToggleSort = jest.fn();

    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              field="monto"
              label="Monto"
              sort={{ field: null, direction: SORT_DIRECTION.NONE }}
              onToggleSort={onToggleSort}
            />
          </tr>
        </thead>
      </table>
    );

    const button = screen.getByRole('button', { name: /monto/i });
    const header = button.closest('th');

    expect(header).toHaveAttribute('aria-sort', 'none');
  });

  test('renders ascending aria-sort when active asc', () => {
    const onToggleSort = jest.fn();

    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              field="monto"
              label="Monto"
              sort={{ field: 'monto', direction: SORT_DIRECTION.ASC }}
              onToggleSort={onToggleSort}
            />
          </tr>
        </thead>
      </table>
    );

    const button = screen.getByRole('button', { name: /monto/i });
    const header = button.closest('th');

    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  test('calls onToggleSort with field when clicked', () => {
    const onToggleSort = jest.fn();

    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              field="monto"
              label="Monto"
              sort={{ field: null, direction: SORT_DIRECTION.NONE }}
              onToggleSort={onToggleSort}
            />
          </tr>
        </thead>
      </table>
    );

    const button = screen.getByRole('button', { name: /monto/i });
    fireEvent.click(button);

    expect(onToggleSort).toHaveBeenCalledTimes(1);
    expect(onToggleSort).toHaveBeenCalledWith('monto');
  });
});
