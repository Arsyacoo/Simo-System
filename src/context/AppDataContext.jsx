import { useCallback, useEffect, useMemo, useState } from 'react';
import { createInitialDemoState } from '../data/seedData';
import { AppDataContext } from './AppDataCore';

const STORAGE_KEY = 'simo-mugi-jaya-demo-state';
const ACTIVE_USER_KEY = 'simo-mugi-jaya-active-user';

function timestampNow() {
  return new Date().toLocaleString('sv-SE', { hour12: false });
}

function loadDemoState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : createInitialDemoState();
  } catch {
    return createInitialDemoState();
  }
}

function buildAuditLog(activeUser, details) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: timestampNow(),
    user: activeUser?.name || 'System',
    role: activeUser?.roleName || 'System',
    ...details,
  };
}

export function AppDataProvider({ children }) {
  const [data, setData] = useState(loadDemoState);
  const [activeUserId, setActiveUserId] = useState(() => {
    try {
      return window.localStorage.getItem(ACTIVE_USER_KEY) || 'usr-owner';
    } catch {
      return 'usr-owner';
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_USER_KEY, activeUserId);
  }, [activeUserId]);

  const rolesById = useMemo(
    () => new Map(data.roles.map((role) => [role.id, role])),
    [data.roles],
  );

  const users = useMemo(
    () =>
      data.users.map((user) => ({
        ...user,
        roleName: rolesById.get(user.roleId)?.name || user.roleId,
      })),
    [data.users, rolesById],
  );

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId) || users[0],
    [activeUserId, users],
  );

  const permissions = useMemo(() => {
    const roleId = activeUser?.roleId;

    return {
      canUpdateProduction: ['foreman', 'production-manager', 'admin'].includes(roleId),
      canSubmitQc: ['qc-inspector', 'admin'].includes(roleId),
      canViewAudit: ['owner', 'production-manager', 'admin'].includes(roleId),
    };
  }, [activeUser]);

  const projectsById = useMemo(
    () => new Map(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );

  const warehousesById = useMemo(
    () => new Map(data.warehouses.map((warehouse) => [warehouse.id, warehouse])),
    [data.warehouses],
  );

  const metrics = useMemo(() => {
    const totalWorkItems = data.workItems.length;
    const completedWorkItems = data.workItems.filter((item) => item.status === 'Done').length;
    const readyToShipItems = data.workItems.filter((item) => item.readyToShip).length;
    const pendingQcItems = data.workItems.filter(
      (item) => item.status === 'Done' && item.qcStatus !== 'Passed QC',
    ).length;
    const progressPercentage = totalWorkItems
      ? Math.round((completedWorkItems / totalWorkItems) * 100)
      : 0;

    const projectProgress = data.projects.map((project) => {
      const items = data.workItems.filter((item) => item.projectId === project.id);
      const completed = items.filter((item) => item.status === 'Done').length;

      return {
        ...project,
        totalWorkItems: items.length,
        completedWorkItems: completed,
        progressPercentage: items.length ? Math.round((completed / items.length) * 100) : 0,
      };
    });

    const warehouseProgress = data.warehouses.map((warehouse) => {
      const items = data.workItems.filter((item) => item.warehouseId === warehouse.id);
      const completed = items.filter((item) => item.status === 'Done').length;
      const projectCodes = [
        ...new Set(items.map((item) => projectsById.get(item.projectId)?.code).filter(Boolean)),
      ];

      return {
        ...warehouse,
        projectCodes,
        totalWorkItems: items.length,
        completedWorkItems: completed,
        progressPercentage: items.length ? Math.round((completed / items.length) * 100) : 0,
      };
    });

    return {
      totalProjects: data.projects.length,
      totalWarehouses: data.warehouses.length,
      totalWorkItems,
      completedWorkItems,
      readyToShipItems,
      pendingQcItems,
      progressPercentage,
      projectProgress,
      warehouseProgress,
    };
  }, [data.projects, data.warehouses, data.workItems, projectsById]);

  const updateWorkItemStatus = useCallback(
    (workItemId, nextStatus) => {
      setData((currentData) => {
        const workItem = currentData.workItems.find((item) => item.id === workItemId);

        if (!workItem || workItem.status === nextStatus) {
          return currentData;
        }

        const updatedWorkItems = currentData.workItems.map((item) =>
          item.id === workItemId ? { ...item, status: nextStatus } : item,
        );

        const auditLog = buildAuditLog(activeUser, {
          action: 'UPDATE',
          table: 'work_items',
          recordId: workItem.id,
          previousValue: workItem.status,
          newValue: nextStatus,
          description: `Updated ${workItem.materialName} from ${workItem.status} to ${nextStatus}.`,
        });

        return {
          ...currentData,
          workItems: updatedWorkItems,
          auditLogs: [auditLog, ...currentData.auditLogs],
        };
      });
    },
    [activeUser],
  );

  const submitQcChecklist = useCallback(
    (payload) => {
      setData((currentData) => {
        const workItem = currentData.workItems.find((item) => item.id === payload.workItemId);
        const checklist = {
          id: `qc-${Date.now()}`,
          ...payload,
          length: Number(payload.length) || 0,
          width: Number(payload.width) || 0,
          thickness: Number(payload.thickness) || 0,
          createdBy: activeUser?.name || 'System',
          createdByRole: activeUser?.roleName || 'System',
          createdAt: timestampNow(),
        };

        const updatedWorkItems = currentData.workItems.map((item) =>
          item.id === payload.workItemId
            ? {
                ...item,
                qcStatus: payload.qcStatus,
                readyToShip: payload.qcStatus === 'Passed QC',
              }
            : item,
        );

        const auditLog = buildAuditLog(activeUser, {
          action: 'INSERT',
          table: 'qc_checklists',
          recordId: checklist.id,
          previousValue: workItem?.qcStatus || '-',
          newValue: payload.qcStatus,
          description: `Submitted QC checklist for ${payload.materialName}.`,
        });

        return {
          ...currentData,
          workItems: updatedWorkItems,
          qcChecklists: [checklist, ...currentData.qcChecklists],
          auditLogs: [auditLog, ...currentData.auditLogs],
        };
      });
    },
    [activeUser],
  );

  const resetDemoData = useCallback(() => {
    setData(createInitialDemoState());
    setActiveUserId('usr-owner');
  }, []);

  const value = useMemo(
    () => ({
      data,
      users,
      activeUser,
      activeUserId,
      setActiveUserId,
      permissions,
      projectsById,
      warehousesById,
      metrics,
      updateWorkItemStatus,
      submitQcChecklist,
      resetDemoData,
    }),
    [
      data,
      users,
      activeUser,
      activeUserId,
      permissions,
      projectsById,
      warehousesById,
      metrics,
      updateWorkItemStatus,
      submitQcChecklist,
      resetDemoData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
