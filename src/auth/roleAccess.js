export const ROLE_NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    roles: ['owner', 'production-manager', 'admin'],
  },
  {
    path: '/warehouses',
    label: 'Warehouses',
    roles: ['production-manager', 'foreman', 'admin'],
  },
  {
    path: '/logistics',
    label: 'Logistics',
    roles: ['admin'],
  },
  {
    path: '/qc',
    label: 'QC',
    roles: ['qc-inspector', 'admin'],
  },
  {
    path: '/audit',
    label: 'Audit Logs',
    roles: ['owner', 'production-manager', 'admin'],
  },
];

export function canAccessPath(roleId, path) {
  const item = ROLE_NAV_ITEMS.find((entry) => entry.path === path);
  return Boolean(item && item.roles.includes(roleId));
}

export function getAllowedNavItems(roleId) {
  return ROLE_NAV_ITEMS.filter((item) => item.roles.includes(roleId));
}

export function getDefaultPathForRole(roleId) {
  return getAllowedNavItems(roleId)[0]?.path || '/login';
}
