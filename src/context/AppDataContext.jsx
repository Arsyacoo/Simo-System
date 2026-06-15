import { useCallback, useEffect, useMemo, useState } from 'react';
import { createInitialDemoState } from '../data/seedData';
import { getAuditLogs } from '../services/auditLogsApi';
import { useBackendApi } from '../services/apiClient';
import { getProjects } from '../services/projectsApi';
import {
  getQcChecklists,
  submitQcChecklist as submitQcChecklistApi,
} from '../services/qcApi';
import { getRoles } from '../services/rolesApi';
import { getUsers } from '../services/usersApi';
import { getWarehouses } from '../services/warehousesApi';
import {
  getWorkItems,
  updateWorkItemStatus as updateWorkItemStatusApi,
} from '../services/workItemsApi';
import { AppDataContext } from './AppDataCore';
import { useAuth } from './AuthCore';

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

function replaceById(items, replacement) {
  return items.map((item) => (item.id === replacement.id ? replacement : item));
}

function normalizeCollections(collections) {
  return {
    roles: collections.roles || [],
    users: collections.users || [],
    projects: collections.projects || [],
    warehouses: collections.warehouses || [],
    workItems: collections.workItems || [],
    qcChecklists: collections.qcChecklists || [],
    auditLogs: collections.auditLogs || [],
  };
}

export function AppDataProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [data, setData] = useState(loadDemoState);
  const [activeUserId, setActiveUserId] = useState(() => {
    try {
      return window.localStorage.getItem(ACTIVE_USER_KEY) || 'usr-owner';
    } catch {
      return 'usr-owner';
    }
  });
  const [dataSource, setDataSource] = useState(useBackendApi ? 'localStorage-fallback' : 'localStorage');
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

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
        roleName: user.roleName || rolesById.get(user.roleId)?.name || user.roleId,
      })),
    [data.users, rolesById],
  );

  const activeUser = useMemo(() => {
    if (currentUser) {
      return {
        ...currentUser,
        roleName: currentUser.roleName || rolesById.get(currentUser.roleId)?.name || currentUser.roleId,
      };
    }

    return users.find((user) => user.id === activeUserId) || users[0];
  }, [activeUserId, currentUser, rolesById, users]);
  const effectiveActiveUserId = activeUser?.id || activeUserId;

  const loadBackendData = useCallback(async () => {
    if (!useBackendApi || !isAuthenticated) {
      return false;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const [
        roles,
        backendUsers,
        projects,
        warehouses,
        workItems,
        qcChecklists,
        auditLogs,
      ] = await Promise.all([
        getRoles(),
        getUsers(),
        getProjects(),
        getWarehouses(),
        getWorkItems(),
        getQcChecklists(),
        getAuditLogs(),
      ]);

      setData(normalizeCollections({
        roles,
        users: backendUsers,
        projects,
        warehouses,
        workItems,
        qcChecklists,
        auditLogs,
      }));
      setDataSource('backend');
      return true;
    } catch (error) {
      setApiError(error.message || 'Backend API unavailable. Using local fallback data.');
      setDataSource('localStorage-fallback');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = window.setTimeout(() => {
        void loadBackendData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loadBackendData]);

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

  const applyLocalWorkItemStatus = useCallback(
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

  const updateWorkItemStatus = useCallback(
    async (workItemId, nextStatus) => {
      if (useBackendApi && dataSource === 'backend') {
        setIsMutating(true);
        setApiError(null);

        try {
          const updatedItem = await updateWorkItemStatusApi(workItemId, nextStatus, activeUser?.id);
          const auditLogs = await getAuditLogs();

          setData((currentData) => ({
            ...currentData,
            workItems: replaceById(currentData.workItems, updatedItem),
            auditLogs,
          }));
          return;
        } catch (error) {
          setApiError(error.message || 'Backend update failed. Saved to local fallback data.');
          setDataSource('localStorage-fallback');
        } finally {
          setIsMutating(false);
        }
      }

      applyLocalWorkItemStatus(workItemId, nextStatus);
    },
    [activeUser, applyLocalWorkItemStatus, dataSource],
  );

  const applyLocalQcChecklist = useCallback(
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

  const submitQcChecklist = useCallback(
    async (payload) => {
      if (useBackendApi && dataSource === 'backend') {
        setIsMutating(true);
        setApiError(null);

        try {
          await submitQcChecklistApi({
            ...payload,
            userId: activeUser?.id,
            evidencePhotoReference: payload.evidencePhoto,
          });

          const [workItems, qcChecklists, auditLogs] = await Promise.all([
            getWorkItems(),
            getQcChecklists(),
            getAuditLogs(),
          ]);

          setData((currentData) => ({
            ...currentData,
            workItems,
            qcChecklists,
            auditLogs,
          }));
          return;
        } catch (error) {
          setApiError(error.message || 'Backend QC submission failed. Saved to local fallback data.');
          setDataSource('localStorage-fallback');
        } finally {
          setIsMutating(false);
        }
      }

      applyLocalQcChecklist(payload);
    },
    [activeUser, applyLocalQcChecklist, dataSource],
  );

  const resetDemoData = useCallback(() => {
    setData(createInitialDemoState());
    setActiveUserId(currentUser?.id || 'usr-owner');
    setApiError(null);
    setDataSource(useBackendApi ? 'localStorage-fallback' : 'localStorage');
  }, [currentUser]);

  const value = useMemo(
    () => ({
      data,
      users,
      activeUser,
      activeUserId: effectiveActiveUserId,
      setActiveUserId,
      permissions,
      projectsById,
      warehousesById,
      metrics,
      updateWorkItemStatus,
      submitQcChecklist,
      resetDemoData,
      refreshBackendData: loadBackendData,
      dataSource,
      apiError,
      isLoading,
      isMutating,
    }),
    [
      data,
      users,
      activeUser,
      effectiveActiveUserId,
      permissions,
      projectsById,
      warehousesById,
      metrics,
      updateWorkItemStatus,
      submitQcChecklist,
      resetDemoData,
      loadBackendData,
      dataSource,
      apiError,
      isLoading,
      isMutating,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
