import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaUsers, FaCheckCircle, FaBan, FaList, FaEdit } from 'react-icons/fa';
import { userManagementService } from '../../../userManagementService';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useUserActions } from '../hooks/useUserActions';
import { useTimedMessage } from '../hooks/useTimedMessage';
import { communicationsService } from '../../../../communications';
import { trainingCategoriesService } from '../../../../training-categories';
import { SectionHeader, Button, EmptyState, Modal, iconRegistry, KpiTile, LoadingSpinner } from '../../../../../shared/ui';
import { SORT_DIRECTION, createTableQuery } from '../../../../../shared/lib/tableQuery';
import UserCard from '../shared/UserCard';
import UserForm from '../shared/UserForm';
import UserFilters from '../shared/UserFilters';
import SuspendUserModal from '../shared/SuspendUserModal';
import ResendCredentialsModal from '../shared/ResendCredentialsModal';
import DeleteUserModal from '../shared/DeleteUserModal';
import ChangeRoleModal from '../shared/ChangeRoleModal';

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
  const normalizedRole = String(userRole || '').toLowerCase();
  const isAdmin = normalizedRole === 'administrador';

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [showResendModal, setShowResendModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingRole, setIsConfirmingRole] = useState(false);
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
  const scopedPermissions = useMemo(
    () => ({
      ...permissions,
      canCreate: Boolean(permissions.canCreate && isAdmin),
      canEdit: Boolean(permissions.canEdit && isAdmin),
    }),
    [isAdmin, permissions]
  );
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

  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = await trainingCategoriesService.listStudentCategories();
      setCategories(loadedCategories || []);
    } catch (error) {
      console.error('Error al cargar categorias de estudiantes:', error);
      showMessage('error', `Error al cargar categorias: ${error.message}`);
      setCategories([]);
    }
  }, [showMessage]);

  useEffect(() => {
    loadAthletes({ activeFilters: filters });
  }, [filters, loadAthletes]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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

  const categoryCodes = useMemo(() => {
    const set = new Set((categories || []).map((category) => category.code).filter(Boolean));
    filteredAthletes.forEach((athlete) => {
      if (athlete?.categoria) set.add(athlete.categoria);
    });
    return Array.from(set);
  }, [categories, filteredAthletes]);

  const stats = useMemo(
    () =>
      userManagementService.buildAthletesStats({
        filteredAthletes,
        categories: categoryCodes,
      }),
    [categoryCodes, filteredAthletes]
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
      setIsSubmitting(true);
      if (editingAthlete) {
        await userActions.handleEdit(editingAthlete.user_id, formData, 'atleta');
        showMessage('success', 'Estudiante actualizado correctamente');
      } else {
        const shouldSendCredentials = Boolean(formData.send_credentials_on_create);
        const createResult = await userActions.handleCreate(formData, 'atleta');

        if (shouldSendCredentials) {
          const temporaryPassword = createResult?.credentials?.password;
          if (!temporaryPassword) {
            showMessage('error', 'Estudiante creado, pero no se pudo preparar el envio de credenciales.');
          } else {
            const emailResult = await communicationsService.sendCredentials({
              email: createResult?.credentials?.email || formData.email,
              nombre: formData.nombre,
              apellido: formData.apellido,
              full_name: `${formData.nombre || ''} ${formData.apellido || ''}`.trim(),
              password: temporaryPassword,
            });

            if (emailResult?.success) {
              showMessage('success', 'Estudiante creado y credenciales enviadas por email.');
            } else {
              showMessage('error', `Estudiante creado, pero el email de credenciales fallo: ${emailResult?.error || 'Error desconocido'}`);
            }
          }
        } else {
          showMessage('success', 'Estudiante creado exitosamente');
        }
      }
      closeModal();
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
      setIsConfirmingRole(true);
      await userActions.handleChangeRole(showChangeRoleModal.user_id, newRole);
      showMessage('success', 'Rol cambiado correctamente');
      setShowChangeRoleModal(null);
      loadAthletes();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setIsConfirmingRole(false);
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
          scopedPermissions.canCreate && (
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
        <KpiTile label="Total Estudiantes" value={stats.total} icon={<FaUsers />} accent="sky" className="h-full" />
        <KpiTile label="Activos" value={stats.activos} icon={<FaCheckCircle />} accent="emerald" className="h-full" />
        <KpiTile label="Suspendidos" value={stats.suspendidos} icon={<FaBan />} accent="rose" className="h-full" />
        <KpiTile label="Categorías" value={Object.keys(stats.byCategory).filter((k) => stats.byCategory[k] > 0).length} icon={<FaList />} accent="amber" className="h-full" />
      </div>

      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        userType="atleta"
        showCategoryFilter={isAdmin}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <LoadingSpinner message="Cargando estudiantes..." />
        </div>
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
            scopedPermissions.canCreate && !filters.search && !filters.categoria && filters.status === 'all' && (
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
                permissions={scopedPermissions}
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
        <Modal
          title={editingAthlete ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}
          icon={editingAthlete ? <FaEdit /> : <FaPlus />}
          onClose={closeModal}
          className="max-w-4xl"
        >
            <UserForm
              userType="atleta"
              initialData={editingAthlete}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={closeModal}
              submitLabel={editingAthlete ? 'Actualizar' : 'Crear'}
              isSubmitting={isSubmitting}
            />
        </Modal>
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
          isSubmitting={isConfirmingRole}
        />
      )}
    </div>
  );
};

export default AthletesTab;
