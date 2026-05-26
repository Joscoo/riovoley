import React from 'react';
import { FaBan } from 'react-icons/fa';
import { cn } from '../../../../lib/cn';
import { Button, Card, iconRegistry, semanticCatalog } from '../../../../shared/ui';
import { useUserManagementPanel } from './hooks/useUserManagementPanel';
import AdministratorsTab from './tabs/AdministratorsTab';
import AthletesTab from './tabs/AthletesTab';
import TrainersTab from './tabs/TrainersTab';

const StudentTabIcon = iconRegistry.userTypes.atleta;
const TrainerTabIcon = iconRegistry.userTypes.entrenador;
const AdminTabIcon = iconRegistry.userTypes.administrador;
const UsersIcon = iconRegistry.users;

const TAB_ICONS = {
  athletes: <StudentTabIcon />,
  trainers: <TrainerTabIcon />,
  administrators: <AdminTabIcon />,
};

const UserManagementPanel = ({ userRole, user }) => {
  const { panelAccess, visibleTabs, activeTab, setActiveTab } = useUserManagementPanel({ userRole });

  if (!panelAccess.hasAccess) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700">
          <FaBan /> Acceso denegado
        </h2>
        <p className="mt-3 text-slate-700">No tienes permisos para acceder a este módulo.</p>
        <p className="mt-1 text-slate-700">Tu rol actual: <strong>{userRole || 'Sin rol'}</strong></p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-rv-gold/20 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rv-gold to-yellow-400">
          <UsersIcon className="text-2xl text-rv-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{semanticCatalog.UI_LABELS.usersManagementTitle}</h1>
          <p className="text-sm text-slate-300">
            {panelAccess.isAdmin
              ? semanticCatalog.UI_LABELS.usersManagementAdminDescription
              : semanticCatalog.UI_LABELS.usersManagementTrainerDescription}
          </p>
        </div>
      </div>

      <Card padding="sm">
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                size="sm"
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => setActiveTab(tab.id)}
                className={cn('transition-all duration-200', isActive && 'shadow-lg')}
              >
                <span className="mr-2">{TAB_ICONS[tab.id]}</span>
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="animate-fadeIn">
        {activeTab === 'athletes' && <AthletesTab userRole={userRole} />}
        {activeTab === 'trainers' && panelAccess.isAdmin && <TrainersTab userRole={userRole} />}
        {activeTab === 'administrators' && panelAccess.isAdmin && (
          <AdministratorsTab userRole={userRole} currentUserId={user?.id || null} />
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;
