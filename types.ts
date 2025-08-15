

export type UserRole = 'admin' | 'coordinator' | 'support' | 'director';

export interface User {
  id: string; // The currently authenticated user object
  email: string;
  name: string;
  role: UserRole;
  department: string;
  pfp?: string;
}

// For the `profiles` table, represents a user in the system.
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  pfp?: string;
}

// Deprecated, use Profile. The User interface is the main object for the app.
export interface SystemUser extends Profile {}

export interface UpdatePost {
    id: number;
    author_id: string; // Links to Profile.id (UUID)
    content: string;
    created_at: string; // ISO String
}

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

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
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

// Updated to a flat structure for relational DB
export interface ManagedFile {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  municipalityName: string;
  folder: string;
  createdAt: string;
}

// Updated to a flat structure for relational DB
export interface PaymentNote {
  id: number;
  referenceMonth: string; // YYYY-MM
  description: string;
  uploadDate: string; // ISO String
  municipalityName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
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
    payDate: string; // YYYY-DD-MM
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

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  sourceTitle: string;
}

export interface GroundingSource {
    web?: {
        uri: string;
        title: string;
    };
}

// --- ZOHO MAIL INTEGRATION TYPES ---
export interface ZohoTokenPayload {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}

export interface ZohoTokenData {
    access_token: string;
    refresh_token: string;
    expires_at: number; // Store expiration timestamp
}

export interface ZohoAccountInfo {
    accountId: string;
    primaryEmailAddress: string;
}

export interface ZohoEmailListItem {
    messageId: string;
    from: { emailAddress: string; name: string; };
    to: { emailAddress: string; name: string; }[];
    subject: string;
    summary: string;
    receivedTime: string; // ISO String
    isRead: boolean;
}

export interface ZohoEmail extends ZohoEmailListItem {
    content: string; // HTML content
    attachments: {
        attachmentId: string;
        fileName: string;
        size: number;
    }[];
}

export interface AttachmentPayload {
    fileName: string;
    mimeType: string;
    content: string; // base64 encoded string
}
