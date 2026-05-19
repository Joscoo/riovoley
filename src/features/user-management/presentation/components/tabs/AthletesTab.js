import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaUsers, FaCheckCircle, FaBan, FaList, FaEdit, FaTimes } from 'react-icons/fa';
import { userManagementService } from '../../../userManagementService';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useUserActions } from '../hooks/useUserActions';
import { useTimedMessage } from '../hooks/useTimedMessage';
import { SectionHeader, Card, Button, EmptyState, iconRegistry } from '../../../../../shared/ui';
import { SORT_DIRECTION, createTableQuery } from '../../../../../shared/lib/tableQuery';
import UserCard from '../shared/UserCard';
import UserForm from '../shared/UserForm';
import UserFilters from '../shared/UserFilters';
import SuspendUserModal from '../shared/SuspendUserModal';
import ResendCredentialsModal from '../shared/ResendCredentialsModal';
import DeleteUserModal from '../shared/DeleteUserModal';
import ChangeRoleModal from '../shared/ChangeRoleModal';

const CATEGORIAS = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'master_mujeres',
];

const buildAthletesListQuery = ({ filters }) => {
  const backendSortField = ['nombre', 'apellido', 'created_at'].includes(filters?.sortBy) ? filters.sortBy : null;

  return createTableQuery({
    filters: {
      search: filters?.search || '',
      categoria: filters?.categoria || '',
      status: filters?.status || 'all',
    },
    sort: {
      field: backendSortField,
      direction: filters?.sortOrder === 'desc' ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
    },
    pagination: {
      page: 1,
      pageSize: 300,
    },
  });
};

