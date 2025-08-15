import { PermissionSet, UserRole } from './types.js';

export const PERMISSIONS: Record<UserRole, PermissionSet> = {
  admin: { canViewDashboard: true, canManageDocuments: true, canManageEmployees: true, canManageTasks: true, canManageFinance: true, canManageNotes: true, canManageHR: true, canViewReports: true, canManageInternalExpenses: true, canManageAssets: true, canManageSettings: true, canManageUsers: true, canPostUpdates: true, canManageEmail: true },
  director: { canViewDashboard: true, canManageDocuments: true, canManageEmployees: true, canManageTasks: true, canManageFinance: true, canManageNotes: true, canManageHR: true, canViewReports: true, canManageInternalExpenses: true, canManageAssets: true, canManageSettings: false, canManageUsers: true, canPostUpdates: false, canManageEmail: true },
  coordinator: { canViewDashboard: true, canManageDocuments: false, canManageEmployees: true, canManageTasks: true, canManageFinance: false, canManageNotes: false, canManageHR: true, canViewReports: true, canManageInternalExpenses: false, canManageAssets: false, canManageSettings: false, canManageUsers: false, canPostUpdates: false, canManageEmail: false },
  support: { canViewDashboard: true, canManageDocuments: false, canManageEmployees: false, canManageTasks: true, canManageFinance: false, canManageNotes: false, canManageHR: false, canViewReports: false, canManageInternalExpenses: false, canManageAssets: false, canManageSettings: false, canManageUsers: false, canPostUpdates: false, canManageEmail: false },
};

const ENTITY_PERMISSION_MAP: Record<string, keyof PermissionSet | 'dashboard' | 'settings'> = {
    employees: 'canManageEmployees',
    tasks: 'canManageTasks',
    financeData: 'canManageFinance', // Also covers municipalities
    municipalities: 'canManageFinance',
    profiles: 'canManageUsers',
    employeeExpenses: 'canManageHR',
    internalExpenses: 'canManageInternalExpenses',
    assets: 'canManageAssets',
    suppliers: 'canManageInternalExpenses', // Part of ADM Infoco
    transactions: 'canManageFinance',
    payrolls: 'canManageHR',
    leaveRequests: 'canManageHR',
    externalSystems: 'canManageSettings',
    updatePosts: 'canPostUpdates',
    managedFiles: 'canManageDocuments',
    paymentNotes: 'canManageNotes',
    notifications: 'canViewDashboard', // Basic permission to interact
    dashboard: 'canViewDashboard',
    settings: 'canManageSettings',
};

type Action = 'add' | 'update' | 'delete' | 'view';

export function checkPermission(role: UserRole | undefined, entity: string, action: Action): boolean {
    if (!role) return false;
    // Admin has all permissions
    if (role === 'admin') return true;

    const permissionKey = ENTITY_PERMISSION_MAP[entity];
    if (!permissionKey) {
        console.warn(`No permission mapping found for entity: ${entity}`);
        return false; // Default to deny if no mapping exists
    }

    const userPermissions = PERMISSIONS[role];
    if (!userPermissions) return false;
    
    // For view actions, we just check the base permission. For write actions, we also check.
    // This simplifies the map, as most "manage" permissions imply read/write.
    return userPermissions[permissionKey as keyof PermissionSet];
}
