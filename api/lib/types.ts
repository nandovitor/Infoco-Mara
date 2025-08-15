// This file contains types specific to the backend API to avoid dependencies on frontend code.
export interface AttachmentPayload {
    fileName: string;
    content: string; // base64 encoded string
    mimeType: string;
}

export type UserRole = 'admin' | 'coordinator' | 'support' | 'director';

export interface PermissionSet {
    canViewDashboard: boolean;
    canManageDocuments: boolean;
    canManageEmployees: boolean;
    canManageTasks: boolean;
    canManageFinance: boolean;
    canManageHR: boolean;
    canViewReports: boolean;
    canManageInternalExpenses: boolean;
    canManageAssets: boolean;
    canManageSettings: boolean;
    canManageNotes: boolean;
    canManageUsers: boolean;
    canPostUpdates: boolean;
    canManageEmail: boolean;
}
