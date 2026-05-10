import React, { useState, useEffect } from 'react';
import { FaBan, FaUsers, FaUser, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { cn } from '../../../lib/cn';
import AthletesTab from './tabs/AthletesTab';
import TrainersTab from './tabs/TrainersTab';
import AdministratorsTab from './tabs/AdministratorsTab';

const UserManagementPanel = ({ user, userRole }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('userManagementActiveTab') || 'athletes';
  });
  
  const isAdmin = userRole?.toLowerCase() === 'administrador';
  const isTrainer = userRole?.toLowerCase() === 'entrenador';
  
  useEffect(() => {
    localStorage.setItem('userManagementActiveTab', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    if (isTrainer && activeTab !== 'athletes') {
      setActiveTab('athletes');
    }
  }, [isTrainer, activeTab]);
  
  if (!isAdmin && !isTrainer) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700">
          <FaBan /> Acceso Denegado
        </h2>
        <p className="mt-3 text-slate-700">No tienes permisos para acceder a este módulo.</p>
        <p className="mt-1 text-slate-700">Tu rol actual: <strong>{userRole || 'Sin rol'}</strong></p>
      </div>
    );
  }
  
  const tabs = [
    { id: 'athletes', label: 'Atletas', icon: <FaUser />, visible: true },
    { id: 'trainers', label: 'Entrenadores', icon: <FaChalkboardTeacher />, visible: isAdmin },
    { id: 'administrators', label: 'Administradores', icon: <FaUserShield />, visible: isAdmin }
  ].filter(tab => tab.visible);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-rv-gold/20 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rv-gold to-yellow-400">
          <FaUsers className="text-2xl text-rv-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-300">
            {isAdmin ? 'Administrar atletas, entrenadores y administradores del club' : 'Administrar atletas del club'}
          </p>
        </div>
      </div>
      
      <Card padding="sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                size="sm"
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => setActiveTab(tab.id)}
                className={cn('transition-all duration-200', isActive && 'shadow-lg')}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>
      
      <div className="animate-fadeIn">
        {activeTab === 'athletes' && <AthletesTab userRole={userRole} />}
        {activeTab === 'trainers' && isAdmin && <TrainersTab userRole={userRole} />}
        {activeTab === 'administrators' && isAdmin && <AdministratorsTab userRole={userRole} />}
      </div>
    </div>
  );
};

export default UserManagementPanel;