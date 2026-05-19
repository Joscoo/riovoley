export const SORT_DIRECTION = {
  NONE: 'none',
  ASC: 'asc',
  DESC: 'desc',
};

const ALLOWED_DIRECTIONS = new Set([
  SORT_DIRECTION.NONE,
  SORT_DIRECTION.ASC,
  SORT_DIRECTION.DESC,
]);

const normalizePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const createTableQuery = ({
  filters = {},
  sort = {},
  pagination = {},
} = {}) => ({
  filters: { ...filters },
  sort: {
    field: sort.field || null,
    direction: ALLOWED_DIRECTIONS.has(sort.direction) ? sort.direction : SORT_DIRECTION.NONE,
  },
  pagination: {
    page: normalizePositiveInt(pagination.page, 1),
    pageSize: normalizePositiveInt(pagination.pageSize, 10),
  },
});

export const resolveNextSort = ({ currentSort, field }) => {
  if (!field) {
    return { field: null, direction: SORT_DIRECTION.NONE };
  }

  if (!currentSort || currentSort.field !== field) {
    return { field, direction: SORT_DIRECTION.ASC };
  }

  if (currentSort.direction === SORT_DIRECTION.ASC) {
    return { field, direction: SORT_DIRECTION.DESC };
  }

  if (currentSort.direction === SORT_DIRECTION.DESC) {
    return { field: null, direction: SORT_DIRECTION.NONE };
  }

  return { field, direction: SORT_DIRECTION.ASC };
};

export const getAriaSort = ({ sort, field }) => {
  if (!field || !sort || sort.field !== field) return 'none';
  if (sort.direction === SORT_DIRECTION.ASC) return 'ascending';
  if (sort.direction === SORT_DIRECTION.DESC) return 'descending';
  return 'none';
};

export const withUpdatedFilter = ({ query, key, value }) =>
  createTableQuery({
    ...query,
    filters: {
      ...(query?.filters || {}),
      [key]: value,
    },
    pagination: {
      ...(query?.pagination || {}),
      page: 1,
    },
  });

export const withUpdatedSort = ({ query, field }) =>
  createTableQuery({
    ...query,
    sort: resolveNextSort({ currentSort: query?.sort, field }),
    pagination: {
      ...(query?.pagination || {}),
      page: 1,
    },
  });

export const withUpdatedPage = ({ query, page }) =>
  createTableQuery({
    ...query,
    pagination: {
      ...(query?.pagination || {}),
      page,
    },
  });

export const resetTableQuery = ({ defaults }) => createTableQuery(defaults);

