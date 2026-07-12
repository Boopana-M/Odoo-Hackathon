import { useAuth } from '../components/layout/AuthContext';

export const PERMISSIONS = {
  ADMIN: 'Admin',
  MANAGER: 'Asset Manager',
  HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

// Centralized permission map
export const ROLE_ROUTES = {
  [PERMISSIONS.ADMIN]: [
    'dashboard', 'assets', 'allocation', 'booking', 'maintenance', 'audit', 'reports', 'organization', 'notifications'
  ],
  [PERMISSIONS.MANAGER]: [
    'dashboard', 'assets', 'allocation', 'booking', 'maintenance', 'audit', 'reports', 'notifications'
  ],
  [PERMISSIONS.HEAD]: [
    'dashboard', 'assets', 'allocation', 'booking', 'reports', 'notifications'
  ],
  [PERMISSIONS.EMPLOYEE]: [
    'dashboard', 'assets', 'booking', 'maintenance', 'reports', 'notifications'
  ]
};

export function usePermission() {
  const { user } = useAuth();
  
  const role = user?.role || PERMISSIONS.EMPLOYEE;

  const canAccessRoute = (routeId) => {
    return ROLE_ROUTES[role]?.includes(routeId) || false;
  };

  const isAdmin = role === PERMISSIONS.ADMIN;
  const isManager = role === PERMISSIONS.MANAGER;
  const isEmployee = role === PERMISSIONS.EMPLOYEE;

  return { role, canAccessRoute, isAdmin, isManager, isEmployee };
}
