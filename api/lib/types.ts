
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
    canManageFinance: boolean; // Controls both Finance and Municipalities
    canManageHR: boolean;
    canViewReports: boolean;
    canManageInternalExpenses: boolean;
    canManageAssets: boolean;
    canManageSettings: boolean; // Admin only
    canManageNotes: boolean;
    canManageUsers: boolean;
    canPostUpdates: boolean;
    canManageEmail: boolean;
}


// --- Types copied from frontend for backend constants ---
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
    author_id: string; // Links to Profile.id (UUID)
    content: string;
    created_at: string; // ISO String
}

export interface Permissions {
    [role: string]: PermissionSet;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  baseSalary?: number;
}

export type TaskStatus = 'Concluída' | 'Em Andamento' | 'Pendente';

export interface Task {
  id: number;
  employeeId: number;
  title: string;
  description: string;
  date: string;
  hours: number;
  status: TaskStatus;
}

export interface FinanceData {
    id: number;
    municipality: string;
    paid: number;
    pending: number;
    contractEndDate: string; // YYYY-MM-DD
    coatOfArmsUrl?: string;
}

export type ExpenseType = 'Salário' | 'Vale' | 'Viagem' | 'Reembolso' | 'Outro';
export type PaymentStatus = 'Pago' | 'Pendente';

export interface EmployeeExpense {
  id: number;
  employeeId: number;
  type: ExpenseType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: PaymentStatus;
  receipt?: string; // a string for a filename or URL
}

export type InternalExpenseCategory = 'Material de Escritório' | 'Contas Fixas' | 'Manutenção' | 'Marketing' | 'Outros';

export interface InternalExpense {
    id: number;
    description: string;
    category: InternalExpenseCategory;
    amount: number;
    date: string; // YYYY-MM-DD
    supplierId?: number;
}

export type AssetStatus = 'Em Uso' | 'Em Manutenção' | 'Danificado' | 'Descartado';

export interface MaintenanceRecord {
    id: number;
    date: string; // YYYY-MM-DD
    description: string;
    cost: number;
}

export interface Asset {
    id: number;
    name: string;
    description: string;
    purchaseDate: string; // YYYY-MM-DD
    purchaseValue: number;
    location: string;
    status: AssetStatus;
    assignedToEmployeeId?: number;
    maintenanceLog: MaintenanceRecord[];
}

export type NotificationType = 'system' | 'reminder';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  date: string; // ISO String of when it was created
  eventDate?: string; // YYYY-MM-DD for reminders or event dates
  read: boolean;
  link?: string;
}

export interface Supplier {
    id: number;
    name: string;
    category: string;
    contactPerson: string;
    email: string;
    phone: string;
}

export type TransactionType = 'receivable' | 'payable';
export type TransactionStatus = 'pending' | 'paid';
export interface Transaction {
    id: number;
    type: TransactionType;
    description: string;
    amount: number;
    dueDate: string; // YYYY-MM-DD
    paymentDate?: string; // YYYY-MM-DD
    status: TransactionStatus;
    municipalityId?: number;
}

export interface PayrollRecord {
    id: number;
    employeeId: number;
    monthYear: string; // YYYY-MM
    baseSalary: number;
    benefits: number;
    deductions: number;
    netPay: number;
    payDate: string; // YYYY-MM-DD
}

export type LeaveType = 'Férias' | 'Licença Médica' | 'Outro';
export type LeaveStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';
export interface LeaveRequest {
    id: number;
    employeeId: number;
    type: LeaveType;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
    status: LeaveStatus;
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
