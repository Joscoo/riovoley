import { useEffect, useMemo, useState } from 'react';
import { userManagementService } from '../../../userManagementService';

const STORAGE_KEY = 'userManagementActiveTab';

export const useUserManagementPanel = ({ userRole }) => {
  const panelAccess = useMemo(
    () => userManagementService.getPanelAccess({ userRole }),
    [userRole]
  );

  const visibleTabs = useMemo(
    () => userManagementService.getVisiblePanelTabs({ userRole }),
    [userRole]
  );

  const [activeTab, setActiveTab] = useState(() => {
    const storedTab = localStorage.getItem(STORAGE_KEY);
    return userManagementService.getValidPanelActiveTab({
      userRole,
      candidateTabId: storedTab || 'athletes',
    });
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const validTab = userManagementService.getValidPanelActiveTab({
      userRole,
      candidateTabId: activeTab,
    });
    if (validTab !== activeTab) {
      setActiveTab(validTab);
    }
  }, [userRole, activeTab]);

  return {
    panelAccess,
    visibleTabs,
    activeTab,
    setActiveTab,
  };
};

export default useUserManagementPanel;



