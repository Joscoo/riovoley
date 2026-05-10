import React from 'react';
import Card from '../../../ui/Card';
import Field from '../../../ui/Field';
import Button from '../../../ui/Button';

const INPUT_BASE = 
  'min-h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/30';

const CATEGORIAS = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'master_mujeres'
];

const formatCategoria = (categoria) => {
  const categorias = {
    iniciacion_hombres: 'Iniciación Hombres',
    iniciacion_mujeres: 'Iniciación Mujeres',
    perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
    perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
    master_mujeres: 'Master Mujeres'
  };
  return categorias[categoria] || categoria;
};

const UserFilters = ({ 
  filters, 
  onFiltersChange, 
  userType,
  showCategoryFilter = false,
  onReset 
}) => {
  const defaultFilters = {
    search: '',
    categoria: '',
    status: 'all',
    sortBy: 'apellido',
    sortOrder: 'asc'
  };

  const activeFiltersCount = [
    filters.search,
    filters.categoria,
    filters.status !== 'all',
    filters.sortBy !== 'apellido',
    filters.sortOrder !== 'asc'
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <div 
        className="space-y-4"
        role="search"
        aria-label="Filtros de búsqueda"
      >
        {/* Primera fila: Búsqueda y Categoría (si aplica) */}
        <div className="grid gap-4 tablet:grid-cols-2">
          <Field label="Buscar" className="w-full">
            <input
              type="search"
              placeholder="Buscar por nombre, apellido o email..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className={INPUT_BASE}
              aria-label="Buscar usuarios por nombre, apellido o email"
            />
          </Field>
          
          {showCategoryFilter && (
            <Field label="Categoría">
              <select
                value={filters.categoria}
                onChange={(e) => onFiltersChange({ ...filters, categoria: e.target.value })}
                className={INPUT_BASE}
                aria-label="Filtrar por categoría deportiva"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{formatCategoria(cat)}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
        
        {/* Segunda fila: Estado, Ordenamiento y Dirección */}
        <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4">
          <Field label="Estado">
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
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
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
              className={INPUT_BASE}
              aria-label="Criterio de ordenamiento"
            >
              <option value="apellido">Apellido</option>
              <option value="nombre">Nombre</option>
              {showCategoryFilter && <option value="categoria">Categoría</option>}
              {showCategoryFilter && <option value="edad">Edad</option>}
              <option value="created_at">Fecha de registro</option>
            </select>
          </Field>
          
          <Field label="Dirección">
            <select
              value={filters.sortOrder}
              onChange={(e) => onFiltersChange({ ...filters, sortOrder: e.target.value })}
              className={INPUT_BASE}
              aria-label="Dirección de ordenamiento"
            >
              <option value="asc">Ascendente (A-Z)</option>
              <option value="desc">Descendente (Z-A)</option>
            </select>
          </Field>
          
          <div className="flex flex-col justify-end">
            <Button 
              variant="secondary" 
              onClick={() => onReset ? onReset() : onFiltersChange(defaultFilters)}
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