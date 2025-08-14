
import 'dotenv/config';
import { db } from './lib/db.js';
import * as schema from './lib/schema.js';
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
} from './lib/constants.js';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { Buffer } from 'buffer';

const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // --- Security Check ---
        const setupSecret = process.env.SETUP_SECRET;
        if (!setupSecret) {
            return res.status(500).json({ error: 'SETUP_SECRET não está configurado no servidor.' });
        }

        const providedSecret = req.query.secret;
        if (!providedSecret) {
            return res.status(401).json({ error: 'Secret de setup não fornecido.' });
        }
        
        // Use timingSafeEqual to prevent timing attacks
        const isAuthorized = timingSafeEqual(Buffer.from(providedSecret), Buffer.from(setupSecret));
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Secret de setup inválido.' });
        }

        // --- Check if already seeded ---
        const existingUsers = await db.select({ id: schema.profiles.id }).from(schema.profiles).limit(1);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'O banco de dados já foi populado. Nenhuma ação foi executada.' });
        }

        console.log('Iniciando povoamento do banco de dados via API...');

        console.log('Povoando a tabela de perfis (usuários)...');
        const userInserts = DEFAULT_SYSTEM_USERS.map(user => ({
            ...user,
            passwordHash: hashPassword(user.password || 'senhaPadrao123')
        }));
        await db.insert(schema.profiles).values(userInserts.map(({ password, ...rest }) => rest));

        const allUsers = await db.select().from(schema.profiles);
        const adminUser = allUsers.find((u: { role: string; }) => u.role === 'admin');
        if (!adminUser) throw new Error("Usuário admin não encontrado após inserção.");

        console.log('Povoando a tabela de posts de atualização...');
        await db.insert(schema.updatePosts).values(DEFAULT_UPDATE_POSTS.map(post => ({ ...post, authorId: adminUser.id })));

        console.log('Povoando a tabela de funcionários...');
        await db.insert(schema.employees).values(DEFAULT_EMPLOYEES.map(e => ({...e, baseSalary: e.baseSalary?.toString() })));
        const allEmployees = await db.select().from(schema.employees);

        console.log('Povoando a tabela de tarefas...');
        await db.insert(schema.tasks).values(DEFAULT_TASKS.map(task => ({
            ...task,
            hours: task.hours.toString(),
            employeeId: allEmployees[task.employeeIndex].id
        })).map(({ employeeIndex, ...rest }) => rest));

        console.log('Povoando a tabela de municípios (dados financeiros)...');
        await db.insert(schema.municipalities).values(DEFAULT_FINANCE_DATA.map(m => ({ ...m, paid: m.paid.toString(), pending: m.pending.toString() })));
        const allMunicipalities = await db.select().from(schema.municipalities);

        console.log('Povoando a tabela de despesas de funcionários...');
        await db.insert(schema.employeeExpenses).values(DEFAULT_EMPLOYEE_EXPENSES.map(exp => ({
            ...exp,
            amount: exp.amount.toString(),
            employeeId: allEmployees[exp.employeeIndex].id
        })).map(({ employeeIndex, ...rest}) => rest));

        console.log('Povoando a tabela de fornecedores...');
        await db.insert(schema.suppliers).values(DEFAULT_SUPPLIERS);
        const allSuppliers = await db.select().from(schema.suppliers);
        
        console.log('Povoando a tabela de despesas internas...');
        await db.insert(schema.internalExpenses).values(DEFAULT_INTERNAL_EXPENSES.map(exp => ({
            ...exp,
            amount: exp.amount.toString(),
            supplierId: exp.supplierIndex !== undefined ? allSuppliers[exp.supplierIndex].id : undefined
        })).map(({ supplierIndex, ...rest }) => rest));
        
        console.log('Povoando a tabela de patrimônio (assets)...');
        await db.insert(schema.assets).values(DEFAULT_ASSETS.map(asset => ({
            ...asset,
            purchaseValue: asset.purchaseValue.toString(),
            assignedToEmployeeId: asset.employeeIndex !== undefined ? allEmployees[asset.employeeIndex].id : undefined
        })).map(({ employeeIndex, ...rest}) => rest));

        console.log('Povoando a tabela de notificações...');
        await db.insert(schema.notifications).values(DEFAULT_NOTIFICATIONS);

        console.log('Povoando a tabela de transações...');
        await db.insert(schema.transactions).values(DEFAULT_TRANSACTIONS.map(t => ({
            ...t,
            amount: t.amount.toString(),
            municipalityId: t.municipalityIndex !== undefined ? allMunicipalities[t.municipalityIndex].id : undefined
        })).map(({ municipalityIndex, ...rest }) => rest));
        
        console.log('Povoando a tabela de folhas de pagamento...');
        await db.insert(schema.payrollRecords).values(DEFAULT_PAYROLLS.map(p => ({
            ...p,
            baseSalary: p.baseSalary.toString(),
            benefits: p.benefits.toString(),
            deductions: p.deductions.toString(),
            netPay: p.netPay.toString(),
            employeeId: allEmployees[p.employeeIndex].id
        })).map(({ employeeIndex, ...rest}) => rest));
        
        console.log('Povoando a tabela de solicitações de ausência...');
        await db.insert(schema.leaveRequests).values(DEFAULT_LEAVE_REQUESTS.map(l => ({
            ...l,
            employeeId: allEmployees[l.employeeIndex].id
        })).map(({ employeeIndex, ...rest}) => rest));
        
        console.log('Povoando a tabela de sistemas externos...');
        await db.insert(schema.externalSystems).values(DEFAULT_EXTERNAL_SYSTEMS);

        console.log('Salvando configurações padrão (permissões)...');
        await db.insert(schema.appConfig).values([
            { key: 'permissions', value: DEFAULT_PERMISSIONS },
            { key: 'loginScreenImageUrl', value: null }
        ]);

        console.log('Povoamento concluído com sucesso.');
        return res.status(200).json({ message: 'Banco de dados populado com sucesso!' });

    } catch (error: any) {
        console.error('Erro durante o povoamento via API:', error);
        return res.status(500).json({ error: 'Erro interno do servidor durante o povoamento.', details: error.message });
    }
}