const AthletesTab = ({ userRole }) => {
  const StudentIcon = iconRegistry.userTypes.atleta;

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [showResendModal, setShowResendModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(null);
  const { message, showMessage } = useTimedMessage();

  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    status: 'all',
    sortBy: 'apellido',
    sortOrder: 'asc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;

  const permissions = useUserPermissions({ userRole, targetUserType: 'atleta' });
  const userActions = useUserActions();

  const loadAthletes = useCallback(async ({ activeFilters } = {}) => {
    setLoading(true);
    try {
      const loadedAthletes = await userManagementService.listAthletes({
        query: buildAthletesListQuery({ filters: activeFilters || filters }),
      });
      setAthletes(loadedAthletes);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      showMessage('error', `Error al cargar estudiantes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, showMessage]);

  useEffect(() => {
    loadAthletes({ activeFilters: filters });
  }, [filters, loadAthletes]);

  const filteredAthletes = useMemo(
    () =>
      userManagementService.filterAthletes({
        athletes,
        filters,
      }),
    [athletes, filters]
  );

  const pagination = useMemo(
    () =>
      userManagementService.paginateUsers({
        items: filteredAthletes,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
    [filteredAthletes, currentPage]
  );
  const totalPages = pagination.totalPages;
  const visiblePage = pagination.currentPage;
  const paginatedAthletes = pagination.paginated;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const stats = useMemo(
    () =>
      userManagementService.buildAthletesStats({
        filteredAthletes,
        categories: CATEGORIAS,
      }),
    [filteredAthletes]
  );

  const openCreateModal = () => {
    setEditingAthlete(null);
    setShowModal(true);
  };

  const openEditModal = (athlete) => {
    setEditingAthlete(athlete);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAthlete(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingAthlete) {
        await userActions.handleEdit(editingAthlete.user_id, formData, 'atleta');
        showMessage('success', 'Estudiante actualizado correctamente');
      } else {
        await userActions.handleCreate(formData, 'atleta');
        showMessage('success', 'Estudiante creado exitosamente');
      }
      closeModal();
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      await userActions.handleDelete(showDeleteModal.user_id, 'atleta');
      showMessage('success', 'Estudiante eliminado correctamente');
      setShowDeleteModal(null);
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error al eliminar: ${error.message}`);
    }
  };

  const confirmSuspend = async ({ reason, until }) => {
    try {
      await userActions.handleSuspend(showSuspendModal.user_id, reason, until);
      showMessage('success', 'Estudiante suspendido correctamente');
      setShowSuspendModal(null);
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmReactivate = async (athlete) => {
    try {
      await userActions.handleReactivate(athlete.user_id);
      showMessage('success', 'Estudiante reactivado correctamente');
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmResendCredentials = async (channels) => {
    try {
      await userActions.handleResendCredentials(showResendModal.user_id, channels);
      showMessage('success', 'Credenciales enviadas correctamente');
      setShowResendModal(null);
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmChangeRole = async (newRole) => {
    try {
      await userActions.handleChangeRole(showChangeRoleModal.user_id, newRole);
      showMessage('success', 'Rol cambiado correctamente');
      setShowChangeRoleModal(null);
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoria: '',
      status: 'all',
      sortBy: 'apellido',
      sortOrder: 'asc',
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Estudiantes"
        subtitle={`${stats.total} estudiantes encontrados - ${stats.activos} activos, ${stats.suspendidos} suspendidos`}
        icon={<StudentIcon />}
        actions={
          permissions.canCreate && (
            <Button onClick={openCreateModal}>
              <FaPlus className="mr-2" /> Agregar Estudiante
            </Button>
          )
        }
      />

      {message.text && (
        <div className={message.type === 'success'
          ? 'rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200'
          : 'rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200'
        }>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <Card className="h-full border-l-4 border-l-[#355FB3]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Total Estudiantes</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.total}</p>
            </div>
            <div className="text-3xl text-[#355FB3]">
              <FaUsers />
            </div>
          </div>
        </Card>

        <Card className="h-full border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Activos</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.activos}</p>
            </div>
            <div className="text-3xl text-green-500">
              <FaCheckCircle />
            </div>
          </div>
        </Card>

        <Card className="h-full border-l-4 border-l-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Suspendidos</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.suspendidos}</p>
            </div>
            <div className="text-3xl text-red-500">
              <FaBan />
            </div>
          </div>
        </Card>

        <Card className="h-full border-l-4 border-l-[#F9B233]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Categorías</h3>
              <p className="mt-1 text-3xl font-black text-white">
                {Object.keys(stats.byCategory).filter((k) => stats.byCategory[k] > 0).length}
              </p>
            </div>
            <div className="text-3xl text-[#F9B233]">
              <FaList />
            </div>
          </div>
        </Card>
      </div>

      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        userType="atleta"
        showCategoryFilter={true}
        onReset={handleResetFilters}
      />

      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando estudiantes...</p>
          </div>
        </Card>
      ) : paginatedAthletes.length === 0 ? (
        <EmptyState
          icon={<StudentIcon />}
          title={filters.search || filters.categoria || filters.status !== 'all'
            ? 'No se encontraron estudiantes'
            : 'No hay estudiantes registrados'}
          description={filters.search || filters.categoria || filters.status !== 'all'
            ? 'Intenta ajustar los filtros de búsqueda'
            : 'Agrega el primer estudiante al club'}
          action={
            permissions.canCreate && !filters.search && !filters.categoria && filters.status === 'all' && (
              <Button onClick={openCreateModal}>
                <FaPlus className="mr-2" /> Agregar Estudiante
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {paginatedAthletes.map((athlete) => (
              <UserCard
                key={athlete.id}
                user={athlete}
                userType="atleta"
                permissions={permissions}
                onEdit={() => openEditModal(athlete)}
                onDelete={() => setShowDeleteModal(athlete)}
                onSuspend={() => setShowSuspendModal(athlete)}
                onReactivate={() => confirmReactivate(athlete)}
                onResendCredentials={() => setShowResendModal(athlete)}
                onChangeRole={() => setShowChangeRoleModal(athlete)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={visiblePage === 1}
              >
                Anterior
              </Button>
              <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
                Página {visiblePage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={visiblePage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <Card
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-rv-gold/25 pb-3">
              <h3 className="text-lg font-bold text-white mobile:text-xl">
                {editingAthlete ? (
                  <>
                    <FaEdit className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Editar Estudiante</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 inline align-middle text-rv-gold" />
                    <span className="align-middle">Agregar Nuevo Estudiante</span>
                  </>
                )}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar modal">
                <FaTimes />
              </Button>
            </div>

            <UserForm
              userType="atleta"
              initialData={editingAthlete}
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel={editingAthlete ? 'Actualizar' : 'Guardar'}
            />
          </Card>
        </div>
      )}

      {showSuspendModal && (
        <SuspendUserModal
          user={showSuspendModal}
          onConfirm={confirmSuspend}
          onCancel={() => setShowSuspendModal(null)}
        />
      )}

      {showResendModal && (
        <ResendCredentialsModal
          user={showResendModal}
          onConfirm={confirmResendCredentials}
          onCancel={() => setShowResendModal(null)}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={showDeleteModal}
          userType="atleta"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}

      {showChangeRoleModal && (
        <ChangeRoleModal
          user={showChangeRoleModal}
          currentRole={showChangeRoleModal.role}
          onConfirm={confirmChangeRole}
          onCancel={() => setShowChangeRoleModal(null)}
        />
      )}
    </div>
  );
};

export default AthletesTab;
