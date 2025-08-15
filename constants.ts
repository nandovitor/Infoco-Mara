


import { Employee, Task, FinanceData, Permissions, PermissionSet, UserRole, EmployeeExpense, ExpenseType, PaymentStatus, InternalExpense, InternalExpenseCategory, Asset, AssetStatus, Notification, Supplier, Transaction, PayrollRecord, LeaveRequest, Profile, UpdatePost, ExternalSystem, ExternalSystemType } from './types';

// IDs são removidos e serão gerados pelo banco de dados. Referências são feitas por email ou índice.
export const DEFAULT_SYSTEM_USERS: (Omit<Profile, 'id' | 'pfp'> & { password?: string })[] = [
    { email: 'admin@infoco.com', password: 'admin123', name: 'Administrador Sistema', role: 'admin', department: 'Administrativo' },
    { email: 'fernando@infoco.com', password: 'fernando123', name: 'Fernando Luiz', role: 'coordinator', department: 'Técnico' },
    { email: 'wendel@gmail.com', password: 'wendel123', name: 'Wendel Infoco', role: 'support', department: 'Suporte' },
    { email: 'uilber@gmail.com', password: 'uilber123', name: 'Uilber Aragão', role: 'director', department: 'SEO' },
];

export const DEFAULT_UPDATE_POSTS: Omit<UpdatePost, 'id' | 'author_id' | 'created_at'>[] = [
    {
        content: "Bem-vindo ao novo feed de **Notas de Atualização**! 🎉\n\n- Agora você pode ver todas as novidades e melhorias do sistema diretamente aqui.\n- Fique atento para mais atualizações em breve!",
    },
    {
        content: "Implementamos o módulo completo de *Gerenciamento de Usuários*. Administradores agora podem adicionar, editar e remover usuários do sistema na nova aba 'Usuários'.",
    }
];

export const DEFAULT_EMPLOYEES: Omit<Employee, 'id'>[] = [
    { name: 'Fernando Luiz', position: 'Coordenador Operacional', department: 'Técnico', email: 'fernando@infoco.com', baseSalary: 7500 },
    { name: 'Wendel Infoco', position: 'Suporte Técnico', department: 'Suporte', email: 'wendel@gmail.com', baseSalary: 4500 },
    { name: 'Uilber Aragão', position: 'Diretor Executivo', department: 'SEO', email: 'uilber@gmail.com', baseSalary: 15000 },
    { name: 'Ana Costa', position: 'Analista Financeiro', department: 'Financeiro', email: 'ana.costa@infoco.com', baseSalary: 6000 },
    { name: 'Carlos Silva', position: 'Advogado', department: 'Jurídico', email: 'carlos.silva@infoco.com', baseSalary: 8000 }
];

// employeeId agora é um índice no array DEFAULT_EMPLOYEES. O backend resolverá isso.
export const DEFAULT_TASKS: (Omit<Task, 'id' | 'employeeId'> & { employeeIndex: number })[] = [
    { employeeIndex: 0, title: 'Análise de ARPs e Contratos', description: 'Revisar e analisar processos administrativos pendentes', date: '2025-07-08', hours: 8, status: 'Concluída' },
    { employeeIndex: 1, title: 'Suporte Sistema', description: 'Atendimento a chamados técnicos do sistema', date: '2025-07-09', hours: 6, status: 'Em Andamento' },
    { employeeIndex: 2, title: 'Verificação de Processos Internos', description: 'Direção da Infoco', date: '2025-07-09', hours: 4, status: 'Pendente' },
    { employeeIndex: 3, title: 'Relatório de Fechamento Mensal', description: 'Compilar dados financeiros para o relatório de Junho.', date: '2025-07-10', hours: 7.5, status: 'Em Andamento' },
    { employeeIndex: 4, title: 'Análise de Contrato - Cliente X', description: 'Revisar cláusulas do novo contrato com o Cliente X.', date: '2025-07-15', hours: 5, status: 'Pendente' },
];

export const DEPARTMENTS = ["Administrativo", "Financeiro", "Recursos Humanos", "Tecnologia", "Jurídico", "Técnico", "Suporte", "SEO"];

export const DEFAULT_FINANCE_DATA: Omit<FinanceData, 'id'>[] = [
    { municipality: "ALMADINA", paid: 150000, pending: 25000, contractEndDate: '2025-07-31' },
    { municipality: "NOVA VIÇOSA", paid: 120000, pending: 45000, contractEndDate: '2025-08-15' },
    { municipality: "CACULÉ", paid: 95000, pending: 10000, contractEndDate: '2025-07-26' },
    { municipality: "MASCOTE", paid: 80000, pending: 30000, contractEndDate: '2025-09-01' },
    { municipality: "ITAQUARA", paid: 180000, pending: 5000, contractEndDate: '2025-07-08' },
    { municipality: "TEIXEIRA DE FREITAS", paid: 110000, pending: 12000, contractEndDate: '2025-10-20' },
];

