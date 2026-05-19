const {
  SORT_DIRECTION,
  createTableQuery,
  resolveNextSort,
  getAriaSort,
  withUpdatedFilter,
  withUpdatedSort,
  withUpdatedPage,
  resetTableQuery,
} = require('./tableQuery');

describe('tableQuery helpers', () => {
  it('createTableQuery normaliza defaults', () => {
    const query = createTableQuery({
      filters: { search: 'ana' },
      sort: { field: 'apellido', direction: 'asc' },
      pagination: { page: 2, pageSize: 20 },
    });

    expect(query).toEqual({
      filters: { search: 'ana' },
      sort: { field: 'apellido', direction: 'asc' },
      pagination: { page: 2, pageSize: 20 },
    });
  });

  it('resolveNextSort aplica ciclo none -> asc -> desc -> none', () => {
    const first = resolveNextSort({ currentSort: { field: null, direction: SORT_DIRECTION.NONE }, field: 'monto' });
    const second = resolveNextSort({ currentSort: first, field: 'monto' });
    const third = resolveNextSort({ currentSort: second, field: 'monto' });

    expect(first).toEqual({ field: 'monto', direction: 'asc' });
    expect(second).toEqual({ field: 'monto', direction: 'desc' });
    expect(third).toEqual({ field: null, direction: 'none' });
  });

  it('getAriaSort responde por columna', () => {
    const sort = { field: 'fecha_pago', direction: 'desc' };
    expect(getAriaSort({ sort, field: 'fecha_pago' })).toBe('descending');
    expect(getAriaSort({ sort, field: 'estado' })).toBe('none');
  });

  it('helpers reinician page cuando cambia filtro u orden', () => {
    const base = createTableQuery({
      filters: { search: '' },
      sort: { field: null, direction: 'none' },
      pagination: { page: 3, pageSize: 10 },
    });

    const withFilter = withUpdatedFilter({ query: base, key: 'search', value: 'lia' });
    const withSort = withUpdatedSort({ query: base, field: 'monto' });
    const withPage = withUpdatedPage({ query: base, page: 2 });
    const reset = resetTableQuery({
      defaults: {
        filters: { search: '' },
        sort: { field: null, direction: 'none' },
        pagination: { page: 1, pageSize: 10 },
      },
    });

    expect(withFilter.pagination.page).toBe(1);
    expect(withSort.pagination.page).toBe(1);
    expect(withPage.pagination.page).toBe(2);
    expect(reset.pagination.page).toBe(1);
  });
});

