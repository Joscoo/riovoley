import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaChalkboardTeacher, FaUsers, FaCheckCircle, FaBan, FaEdit } from 'react-icons/fa';
import { userManagementService } from '../../../userManagementService';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useUserActions } from '../hooks/useUserActions';
import { useTimedMessage } from '../hooks/useTimedMessage';
import { SectionHeader } from '../../../../../shared/ui';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';
import { EmptyState, Modal } from '../../../../../shared/ui';
import { SORT_DIRECTION, createTableQuery } from '../../../../../shared/lib/tableQuery';
import UserCard from '../shared/UserCard';
import UserForm from '../shared/UserForm';
import UserFilters from '../shared/UserFilters';
import SuspendUserModal from '../shared/SuspendUserModal';
import ResendCredentialsModal from '../shared/ResendCredentialsModal';
import DeleteUserModal from '../shared/DeleteUserModal';
import ChangeRoleModal from '../shared/ChangeRoleModal';

const buildTrainersListQuery = ({ filters }) => {
  const backendSortField = ['nombre', 'apellido', 'email', 'created_at'].includes(filters?.sortBy)
    ? filters.sortBy
    : 'apellido';

  return createTableQuery({
    filters: {
      search: filters?.search || '',
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

const TrainersTab = ({ userRole }) => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [showResendModal, setShowResendModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(null);
  const { message, showMessage } = useTimedMessage();
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'apellido',
    sortOrder: 'asc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;
  
  const permissions = useUserPermissions({ userRole, targetUserType: 'entrenador' });
  const userActions = useUserActions();

  const loadTrainers = useCallback(async ({ activeFilters } = {}) => {
    setLoading(true);
    try {
      const data = await userManagementService.listTrainers({
        query: buildTrainersListQuery({ filters: activeFilters || filters }),
      });
      setTrainers(data);
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
      showMessage('error', `Error al cargar entrenadores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, showMessage]);

  useEffect(() => {
    loadTrainers({ activeFilters: filters });
  }, [filters, loadTrainers]);

  const filteredTrainers = useMemo(
    () =>
      userManagementService.filterTrainers({
        trainers,
        filters,
      }),
    [trainers, filters]
  );

  const pagination = useMemo(
    () =>
      userManagementService.paginateUsers({
        items: filteredTrainers,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
    [filteredTrainers, currentPage]
  );
  const totalPages = pagination.totalPages;
  const visiblePage = pagination.currentPage;
  const paginatedTrainers = pagination.paginated;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const stats = useMemo(
    () => userManagementService.buildTrainersStats({ filteredTrainers }),
    [filteredTrainers]
  );

  const openCreateModal = () => {
    setEditingTrainer(null);
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setEditingTrainer(trainer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTrainer(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingTrainer) {
        await userActions.handleEdit(editingTrainer.id, formData, 'entrenador');
        showMessage('success', 'Entrenador actualizado correctamente');
      } else {
        await userActions.handleCreate(formData, 'entrenador');
        showMessage('success', 'Entrenador creado exitosamente');
      }
      closeModal();
      loadTrainers();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      await userActions.handleDelete(showDeleteModal.id, 'entrenador');
      showMessage('success', 'Entrenador eliminado correctamente');
      setShowDeleteModal(null);
      loadTrainers();
    } catch (error) {
      showMessage('error', `Error al eliminar: ${error.message}`);
    }
  };

  const confirmSuspend = async ({ reason, until }) => {
    try {
      await userActions.handleSuspend(showSuspendModal.id, reason, until);
      showMessage('success', 'Entrenador suspendido correctamente');
      setShowSuspendModal(null);
      loadTrainers();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmReactivate = async (trainer) => {
    try {
      await userActions.handleReactivate(trainer.id);
      showMessage('success', 'Entrenador reactivado correctamente');
      loadTrainers();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmResendCredentials = async (channels) => {
    try {
      await userActions.handleResendCredentials(showResendModal.id, channels);
      showMessage('success', 'Credenciales enviadas correctamente');
      setShowResendModal(null);
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const confirmChangeRole = async (newRole) => {
    try {
      await userActions.handleChangeRole(showChangeRoleModal.id, newRole);
      showMessage('success', 'Rol cambiado correctamente');
      setShowChangeRoleModal(null);
      loadTrainers();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'apellido',
      sortOrder: 'asc'
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Entrenadores"
        subtitle={`${stats.total} entrenadores encontrados - ${stats.activos} activos, ${stats.suspendidos} suspendidos`}
        icon={<FaChalkboardTeacher />}
        actions={
          permissions.canCreate && (
            <Button onClick={openCreateModal}>
              <FaPlus className="mr-2" /> Agregar Entrenador
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
      
      <div className="grid gap-4 tablet:grid-cols-3">
        <Card className="h-full border-l-4 border-l-[#F9B233]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Total</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.total}</p>
            </div>
            <div className="text-3xl text-amber-200">
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
            <div className="text-3xl text-emerald-300">
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
            <div className="text-3xl text-rose-300">
              <FaBan />
            </div>
          </div>
        </Card>
      </div>
      
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        userType="entrenador"
        showCategoryFilter={false}
        onReset={handleResetFilters}
      />
      
      {loading ? (
        <Card>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" />
            <p className="text-sm">Cargando entrenadores...</p>
          </div>
        </Card>
      ) : paginatedTrainers.length === 0 ? (
        <EmptyState
          icon={<FaChalkboardTeacher />}
          title={filters.search || filters.status !== 'all' ? "No se encontraron entrenadores" : "No hay entrenadores registrados"}
          description={filters.search || filters.status !== 'all' ? "Intenta ajustar los filtros" : "Agrega el primer entrenador al club"}
          action={permissions.canCreate && !filters.search && filters.status === 'all' && (
            <Button onClick={openCreateModal}>
              <FaPlus className="mr-2" /> Agregar Entrenador
            </Button>
          )}
        />
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {paginatedTrainers.map(trainer => (
              <UserCard
                key={trainer.id}
                user={{
                  ...trainer,
                  full_name: `${trainer.nombre || ''} ${trainer.apellido || ''}`.trim()
                }}
                userType="entrenador"
                permissions={permissions}
                onEdit={() => openEditModal(trainer)}
                onDelete={() => setShowDeleteModal(trainer)}
                onSuspend={() => setShowSuspendModal(trainer)}
                onReactivate={() => confirmReactivate(trainer)}
                onResendCredentials={() => setShowResendModal(trainer)}
                onChangeRole={() => setShowChangeRoleModal(trainer)}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={visiblePage === 1}>
                Anterior
              </Button>
              <span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">
                Página {visiblePage} de {totalPages}
              </span>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={visiblePage === totalPages}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
      
      {showModal && (
        <Modal
          title={editingTrainer ? 'Editar Entrenador' : 'Agregar Nuevo Entrenador'}
          icon={editingTrainer ? <FaEdit /> : <FaPlus />}
          onClose={closeModal}
          className="max-w-4xl"
        >
            <UserForm userType="entrenador" initialData={editingTrainer} onSubmit={handleSubmit} onCancel={closeModal} submitLabel={editingTrainer ? 'Actualizar' : 'Guardar'} />
        </Modal>
      )}
      
      {showSuspendModal && <SuspendUserModal user={showSuspendModal} onConfirm={confirmSuspend} onCancel={() => setShowSuspendModal(null)} />}
      {showResendModal && <ResendCredentialsModal user={showResendModal} onConfirm={confirmResendCredentials} onCancel={() => setShowResendModal(null)} />}
      {showDeleteModal && <DeleteUserModal user={showDeleteModal} userType="entrenador" onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(null)} />}
      {showChangeRoleModal && <ChangeRoleModal user={showChangeRoleModal} currentRole={showChangeRoleModal.role} onConfirm={confirmChangeRole} onCancel={() => setShowChangeRoleModal(null)} />}
    </div>
  );
};

export default TrainersTab;