export const DEFAULT_EMPLOYEE_EXPENSES: (Omit<EmployeeExpense, 'id' | 'employeeId'> & { employeeIndex: number })[] = [
    { employeeIndex: 0, type: 'Viagem', description: 'Visita ao cliente em Nova Viçosa', amount: 350.75, date: '2025-07-05', status: 'Pago', receipt: 'nf-viagem-001.pdf' },
    { employeeIndex: 1, type: 'Vale', description: 'Adiantamento quinzenal', amount: 500.00, date: '2025-07-15', status: 'Pendente' },
    { employeeIndex: 3, type: 'Reembolso', description: 'Compra de material de escritório', amount: 89.90, date: '2025-07-02', status: 'Pago', receipt: 'recibo-papelaria.jpg' },
    { employeeIndex: 0, type: 'Vale', description: 'Adiantamento quinzenal', amount: 600.00, date: '2025-07-15', status: 'Pago' },
];

export const EXPENSE_TYPES: ExpenseType[] = ['Salário', 'Vale', 'Viagem', 'Reembolso', 'Outro'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['Pago', 'Pendente'];

export const DEFAULT_SUPPLIERS: Omit<Supplier, 'id'>[] = [
    { name: 'Papelaria Central', category: 'Material de Escritório', contactPerson: 'João Mendes', email: 'contato@papelariacentral.com', phone: '(71) 3333-4444' },
    { name: 'Refrigeração Polar', category: 'Manutenção', contactPerson: 'Mariana Lima', email: 'suporte@refrigeracaopolar.com', phone: '(71) 98877-6655' },
    { name: 'Agência Digital Vibe', category: 'Marketing', contactPerson: 'Felipe Souza', email: 'felipe@vibe.com', phone: '(11) 91234-5678' },
];

export const DEFAULT_INTERNAL_EXPENSES: (Omit<InternalExpense, 'id' | 'supplierId'> & { supplierIndex?: number })[] = [
    { description: 'Compra de 50 resmas de papel A4', category: 'Material de Escritório', amount: 1250.00, date: '2025-07-01', supplierIndex: 0 },
    { description: 'Conta de energia elétrica - Sede', category: 'Contas Fixas', amount: 850.55, date: '2025-07-05' },
    { description: 'Manutenção do ar condicionado central', category: 'Manutenção', amount: 450.00, date: '2025-07-10', supplierIndex: 1 },
    { description: 'Campanha de marketing digital - Julho', category: 'Marketing', amount: 2500.00, date: '2025-07-12', supplierIndex: 2 },
];
export const INTERNAL_EXPENSE_CATEGORIES: InternalExpenseCategory[] = ['Material de Escritório', 'Contas Fixas', 'Manutenção', 'Marketing', 'Outros'];

export const DEFAULT_ASSETS: (Omit<Asset, 'id' | 'assignedToEmployeeId' | 'maintenanceLog'> & { employeeIndex?: number })[] = [
    { name: 'Notebook Dell Inspiron 15', description: 'Core i7, 16GB RAM, 512GB SSD', purchaseDate: '2024-01-15', purchaseValue: 5500.00, location: 'Sala da Diretoria', status: 'Em Uso', employeeIndex: 2 },
    { name: 'Impressora HP LaserJet Pro', description: 'Modelo M404dn, Rede', purchaseDate: '2023-11-20', purchaseValue: 1800.00, location: 'Recepção', status: 'Em Uso' },
    { name: 'Cadeira de Escritório Presidente', description: 'Marca Flexform, cor preta', purchaseDate: '2024-02-10', purchaseValue: 950.00, location: 'Sala do Financeiro', status: 'Em Manutenção', employeeIndex: 3 },
];
export const ASSET_STATUSES: AssetStatus[] = ['Em Uso', 'Em Manutenção', 'Danificado', 'Descartado'];

export const DOCUMENT_FOLDERS = ['Contratos', 'ARPs', 'Minutas', 'QDD', 'TR', 'DFDs'];

export const DEFAULT_NOTIFICATIONS: Omit<Notification, 'id' | 'date' | 'read'>[] = [
    { type: 'system', title: 'Vencimento de Contrato', description: 'O contrato com o município de ALMADINA vence em breve.', eventDate: '2025-07-31', link: 'municipalities' },
    { type: 'reminder', title: 'Lembrete Pessoal', description: 'Preparar apresentação para a reunião de sexta-feira.', eventDate: '2025-07-11', link: 'tasks' },
    { type: 'system', title: 'Tarefa Pendente', description: 'A tarefa "Relatório de Fechamento Mensal" ainda está em andamento.', link: 'tasks' }
];

export const DEFAULT_TRANSACTIONS: (Omit<Transaction, 'id' | 'municipalityId'> & { municipalityIndex?: number })[] = [
    { type: 'receivable', description: 'Recebimento NF #123 - ALMADINA', amount: 75000, dueDate: '2025-07-10', paymentDate: '2025-07-09', status: 'paid', municipalityIndex: 0 },
    { type: 'receivable', description: 'Recebimento NF #124 - NOVA VIÇOSA', amount: 60000, dueDate: '2025-07-15', status: 'pending', municipalityIndex: 1 },
    { type: 'payable', description: 'Pagamento Aluguel Escritório', amount: 4500, dueDate: '2025-07-05', paymentDate: '2025-07-05', status: 'paid' },
    { type: 'payable', description: 'Pagamento Fornecedor Papelaria Central', amount: 1250, dueDate: '2025-07-20', status: 'pending' },
];

export const TRANSACTION_TYPES = ['receivable', 'payable'];
export const TRANSACTION_STATUSES = ['pending', 'paid'];

export const DEFAULT_PAYROLLS: (Omit<PayrollRecord, 'id' | 'employeeId'> & { employeeIndex: number })[] = [
    { employeeIndex: 3, monthYear: '2025-06', baseSalary: 6000, benefits: 800, deductions: 650, netPay: 6150, payDate: '2025-07-05' },
    { employeeIndex: 0, monthYear: '2025-06', baseSalary: 7500, benefits: 1200, deductions: 980, netPay: 7720, payDate: '2025-07-05' },
];

export const DEFAULT_LEAVE_REQUESTS: (Omit<LeaveRequest, 'id' | 'employeeId'> & { employeeIndex: number })[] = [
    { employeeIndex: 1, type: 'Férias', startDate: '2025-08-01', endDate: '2025-08-15', reason: 'Férias anuais programadas', status: 'Aprovada' },
    { employeeIndex: 4, type: 'Licença Médica', startDate: '2025-07-20', endDate: '2025-07-22', reason: 'Consulta médica', status: 'Pendente' },
];
export const LEAVE_TYPES = ['Férias', 'Licença Médica', 'Outro'];
export const LEAVE_STATUSES = ['Pendente', 'Aprovada', 'Rejeitada'];

export const DEFAULT_PERMISSIONS: Permissions = {
  admin: { canViewDashboard: true, canManageDocuments: true, canManageEmployees: true, canManageTasks: true, canManageFinance: true, canManageNotes: true, canManageHR: true, canViewReports: true, canManageInternalExpenses: true, canManageAssets: true, canManageSettings: true, canManageUsers: true, canPostUpdates: true, canManageEmail: true },
  director: { canViewDashboard: true, canManageDocuments: true, canManageEmployees: true, canManageTasks: true, canManageFinance: true, canManageNotes: true, canManageHR: true, canViewReports: true, canManageInternalExpenses: true, canManageAssets: true, canManageSettings: false, canManageUsers: true, canPostUpdates: false, canManageEmail: true },
  coordinator: { canViewDashboard: true, canManageDocuments: false, canManageEmployees: true, canManageTasks: true, canManageFinance: false, canManageNotes: false, canManageHR: true, canViewReports: true, canManageInternalExpenses: false, canManageAssets: false, canManageSettings: false, canManageUsers: false, canPostUpdates: false, canManageEmail: false },
  support: { canViewDashboard: true, canManageDocuments: false, canManageEmployees: false, canManageTasks: true, canManageFinance: false, canManageNotes: false, canManageHR: false, canViewReports: false, canManageInternalExpenses: false, canManageAssets: false, canManageSettings: false, canManageUsers: false, canPostUpdates: false, canManageEmail: false },
};

export const PERMISSION_LABELS: Record<keyof PermissionSet, string> = {
    canViewDashboard: "Visualizar Dashboard", canManageDocuments: "Gerenciar Base de Dados", canManageEmployees: "Gerenciar Funcionários", canManageTasks: "Gerenciar Tarefas", canManageFinance: "Gerenciar Financeiro e Municípios", canManageNotes: "Gerenciar Notas de Pagamento", canManageHR: "Gerenciar Recursos Humanos", canViewReports: "Visualizar Relatórios", canManageInternalExpenses: "Gerenciar ADM Infoco", canManageAssets: "Gerenciar Patrimônio", canManageSettings: "Acessar Configurações", canManageUsers: "Gerenciar Usuários", canPostUpdates: "Publicar Atualizações", canManageEmail: "Gerenciar Email (Zoho)",
};

export const ROLE_LABELS: Record<UserRole, string> = { admin: "Administrador", director: "Diretor", coordinator: "Coordenador", support: "Suporte" };

export const DEFAULT_EXTERNAL_SYSTEMS: ExternalSystem[] = [];
export const EXTERNAL_SYSTEM_TYPES: ExternalSystemType[] = ['Contábil', 'Licitações', 'Almoxarifado', 'Patrimônio', 'Outro'];// This file is intentionally empty.
// Constants were centralized in the /constants.ts file in the root directory.
