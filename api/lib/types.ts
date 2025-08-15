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

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  pfp?: string;
}

export interface UpdatePost {
    id: number;
    author_id: string;
    content: string;
    created_at: string;
}

export type ExternalSystemType = 'Contábil' | 'Licitações' | 'Almoxarifado' | 'Patrimônio' | 'Outro';

export interface ExternalSystem {
    id: number;
    name: string;
    type: ExternalSystemType;
    apiUrl: string;
    accessToken: string;
    tokenType: string;
}
