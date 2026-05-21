import React from 'react';
import { Card, Field, Button } from '../../../../../shared/ui';
import { formatCategoryLabel } from '../../../../../shared/lib/trainingCategoryFormatting';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/30';

const UserFilters = ({
  filters,
  onFiltersChange,
  categories = [],
  userType = 'usuario',
  showCategoryFilter = false,
  onReset,
}) => {
  const defaultFilters = {
    search: '',
    categoria: '',
    status: 'all',
    sortBy: 'apellido',
    sortOrder: 'asc',
  };

  const activeFiltersCount = [
    filters.search,
    filters.categoria,
    filters.status !== 'all',
    filters.sortBy !== 'apellido',
    filters.sortOrder !== 'asc',
  ].filter(Boolean).length;

  const filterScope = String(userType || 'usuario').toLowerCase();
  const searchId = `user-filters-${filterScope}-search`;
  const categoryId = `user-filters-${filterScope}-category`;
  const statusId = `user-filters-${filterScope}-status`;
  const sortById = `user-filters-${filterScope}-sort-by`;
  const sortOrderId = `user-filters-${filterScope}-sort-order`;
  const resetId = `user-filters-${filterScope}-reset`;

  const categoryOptions = (categories || [])
    .map((category) => {
      if (typeof category === 'string') {
        return { value: category, label: formatCategoryLabel(category) };
      }
      return {
        value: category.code,
        label: category.label || formatCategoryLabel(category.code),
      };
    })
    .filter((option) => option.value);

  return (
    <Card className="mb-6" data-testid={`user-filters-${filterScope}`}>
      <div
        className="space-y-4"
        role="search"
        aria-label="Filtros de busqueda"
      >
        <div className="grid gap-4 tablet:grid-cols-2">
          <Field label="Buscar" className="w-full">
            <input
              id={searchId}
              type="search"
              placeholder="Buscar por nombre, apellido o email..."
              value={filters.search}
              onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
              className={INPUT_BASE}
              aria-label="Buscar usuarios por nombre, apellido o email"
            />
          </Field>

          {showCategoryFilter && (
            <Field label="Categoria">
              <select
                id={categoryId}
                value={filters.categoria}
                onChange={(event) => onFiltersChange({ ...filters, categoria: event.target.value })}
                className={INPUT_BASE}
                aria-label="Filtrar por categoria deportiva"
              >
                <option value="">Todas las categorias</option>
                {categoryOptions.map((categoria) => (
                  <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4">
          <Field label="Estado">
            <select
              id={statusId}
              value={filters.status}
              onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
              className={INPUT_BASE}
              aria-label="Filtrar por estado del usuario"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </Field>

          <Field label="Ordenar por">
            <select
              id={sortById}
              value={filters.sortBy}
              onChange={(event) => onFiltersChange({ ...filters, sortBy: event.target.value })}
              className={INPUT_BASE}
              aria-label="Criterio de ordenamiento"
            >
              <option value="apellido">Apellido</option>
              <option value="nombre">Nombre</option>
              {showCategoryFilter && <option value="categoria">Categoria</option>}
              {showCategoryFilter && <option value="edad">Edad</option>}
              <option value="created_at">Fecha de registro</option>
            </select>
          </Field>

          <Field label="Direccion">
            <select
              id={sortOrderId}
              value={filters.sortOrder}
              onChange={(event) => onFiltersChange({ ...filters, sortOrder: event.target.value })}
              className={INPUT_BASE}
              aria-label="Direccion de ordenamiento"
            >
              <option value="asc">Ascendente (A-Z)</option>
              <option value="desc">Descendente (Z-A)</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button
              id={resetId}
              variant="secondary"
              onClick={() => (onReset ? onReset() : onFiltersChange(defaultFilters))}
              className="w-full font-semibold"
              aria-label={`Limpiar filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount} activos)` : ''}`}
            >
              Limpiar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserFilters;
