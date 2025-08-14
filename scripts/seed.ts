import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../api/lib/schema.js';
import {
    DEFAULT_SYSTEM_USERS,
    DEFAULT_UPDATE_POSTS,
    DEFAULT_EMPLOYEES,
    DEFAULT_TASKS,
    DEFAULT_FINANCE_DATA,
    DEFAULT_EMPLOYEE_EXPENSES,
    DEFAULT_SUPPLIERS,
    DEFAULT_INTERNAL_EXPENSES,
    DEFAULT_ASSETS,
    DEFAULT_NOTIFICATIONS,
    DEFAULT_TRANSACTIONS,
    DEFAULT_PAYROLLS,
    DEFAULT_LEAVE_REQUESTS,
    DEFAULT_EXTERNAL_SYSTEMS,
    DEFAULT_PERMISSIONS
} from '../constants.js';
import { pbkdf2Sync, randomBytes } from 'crypto';

// --- Database connection specific for seeding ---
// Use standard node-postgres (pg) driver which supports transactions,
// unlike the neon-http driver used in the main application.
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
const db = drizzle(pool, { schema });


const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

async function main() {
    console.log('Iniciando script de povoamento (seed)...');
    
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
        console.error('\nERRO: A variável de ambiente SETUP_SECRET não está definida.');
        console.log('Por favor, adicione-a ao seu arquivo .env para rodar o script de seed.\n');
        await pool.end();
        return;
    }
    
    try {
        // Check if DB is already seeded
        const existingUsers = await db.select({ id: schema.profiles.id }).from(schema.profiles).limit(1);
        if (existingUsers.length > 0) {
            console.warn('\nAVISO: O banco de dados já parece ter sido populado. O script não será executado novamente.');
            console.log('Para repopular, limpe o banco de dados primeiro.\n');
            await pool.end();
            return;
        }
        
        console.log('Povoando a tabela de perfis (usuários)...');
        const userInserts = DEFAULT_SYSTEM_USERS.map(user => ({
            ...user,
            passwordHash: hashPassword(user.password || 'senhaPadrao123')
        }));
        await db.insert(schema.profiles).values(userInserts.map(({ password, ...rest }) => rest));

        // Fetch created users to map for foreign keys
        const allUsers = await db.select().from(schema.profiles);
        const adminUser = allUsers.find(u => u.role === 'admin');
        if (!adminUser) throw new Error("Usuário admin não encontrado após inserção.");

        console.log('Povoando a tabela de posts de atualização...');
        const postInserts = DEFAULT_UPDATE_POSTS.map(post => ({
            ...post,
            authorId: adminUser.id
        }));
        await db.insert(schema.updatePosts).values(postInserts);

        console.log('Povoando a tabela de funcionários...');
        const employeeInserts = DEFAULT_EMPLOYEES.map(e => ({...e, baseSalary: e.baseSalary?.toString()}));
        await db.insert(schema.employees).values(employeeInserts);
        const allEmployees = await db.select().from(schema.employees);

        console.log('Povoando a tabela de tarefas...');
        const taskInserts = DEFAULT_TASKS.map(task => ({
            ...task,
            hours: task.hours.toString(),
            employeeId: allEmployees[task.employeeIndex].id
        }));
        await db.insert(schema.tasks).values(taskInserts.map(({ employeeIndex, ...rest }) => rest));
        
        console.log('Povoando a tabela de municípios (dados financeiros)...');
        const financeDataInserts = DEFAULT_FINANCE_DATA.map(m => ({ ...m, paid: m.paid.toString(), pending: m.pending.toString() }));
        await db.insert(schema.municipalities).values(financeDataInserts);
        const allMunicipalities = await db.select().from(schema.municipalities);
        
        console.log('Povoando a tabela de despesas de funcionários...');
        const employeeExpenseInserts = DEFAULT_EMPLOYEE_EXPENSES.map(exp => ({
            ...exp,
            amount: exp.amount.toString(),
            employeeId: allEmployees[exp.employeeIndex].id
        }));
        await db.insert(schema.employeeExpenses).values(employeeExpenseInserts.map(({ employeeIndex, ...rest}) => rest));

        console.log('Povoando a tabela de fornecedores...');
        await db.insert(schema.suppliers).values(DEFAULT_SUPPLIERS);
        const allSuppliers = await db.select().from(schema.suppliers);
        
        console.log('Povoando a tabela de despesas internas...');
        const internalExpenseInserts = DEFAULT_INTERNAL_EXPENSES.map(exp => ({
            ...exp,
            amount: exp.amount.toString(),
            supplierId: exp.supplierIndex !== undefined ? allSuppliers[exp.supplierIndex].id : undefined
        }));
        await db.insert(schema.internalExpenses).values(internalExpenseInserts.map(({ supplierIndex, ...rest }) => rest));
        
        console.log('Povoando a tabela de patrimônio (assets)...');
        const assetInserts = DEFAULT_ASSETS.map(asset => ({
            ...asset,
            purchaseValue: asset.purchaseValue.toString(),
            assignedToEmployeeId: asset.employeeIndex !== undefined ? allEmployees[asset.employeeIndex].id : undefined
        }));
        await db.insert(schema.assets).values(assetInserts.map(({ employeeIndex, ...rest}) => rest));

        console.log('Povoando a tabela de notificações...');
        await db.insert(schema.notifications).values(DEFAULT_NOTIFICATIONS);

        console.log('Povoando a tabela de transações...');
        const transactionInserts = DEFAULT_TRANSACTIONS.map(t => ({
            ...t,
            amount: t.amount.toString(),
            municipalityId: t.municipalityIndex !== undefined ? allMunicipalities[t.municipalityIndex].id : undefined
        }));
        await db.insert(schema.transactions).values(transactionInserts.map(({ municipalityIndex, ...rest }) => rest));
        
        console.log('Povoando a tabela de folhas de pagamento...');
        const payrollInserts = DEFAULT_PAYROLLS.map(p => ({
            ...p,
            baseSalary: p.baseSalary.toString(),
            benefits: p.benefits.toString(),
            deductions: p.deductions.toString(),
            netPay: p.netPay.toString(),
            employeeId: allEmployees[p.employeeIndex].id
        }));
        await db.insert(schema.payrollRecords).values(payrollInserts.map(({ employeeIndex, ...rest}) => rest));
        
        console.log('Povoando a tabela de solicitações de ausência...');
        const leaveRequestInserts = DEFAULT_LEAVE_REQUESTS.map(l => ({
            ...l,
            employeeId: allEmployees[l.employeeIndex].id
        }));
        await db.insert(schema.leaveRequests).values(leaveRequestInserts.map(({ employeeIndex, ...rest}) => rest));
        
        console.log('Povoando a tabela de sistemas externos...');
        if (DEFAULT_EXTERNAL_SYSTEMS.length > 0) {
            await db.insert(schema.externalSystems).values(DEFAULT_EXTERNAL_SYSTEMS);
        }

        console.log('Salvando configurações padrão (permissões)...');
        await db.insert(schema.appConfig).values({ key: 'permissions', value: DEFAULT_PERMISSIONS });
        await db.insert(schema.appConfig).values({ key: 'loginScreenImageUrl', value: null });

        console.log('\n✅ Povoamento (seed) concluído com sucesso!\n');

    } catch (error) {
        console.error('\n❌ Erro durante o script de povoamento:', error);
    } finally {
        await pool.end();
        console.log('Conexão com o banco de dados encerrada.');
    }
}

main();
