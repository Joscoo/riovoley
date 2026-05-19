import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import UserFilters from './UserFilters';

describe('UserFilters', () => {
  const baseFilters = {
    search: '',
    categoria: '',
    status: 'all',
    sortBy: 'apellido',
    sortOrder: 'asc',
  };

  test('exposes stable ids by userType', () => {
    render(
      <UserFilters
        filters={baseFilters}
        onFiltersChange={jest.fn()}
        userType="atleta"
        showCategoryFilter={true}
      />
    );

    expect(screen.getByTestId('user-filters-atleta')).toBeInTheDocument();
    expect(document.querySelector('#user-filters-atleta-search')).not.toBeNull();
    expect(document.querySelector('#user-filters-atleta-category')).not.toBeNull();
    expect(document.querySelector('#user-filters-atleta-status')).not.toBeNull();
    expect(document.querySelector('#user-filters-atleta-sort-by')).not.toBeNull();
    expect(document.querySelector('#user-filters-atleta-sort-order')).not.toBeNull();
    expect(document.querySelector('#user-filters-atleta-reset')).not.toBeNull();
  });

  test('reset button calls provided onReset handler', () => {
    const onReset = jest.fn();

    render(
      <UserFilters
        filters={{ ...baseFilters, search: 'ana' }}
        onFiltersChange={jest.fn()}
        userType="entrenador"
        showCategoryFilter={false}
        onReset={onReset}
      />
    );

    const resetButton = document.querySelector('#user-filters-entrenador-reset');
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
