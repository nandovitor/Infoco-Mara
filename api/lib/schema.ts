import { relations } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, uuid, pgEnum, integer, serial, boolean, jsonb, decimal, date } from 'drizzle-orm/pg-core';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['admin', 'coordinator', 'support', 'director']);
export const taskStatusEnum = pgEnum('task_status', ['Concluída', 'Em Andamento', 'Pendente']);
export const expenseTypeEnum = pgEnum('expense_type', ['Salário', 'Vale', 'Viagem', 'Reembolso', 'Outro']);
export const paymentStatusEnum = pgEnum('payment_status', ['Pago', 'Pendente']);
export const internalExpenseCategoryEnum = pgEnum('internal_expense_category', ['Material de Escritório', 'Contas Fixas', 'Manutenção', 'Marketing', 'Outros']);
export const assetStatusEnum = pgEnum('asset_status', ['Em Uso', 'Em Manutenção', 'Danificado', 'Descartado']);
export const notificationTypeEnum = pgEnum('notification_type', ['system', 'reminder']);
export const transactionTypeEnum = pgEnum('transaction_type', ['receivable', 'payable']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'paid']);
export const leaveTypeEnum = pgEnum('leave_type', ['Férias', 'Licença Médica', 'Outro']);
export const leaveStatusEnum = pgEnum('leave_status', ['Pendente', 'Aprovada', 'Rejeitada']);
export const externalSystemTypeEnum = pgEnum('external_system_type', ['Contábil', 'Licitações', 'Almoxarifado', 'Patrimônio', 'Outro']);

// --- TABLES ---

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  pfp: varchar('pfp', { length: 255 }),
  passwordHash: text('password_hash').notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const employees = pgTable('employees', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    position: varchar('position', { length: 255 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
});

export const updatePosts = pgTable('update_posts', {
    id: serial('id').primaryKey(),
    authorId: uuid('author_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    date: date('date').notNull(),
    hours: decimal('hours', { precision: 5, scale: 2 }).notNull(),
    status: taskStatusEnum('status').notNull(),
});

export const municipalities = pgTable('municipalities', {
    id: serial('id').primaryKey(),
    municipality: varchar('municipality', { length: 255 }).notNull().unique(),
    paid: decimal('paid', { precision: 12, scale: 2 }).notNull(),
    pending: decimal('pending', { precision: 12, scale: 2 }).notNull(),
    contractEndDate: date('contract_end_date').notNull(),
    coatOfArmsUrl: varchar('coat_of_arms_url', { length: 255 }),
});

export const employeeExpenses = pgTable('employee_expenses', {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    type: expenseTypeEnum('type').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    date: date('date').notNull(),
    status: paymentStatusEnum('status').notNull(),
    receipt: varchar('receipt', { length: 255 }),
});

export const suppliers = pgTable('suppliers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
});

export const internalExpenses = pgTable('internal_expenses', {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    category: internalExpenseCategoryEnum('category').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    date: date('date').notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
});

export const assets = pgTable('assets', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    purchaseDate: date('purchase_date').notNull(),
    purchaseValue: decimal('purchase_value', { precision: 10, scale: 2 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    status: assetStatusEnum('status').notNull(),
    assignedToEmployeeId: integer('assigned_to_employee_id').references(() => employees.id, { onDelete: 'set null' }),
});

export const maintenanceRecords = pgTable('maintenance_records', {
    id: serial('id').primaryKey(),
    assetId: integer('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    description: text('description').notNull(),
    cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
});

export const managedFiles = pgTable('managed_files', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    size: integer('size').notNull(),
    url: varchar('url', { length: 255 }).notNull(),
    municipalityName: varchar('municipality_name', { length: 255 }).notNull(),
    folder: varchar('folder', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const paymentNotes = pgTable('payment_notes', {
    id: serial('id').primaryKey(),
    referenceMonth: varchar('reference_month', { length: 7 }).notNull(), // YYYY-MM
    description: text('description').notNull(),
    uploadDate: timestamp('upload_date').notNull().defaultNow(),
    municipalityName: varchar('municipality_name', { length: 255 }).notNull(),
    fileUrl: varchar('file_url', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(),
    fileType: varchar('file_type', { length: 100 }).notNull(),
});

export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    date: timestamp('date').notNull().defaultNow(),
    eventDate: date('event_date'),
    read: boolean('read').notNull().default(false),
    link: varchar('link', { length: 255 }),
});

export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    type: transactionTypeEnum('type').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: date('due_date').notNull(),
    paymentDate: date('payment_date'),
    status: transactionStatusEnum('status').notNull(),
    municipalityId: integer('municipality_id').references(() => municipalities.id, { onDelete: 'set null' }),
});

export const payrollRecords = pgTable('payroll_records', {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    monthYear: varchar('month_year', { length: 7 }).notNull(), // YYYY-MM
    baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).notNull(),
    benefits: decimal('benefits', { precision: 10, scale: 2 }).notNull(),
    deductions: decimal('deductions', { precision: 10, scale: 2 }).notNull(),
    netPay: decimal('net_pay', { precision: 10, scale: 2 }).notNull(),
    payDate: date('pay_date').notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    type: leaveTypeEnum('type').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason').notNull(),
    status: leaveStatusEnum('status').notNull(),
});

export const externalSystems = pgTable('external_systems', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: externalSystemTypeEnum('type').notNull(),
    apiUrl: varchar('api_url', { length: 255 }).notNull(),
    accessToken: text('access_token').notNull(),
    tokenType: varchar('token_type', { length: 50 }).notNull(),
});

export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value'),
});


// --- RELATIONS ---

export const profilesRelations = relations(profiles, ({ many }) => ({
	sessions: many(sessions),
    updatePosts: many(updatePosts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	profile: one(profiles, {
		fields: [sessions.userId],
		references: [profiles.id],
	}),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
    tasks: many(tasks),
    employeeExpenses: many(employeeExpenses),
    assets: many(assets),
    payrollRecords: many(payrollRecords),
    leaveRequests: many(leaveRequests),
}));

export const updatePostsRelations = relations(updatePosts, ({ one }) => ({
    author: one(profiles, { fields: [updatePosts.authorId], references: [profiles.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
    employee: one(employees, { fields: [tasks.employeeId], references: [employees.id] }),
}));

export const municipalitiesRelations = relations(municipalities, ({ many }) => ({
    transactions: many(transactions),
}));

export const employeeExpensesRelations = relations(employeeExpenses, ({ one }) => ({
    employee: one(employees, { fields: [employeeExpenses.employeeId], references: [employees.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    internalExpenses: many(internalExpenses),
}));

export const internalExpensesRelations = relations(internalExpenses, ({ one }) => ({
    supplier: one(suppliers, { fields: [internalExpenses.supplierId], references: [suppliers.id] }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
    assignedTo: one(employees, { fields: [assets.assignedToEmployeeId], references: [employees.id] }),
    maintenanceLog: many(maintenanceRecords),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
    asset: one(assets, { fields: [maintenanceRecords.assetId], references: [assets.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    municipality: one(municipalities, { fields: [transactions.municipalityId], references: [municipalities.id] }),
}));

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
    employee: one(employees, { fields: [payrollRecords.employeeId], references: [employees.id] }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
    employee: one(employees, { fields: [leaveRequests.employeeId], references: [employees.id] }),
}));