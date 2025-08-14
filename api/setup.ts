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
        const usersToInsert = DEFAULT_SYSTEM_USERS.map(user => {
            const { password, ...userData } = user;
            return {
                ...userData,
                passwordHash: hashPassword(password || 'senhaPadrao123')
            };
        });
        await db.insert(schema.profiles).values(usersToInsert);
        
        const allUsers = await db.select().from(schema.profiles);
        const adminUser = allUsers.find((u: { role: string; }) => u.role === 'admin');
        if (!adminUser) throw new Error("Usuário admin não encontrado após inserção.");

        console.log('Povoando a tabela de posts de atualização...');
        const postsToInsert = DEFAULT_UPDATE_POSTS.map(post => ({ ...post, authorId: adminUser.id }));
        await db.insert(schema.updatePosts).values(postsToInsert);

        console.log('Povoando a tabela de funcionários...');
        const employeesToInsert = DEFAULT_EMPLOYEES.map(e => ({...e, baseSalary: e.baseSalary?.toString() }));
        await db.insert(schema.employees).values(employeesToInsert);
        const allEmployees = await db.select().from(schema.employees);

        console.log('Povoando a tabela de tarefas...');
        const tasksToInsert = DEFAULT_TASKS.map(task => {
            const { employeeIndex, ...taskData } = task;
            return {
                ...taskData,
                hours: taskData.hours.toString(),
                employeeId: allEmployees[employeeIndex].id
            };
        });
        await db.insert(schema.tasks).values(tasksToInsert);

        console.log('Povoando a tabela de municípios (dados financeiros)...');
        const municipalitiesToInsert = DEFAULT_FINANCE_DATA.map(m => ({ ...m, paid: m.paid.toString(), pending: m.pending.toString() }));
        await db.insert(schema.municipalities).values(municipalitiesToInsert);
        const allMunicipalities = await db.select().from(schema.municipalities);

        console.log('Povoando a tabela de despesas de funcionários...');
        const employeeExpensesToInsert = DEFAULT_EMPLOYEE_EXPENSES.map(exp => {
            const { employeeIndex, ...expData } = exp;
            return {
                ...expData,
                amount: expData.amount.toString(),
                employeeId: allEmployees[employeeIndex].id
            };
        });
        await db.insert(schema.employeeExpenses).values(employeeExpensesToInsert);

        console.log('Povoando a tabela de fornecedores...');
        await db.insert(schema.suppliers).values(DEFAULT_SUPPLIERS);
        const allSuppliers = await db.select().from(schema.suppliers);
        
        console.log('Povoando a tabela de despesas internas...');
        const internalExpensesToInsert = DEFAULT_INTERNAL_EXPENSES.map(exp => {
            const { supplierIndex, ...expData } = exp;
            return {
                ...expData,
                amount: expData.amount.toString(),
                supplierId: supplierIndex !== undefined ? allSuppliers[supplierIndex].id : undefined
            };
        });
        await db.insert(schema.internalExpenses).values(internalExpensesToInsert);
        
        console.log('Povoando a tabela de patrimônio (assets)...');
        const assetsToInsert = DEFAULT_ASSETS.map(asset => {
            const { employeeIndex, ...assetData } = asset;
            return {
                ...assetData,
                purchaseValue: assetData.purchaseValue.toString(),
                assignedToEmployeeId: employeeIndex !== undefined ? allEmployees[employeeIndex].id : undefined
            };
        });
        await db.insert(schema.assets).values(assetsToInsert);

        console.log('Povoando a tabela de notificações...');
        await db.insert(schema.notifications).values(DEFAULT_NOTIFICATIONS);

        console.log('Povoando a tabela de transações...');
        const transactionsToInsert = DEFAULT_TRANSACTIONS.map(t => {
            const { municipalityIndex, ...tData } = t;
            return {
                ...tData,
                amount: tData.amount.toString(),
                municipalityId: municipalityIndex !== undefined ? allMunicipalities[municipalityIndex].id : undefined
            };
        });
        await db.insert(schema.transactions).values(transactionsToInsert);
        
        console.log('Povoando a tabela de folhas de pagamento...');
        const payrollsToInsert = DEFAULT_PAYROLLS.map(p => {
            const { employeeIndex, ...pData } = p;
            return {
                ...pData,
                baseSalary: pData.baseSalary.toString(),
                benefits: pData.benefits.toString(),
                deductions: pData.deductions.toString(),
                netPay: pData.netPay.toString(),
                employeeId: allEmployees[employeeIndex].id
            };
        });
        await db.insert(schema.payrollRecords).values(payrollsToInsert);
        
        console.log('Povoando a tabela de solicitações de ausência...');
        const leaveRequestsToInsert = DEFAULT_LEAVE_REQUESTS.map(l => {
            const { employeeIndex, ...lData } = l;
            return {
                ...lData,
                employeeId: allEmployees[employeeIndex].id
            };
        });
        await db.insert(schema.leaveRequests).values(leaveRequestsToInsert);
        
        console.log('Povoando a tabela de sistemas externos...');
        if (DEFAULT_EXTERNAL_SYSTEMS.length > 0) {
            await db.insert(schema.externalSystems).values(DEFAULT_EXTERNAL_SYSTEMS);
        }

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
