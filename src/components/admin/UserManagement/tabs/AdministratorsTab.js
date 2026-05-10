import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaUserShield, FaUsers, FaEdit, FaTimes } from 'react-icons/fa';
import { userManagementService } from '../../../../features/user-management';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useUserActions } from '../hooks/useUserActions';
import SectionHeader from '../../../ui/SectionHeader';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import EmptyState from '../../../ui/EmptyState';
import UserCard from '../shared/UserCard';
import UserForm from '../shared/UserForm';
import UserFilters from '../shared/UserFilters';
import ChangeRoleModal from '../shared/ChangeRoleModal';

const normalizeText = (value = '') =>
  value.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const AdministratorsTab = ({ userRole }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [filters, setFilters] = useState({ search: '', sortBy: 'apellido', sortOrder: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;
  
  const permissions = useUserPermissions({ userRole, targetUserType: 'administrador' });
  const userActions = useUserActions();

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4500);
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userManagementService.listAdministrators();
      setAdmins(data);
    } catch (error) {
      showMessage('error', `Error al cargar administradores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const filteredAdmins = useMemo(() => {
    let result = [...admins];
    if (filters.search) {
      const searchLower = normalizeText(filters.search);
      result = result.filter(a => {
        const fullName = `${a.nombre || ''} ${a.apellido || ''}`.trim();
        return normalizeText(fullName).includes(searchLower) || normalizeText(a.email || '').includes(searchLower);
      });
    }
    result.sort((a, b) => {
      const valueA = normalizeText(filters.sortBy === 'nombre' ? a.nombre : a.apellido) || '';
      const valueB = normalizeText(filters.sortBy === 'nombre' ? b.nombre : b.apellido) || '';
      return valueA < valueB ? (filters.sortOrder === 'asc' ? -1 : 1) : valueA > valueB ? (filters.sortOrder === 'asc' ? 1 : -1) : 0;
    });
    return result;
  }, [admins, filters]);

  useEffect(() => { setCurrentPage(1); }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / PAGE_SIZE));
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreateModal = () => { setEditingAdmin(null); setShowModal(true); };
  const openEditModal = (admin) => { setEditingAdmin(admin); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingAdmin(null); };

  const handleSubmit = async (formData) => {
    try {
      await userActions.handleCreate(formData, 'administrador');
      showMessage('success', 'Administrador creado exitosamente');
      closeModal();
      loadAdmins();
    } catch (error) { showMessage('error', `Error: ${error.message}`); }
  };

  const confirmChangeRole = async (newRole) => {
    try {
      await userActions.handleChangeRole(showChangeRoleModal.id, newRole);
      showMessage('success', 'Rol cambiado correctamente');
      setShowChangeRoleModal(null);
      loadAdmins();
    } catch (error) { showMessage('error', `Error: ${error.message}`); }
  };

  const handleResetFilters = () => setFilters({ search: '', sortBy: 'apellido', sortOrder: 'asc' });

  return (
    <div className="space-y-4">
      <SectionHeader title="Administradores" subtitle={`${filteredAdmins.length} administradores`} icon={<FaUserShield />} actions={permissions.canCreate && <Button onClick={openCreateModal}><FaPlus className="mr-2" /> Agregar Administrador</Button>} />
      
      {message.text && <div className={message.type === 'success' ? 'rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200' : 'rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200'}>{message.text}</div>}
      
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        <Card className="h-full border-l-4 border-l-[#2E3192]">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Total</h3><p className="mt-1 text-3xl font-black text-white">{filteredAdmins.length}</p></div>
            <div className="text-3xl text-[#2E3192]"><FaUsers /></div>
          </div>
        </Card>
      </div>
      
      <UserFilters filters={filters} onFiltersChange={setFilters} userType="administrador" showCategoryFilter={false} onReset={handleResetFilters} />
      
      {loading ? (
        <Card><div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-slate-200"><div className="h-10 w-10 animate-spin rounded-full border-2 border-rv-gold/30 border-t-rv-gold" /><p className="text-sm">Cargando...</p></div></Card>
      ) : paginatedAdmins.length === 0 ? (
        <EmptyState icon={<FaUserShield />} title={filters.search ? "No se encontraron" : "No hay administradores"} description={filters.search ? "Ajusta los filtros" : "Agrega el primer administrador"} action={permissions.canCreate && !filters.search && <Button onClick={openCreateModal}><FaPlus className="mr-2" /> Agregar</Button>} />
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {paginatedAdmins.map(admin => (
              <UserCard key={admin.id} user={{ ...admin, full_name: `${admin.nombre || ''} ${admin.apellido || ''}`.trim() }} userType="administrador" permissions={permissions} onEdit={() => openEditModal(admin)} onDelete={() => {}} onSuspend={() => {}} onReactivate={() => {}} onResendCredentials={() => {}} onChangeRole={() => setShowChangeRoleModal(admin)} />
            ))}
          </div>
          {totalPages > 1 && <div className="flex flex-wrap items-center justify-center gap-3"><Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button><span className="rounded-full border border-rv-gold/35 bg-black/35 px-4 py-2 text-sm font-semibold text-white">Página {currentPage} de {totalPages}</span><Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button></div>}
        </>
      )}
      
      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeModal}>
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-rv-gold/25 pb-3">
              <h3 className="text-lg font-bold text-white mobile:text-xl">{editingAdmin ? <><FaEdit className="mr-2 inline align-middle text-rv-gold" /> <span className="align-middle">Editar Administrador</span></> : <><FaPlus className="mr-2 inline align-middle text-rv-gold" /> <span className="align-middle">Nuevo Administrador</span></>}</h3>
              <Button variant="ghost" size="icon" onClick={closeModal}><FaTimes /></Button>
            </div>
            <UserForm userType="administrador" initialData={editingAdmin} onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Crear" />
          </Card>
        </div>
      )}
      
      {showChangeRoleModal && <ChangeRoleModal user={showChangeRoleModal} currentRole={showChangeRoleModal.role} onConfirm={confirmChangeRole} onCancel={() => setShowChangeRoleModal(null)} />}
    </div>
  );
};

export default AdministratorsTab;
