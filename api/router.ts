
import { db } from './lib/db.js';
import * as schema from './lib/schema.js';
import { eq } from 'drizzle-orm';
import { getSessionUser, createSession, deleteSession } from './lib/session.js';
import { GoogleGenAI } from "@google/genai";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import type { AttachmentPayload } from './lib/types.js';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import { checkPermission } from './lib/permissions.js';
import type { UserRole, ZohoTokenPayload } from '../types.js';


// --- Environment Variable Check ---
function checkEnvVariables() {
    const requiredEnvVars = [
        'POSTGRES_URL',
        'SESSION_SECRET',
        'API_KEY'
    ];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.error('FATAL: Missing required environment variables:', missingVars);
        throw new Error(`As seguintes variáveis de ambiente essenciais não estão configuradas no servidor: ${missingVars.join(', ')}. A função não pode ser executada.`);
    }
    if (process.env.SESSION_SECRET!.length < 64) {
         throw new Error('A variável de ambiente SESSION_SECRET precisa ter pelo menos 64 caracteres hexadecimais.');
    }
}

// --- Zoho Config ---
const zohoConfig = {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    redirectUri: process.env.ZOHO_REDIRECT_URI?.replace(/\/$/, ''), // Remove trailing slash if present
    scopes: ['ZohoMail.accounts.READ', 'ZohoMail.messages.ALL', 'ZohoMail.messages.CREATE'].join(','),
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
    apiBaseUrl: process.env.ZOHO_API_BASE_URL || 'https://mail.zoho.com/api',
};

function checkZohoCredentials() {
    const missingVars = [];
    if (!zohoConfig.clientId) missingVars.push('ZOHO_CLIENT_ID');
    if (!zohoConfig.clientSecret) missingVars.push('ZOHO_CLIENT_SECRET');
    if (!zohoConfig.redirectUri) missingVars.push('ZOHO_REDIRECT_URI');
    if (missingVars.length > 0) {
        throw new Error(`A integração com o Zoho Mail está desativada. As seguintes variáveis de ambiente precisam ser configuradas no painel do Vercel: ${missingVars.join(', ')}`);
    }
}

// --- Password Helpers ---
const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password: string, storedHash: string): boolean => {
    try {
        const [salt, key] = storedHash.split(':');
        if (!salt || !key) return false;
        const hashToCompare = pbkdf2Sync(password, salt, 1000, 64, 'sha512');
        const storedKeyBuffer = Buffer.from(key, 'hex');
        if (hashToCompare.length !== storedKeyBuffer.length) return false;
        return timingSafeEqual(hashToCompare, storedKeyBuffer);
    } catch (error) {
        console.error("Erro durante a verificação da senha:", error);
        return false;
    }
};


const ENTITY_MAP = {
    employees: schema.employees,
    tasks: schema.tasks,
    financeData: schema.municipalities,
    profiles: schema.profiles,
    employeeExpenses: schema.employeeExpenses,
    internalExpenses: schema.internalExpenses,
    assets: schema.assets,
    suppliers: schema.suppliers,
    transactions: schema.transactions,
    payrolls: schema.payrollRecords,
    leaveRequests: schema.leaveRequests,
    externalSystems: schema.externalSystems,
    updatePosts: schema.updatePosts,
    managedFiles: schema.managedFiles,
    paymentNotes: schema.paymentNotes,
    notifications: schema.notifications,
};
type EntityName = keyof typeof ENTITY_MAP;

// --- Main Handler ---
export default async function handler(req: any, res: any) {
    const { entity, action } = req.query;

    try {
        checkEnvVariables();
        
        let session = null;
        let userRole: UserRole | undefined = undefined;

        const isPublicEndpoint = (entity === 'gemini') ||
                             (entity === 'zoho' && (action === 'getAuthUrl' || action === 'refreshToken' || action === 'exchangeCode')) ||
                             (entity === 'auth' && action === 'login');

        if (!isPublicEndpoint) {
            session = await getSessionUser(req);
            if (!session) {
                return res.status(401).json({ error: 'Não autenticado. Por favor, faça login novamente.' });
            }
            const userResult = await db.select({ role: schema.profiles.role }).from(schema.profiles).where(eq(schema.profiles.id, session.id)).limit(1);
            if (userResult.length > 0) {
                userRole = userResult[0].role;
            } else {
                return res.status(401).json({ error: 'Sessão inválida. Usuário não encontrado.' });
            }
        }
        
        // --- Specific Handlers ---

        if (entity === 'auth') {
            return await authRouter(req, res, session);
        }
        
        if (entity === 'allData') {
            if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
            if (!checkPermission(userRole, 'dashboard', 'view')) return res.status(403).json({ error: 'Acesso negado.' });
            const allData = await fetchAllData();
            return res.status(200).json(allData);
        }

        if (entity === 'gemini') {
            return await geminiRouter(req, res);
        }
        
        if (entity === 'zoho') {
            return await zohoRouter(req, res, userRole);
        }
        
        if (entity === 'config') {
             if (req.method === 'POST' && action === 'set') {
                if (!checkPermission(userRole, 'settings', 'update')) return res.status(403).json({ error: 'Acesso negado.' });
                const { key, value } = req.body;
                if (!key || value === undefined) return res.status(400).json({ error: 'Key and value are required for config update.' });
                
                await db.insert(schema.appConfig)
                    .values({ key, value })
                    .onConflictDoUpdate({ target: schema.appConfig.key, set: { value } });

                return res.status(200).json({ success: true });
            }
            return res.status(400).json({ error: 'Invalid request for config entity' });
        }

        // --- Generic CRUD Handler ---
        if (!entity || !(entity in ENTITY_MAP)) {
            return res.status(400).json({ error: `Unknown entity: ${entity}` });
        }
        const entityName = entity as EntityName;
        const table = ENTITY_MAP[entityName];
        
        switch (req.method) {
            case 'POST': {
                const dataToSave = req.body;
                if (action === 'add') {
                     if (!checkPermission(userRole, entityName, 'add')) return res.status(403).json({ error: 'Você não tem permissão para adicionar este item.' });
                     
                     const dataToInsert = { ...dataToSave };
                     if (dataToInsert.id) delete dataToInsert.id;

                     if (entityName === 'profiles') {
                         if (!dataToInsert.password || !dataToInsert.email) {
                             return res.status(400).json({ error: 'Email e senha são obrigatórios para novos usuários.' });
                         }
                         dataToInsert.email = dataToInsert.email.toLowerCase();
                         dataToInsert.passwordHash = hashPassword(dataToInsert.password);
                         delete dataToInsert.password;
                     } else if (entityName === 'updatePosts' && session) {
                         dataToInsert.authorId = session.id;
                     }
                    
                    await db.insert(table).values(dataToInsert as any);

                } else if (action === 'update') {
                    if (!checkPermission(userRole, entityName, 'update')) return res.status(403).json({ error: 'Você não tem permissão para editar este item.' });
                    if (!dataToSave.id) return res.status(400).json({ error: 'ID is required for update' });
                    const { id, ...updateData } = dataToSave;
                    if (entityName === 'profiles') {
                        delete updateData.password;
                        delete updateData.passwordHash;
                        if(updateData.email) updateData.email = updateData.email.toLowerCase();
                    }
                    await (db.update(table) as any).set(updateData).where(eq((table as any).id, id));
                
                } else if (action === 'addMaintenanceRecord' && entityName === 'assets') {
                    if (!checkPermission(userRole, 'assets', 'update')) return res.status(403).json({ error: 'Você não tem permissão para adicionar registros de manutenção.' });
                    const { assetId, record } = req.body;
                    if (!assetId || !record) return res.status(400).json({ error: 'assetId and record are required.' });
                    await db.insert(schema.maintenanceRecords).values({ ...record, assetId });

                } else {
                    return res.status(400).json({ error: `Invalid POST action: ${action}` });
                }
                break;
            }
            case 'DELETE': {
                if (!checkPermission(userRole, entityName, 'delete')) return res.status(403).json({ error: 'Você não tem permissão para excluir este item.' });
                const { id } = req.body;
                if (!id) return res.status(400).json({ error: 'ID is required for delete' });
                await (db.delete(table) as any).where(eq((table as any).id, id));
                break;
            }
            default:
                res.setHeader('Allow', ['POST', 'DELETE', 'GET']);
                return res.status(405).json({ error: `Method ${req.method} not supported for this entity.` });
        }
        
        const updatedData = await fetchEntity(entityName);
        return res.status(200).json({ success: true, data: updatedData });

    } catch (error: any) {
        console.error(`API Error (entity: ${entity}, action: ${action}):`, error);
        if (error.message.includes('variáveis de ambiente') || error.message.includes('SESSION_SECRET')) {
             return res.status(503).json({
                error: 'Erro de Configuração do Servidor', 
                details: error.message 
            });
        }
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

// --- Auth Router ---
async function authRouter(req: any, res: any, session: { id: string } | null) {
    const { action } = req.query;

    switch (action) {
        case 'login': {
            if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
            }
            const userWithPassword = await db.query.profiles.findFirst({
                where: eq(schema.profiles.email, email.toLowerCase()),
            });
            if (!userWithPassword || !userWithPassword.passwordHash || !verifyPassword(password, userWithPassword.passwordHash)) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }
            const { passwordHash, ...userToReturn } = userWithPassword;
            await createSession(userWithPassword.id, res);
            return res.status(200).json({ user: userToReturn });
        }
        case 'me': {
            if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
            if (!session) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const result = await db.select({
                id: schema.profiles.id,
                email: schema.profiles.email,
                name: schema.profiles.name,
                role: schema.profiles.role,
                department: schema.profiles.department,
                pfp: schema.profiles.pfp,
            }).from(schema.profiles).where(eq(schema.profiles.id, session.id)).limit(1);
            const user = result[0];
            if (!user) {
                 return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ user });
        }
        case 'logout': {
            if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
             if (!session) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            await deleteSession(req, res);
            return res.status(200).json({ success: true });
        }
        default:
            return res.status(404).json({ error: `Unknown action for auth: ${action}` });
    }
}

// --- Data Fetching and Manipulation Logic ---

async function fetchEntity(entityName: EntityName) {
    const table = ENTITY_MAP[entityName];
    if (entityName === 'assets') {
        return await db.query.assets.findMany({ with: { maintenanceLog: true } });
    }
    return await db.select().from(table);
}

async function fetchAllData() {
    const data: { [key: string]: any } = {};
    const entityNames = Object.keys(ENTITY_MAP) as EntityName[];
    
    const results = await Promise.allSettled(
        entityNames.map(key => fetchEntity(key))
    );

    results.forEach((outcome, index) => {
        const key = entityNames[index];
        if (outcome.status === 'fulfilled') {
            data[key] = outcome.value;
        } else {
            console.error(`Failed to fetch entity "${key}":`, outcome.reason);
            data[key] = [];
        }
    });
    
    try {
        const configResult = await db.select().from(schema.appConfig);
        configResult.forEach((item: {key: string, value: any}) => {
            data[item.key] = item.value;
        });
    } catch (e) {
        console.error("Failed to fetch app_config:", e);
    }

    data['payrolls'] = data['payrollRecords'];
    delete data['payrollRecords'];
    
    return data;
}

// --- Gemini Router ---
async function geminiRouter(req: any, res: any) {
    const { action } = req.query;
    const apiKey = process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API_KEY do Gemini não configurada." });
    const ai = new GoogleGenAI({ apiKey });

    if (req.method === 'GET' && action === 'news') {
        const prompt = `Você é um agregador de notícias. Encontre notícias relevantes usando a Busca Google para 'licitações e contratos', 'AGU', 'TCU', 'TCM'. Formate a saída como um único objeto JSON { "articles": [...] }. Cada artigo deve ter 'title', 'summary', 'url', 'sourceTitle'. Retorne 5-7 artigos.`;
        const genAIResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] } });
        const textResponse = (genAIResponse.text || '').trim();
        const groundingMetadata = genAIResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        let articles = [];
        try {
            const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})|(\[[\s\S]*\])/);
            if (jsonMatch) {
                const jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
                articles = JSON.parse(jsonString).articles || [];
            } else {
                articles = JSON.parse(textResponse).articles || [];
            }
        } catch (e) {
            console.error("Failed to parse Gemini news response as JSON:", e);
            console.error("Original response text from Gemini:", textResponse);
            articles = [];
        }
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
        return res.status(200).json({ articles, sources: groundingMetadata });
    }

    if (req.method === 'POST' && action === 'analyze') {
        const { userInput, contextData } = req.body;
        const systemInstruction = `Você é um assistente de análise de dados. Analise o JSON fornecido e responda à pergunta do usuário de forma clara e concisa usando markdown.`;
        const prompt = `DADOS (JSON):**\n${JSON.stringify(contextData, null, 2)}\n\n---\n\nPERGUNTA:**\n${userInput}`;
        const genAIResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction } });
        return res.status(200).json({ response: genAIResponse.text?.trim() });
    }

    return res.status(404).json({ error: `Unknown action for Gemini: ${action}` });
}

// --- Zoho Router ---

/**
 * Handles error responses from the Zoho API in a robust way,
 * preventing server crashes on non-JSON or unexpected error formats.
 */
async function handleZohoError(response: Response, defaultMessage: string): Promise<never> {
    let errorMessage = defaultMessage;
    try {
        const errorData: any = await response.json();
        const message = errorData?.data?.message || errorData?.message || errorData?.error_description || errorData?.error;
        if (message) {
            errorMessage = message;
        } else {
            errorMessage = `${defaultMessage} (Status: ${response.status} ${response.statusText})`;
        }
    } catch (e) {
        // Not a JSON response, maybe HTML. Log it for debugging on the server.
        const textError = await response.text();
        console.error("Zoho API returned a non-JSON error:", textError.substring(0, 500));
        errorMessage = `${defaultMessage}. O servidor do Zoho retornou um erro inesperado. (Status: ${response.status})`;
    }
    throw new Error(errorMessage);
}


async function zohoRouter(req: any, res: any, userRole?: UserRole) {
    const { action } = req.query;

    if (req.method === 'GET' && action === 'checkConfig') {
        if (!checkPermission(userRole, 'mail', 'view')) {
            return res.status(403).json({ error: 'Acesso negado. Apenas usuários autorizados podem verificar a configuração.' });
        }
        const configForDisplay = {
            clientId: zohoConfig.clientId || 'NÃO DEFINIDO',
            clientSecret: zohoConfig.clientSecret ? `${zohoConfig.clientSecret.substring(0, 4)}...${zohoConfig.clientSecret.slice(-4)}` : 'NÃO DEFINIDO',
            redirectUri: zohoConfig.redirectUri || 'NÃO DEFINIDO',
            accountsUrl: zohoConfig.accountsUrl,
            apiBaseUrl: zohoConfig.apiBaseUrl,
            scopes: zohoConfig.scopes,
        };
        return res.status(200).json(configForDisplay);
    }
    
    try {
        checkZohoCredentials();
    } catch (error: any) {
        console.error("Zoho configuration error:", error.message);
        return res.status(503).json({ 
            error: 'O serviço de Email não está configurado no servidor.', 
            details: error.message 
        });
    }


    if (req.method === 'GET' && action === 'getAuthUrl') {
        const params = new URLSearchParams({
            scope: zohoConfig.scopes,
            client_id: zohoConfig.clientId!,
            response_type: 'code',
            redirect_uri: zohoConfig.redirectUri!,
            access_type: 'offline',
            prompt: 'consent'
        });
        const authUrl = `${zohoConfig.accountsUrl}/oauth/v2/auth?${params.toString()}`;
        return res.status(200).json({ authUrl });
    }

    if (req.method === 'POST' && action === 'exchangeCode') {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Código de autorização é obrigatório.' });

        const params = new URLSearchParams({ code, client_id: zohoConfig.clientId!, client_secret: zohoConfig.clientSecret!, redirect_uri: zohoConfig.redirectUri!, grant_type: 'authorization_code' });
        const response = await fetch(`${zohoConfig.accountsUrl}/oauth/v2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
        
        if (!response.ok) {
            await handleZohoError(response, 'Falha ao trocar o código pelo token.');
        }
        const tokenData = await response.json() as ZohoTokenPayload;
        return res.status(200).json(tokenData);
    }

    if (req.method === 'POST' && action === 'refreshToken') {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ error: 'Refresh token é obrigatório.' });

        const params = new URLSearchParams({ refresh_token, client_id: zohoConfig.clientId!, client_secret: zohoConfig.clientSecret!, grant_type: 'refresh_token' });
        const response = await fetch(`${zohoConfig.accountsUrl}/oauth/v2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
        
        if (!response.ok) {
            await handleZohoError(response, 'Falha ao renovar o token.');
        }
        const tokenData = await response.json() as { access_token: string; expires_in: number };
        return res.status(200).json({ access_token: tokenData.access_token, expires_in: tokenData.expires_in });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token de autorização ausente ou malformado.' });
    const accessToken = authHeader.split(' ')[1];
    
    const getAccountId = async (token: string) => {
        const response = await fetch(`${zohoConfig.apiBaseUrl}/accounts`, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
        if (!response.ok) {
            await handleZohoError(response, 'Falha ao buscar a conta do Zoho.');
        }
        const data = await response.json() as { data: { accountId: string }[] };
        if (!data?.data?.[0]?.accountId) throw new Error('accountId não encontrado na resposta do Zoho.');
        return data.data[0].accountId;
    };

    if (req.method === 'GET' && action === 'listEmails') {
        const accountId = await getAccountId(accessToken);
        const params = new URLSearchParams({ limit: '50', sortorder: 'desc', status: 'all' });
        const emailResponse = await fetch(`${zohoConfig.apiBaseUrl}/accounts/${accountId}/messages/view?${params.toString()}`, { headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } });
        
        if (!emailResponse.ok) {
            await handleZohoError(emailResponse, 'Falha ao buscar os e-mails.');
        }
        const emailData = await emailResponse.json() as { data: any[] };

        const emailList = Array.isArray(emailData.data) ? emailData.data : [];
        const simplifiedEmails = emailList.flatMap((email: any) => {
            try {
                if (!email || typeof email !== 'object') {
                    console.warn('Item inválido na lista de e-mails do Zoho foi ignorado:', email);
                    return [];
                }

                const from = email.from || { emailAddress: 'desconhecido@email.com', name: 'Remetente Desconhecido' };
                const to = Array.isArray(email.toAddress) ? email.toAddress.map((t: any) => ({ emailAddress: t?.address || '', name: t?.name || '' })) : [];
                const receivedTimestamp = Number(email.receivedTime);
                const receivedTime = !isNaN(receivedTimestamp) && receivedTimestamp > 0 ? new Date(receivedTimestamp).toISOString() : new Date().toISOString();
                
                return [{
                    messageId: email.messageId || `missing-id-${Math.random()}`,
                    from, to,
                    subject: email.subject || '(Sem assunto)',
                    summary: email.summary || '',
                    receivedTime,
                    isRead: !!email.isRead,
                }];
            } catch (e: any) {
                console.error('Falha ao processar um e-mail da lista do Zoho. E-mail problemático:', email, 'Erro:', e.message);
                return [];
            }
        });
        return res.status(200).json({ emails: simplifiedEmails, accountId });
    }

    if (req.method === 'GET' && action === 'getEmail') {
        const { messageId, accountId } = req.query;
        if (!messageId || !accountId) return res.status(400).json({ error: 'messageId e accountId são obrigatórios.' });
        
        const emailResponse = await fetch(`${zohoConfig.apiBaseUrl}/accounts/${accountId}/messages/${messageId}`, { headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } });
        if (!emailResponse.ok) {
            await handleZohoError(emailResponse, 'Falha ao buscar o conteúdo do e-mail.');
        }
        const emailData = await emailResponse.json() as { data: any };
        const email = { messageId: emailData.data.messageId, from: emailData.data.from, to: emailData.data.toAddress.map((t: any) => ({ emailAddress: t.address, name: t.name })), subject: emailData.data.subject || '(Sem assunto)', summary: emailData.data.summary || '', receivedTime: new Date(Number(emailData.data.receivedTime)).toISOString(), isRead: emailData.data.isRead, content: emailData.data.content || 'Este e-mail não possui conteúdo para exibir.', attachments: emailData.data.attachments || [], };
        return res.status(200).json(email);
    }
    
    if (req.method === 'POST' && action === 'sendEmail') {
        const { accountId, fromAddress, toAddress, subject, content, attachments = [] } = req.body as { accountId: string; fromAddress: string; toAddress: string; subject: string; content: string; attachments: AttachmentPayload[] };
        if (!accountId || !fromAddress || !toAddress || !subject || !content) return res.status(400).json({ error: 'Campos obrigatórios ausentes para enviar o e-mail.' });

        const boundary = `----InfocoBoundary${randomBytes(16).toString('hex')}`;
        const headers = { 'Authorization': `Zoho-oauthtoken ${accessToken}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` };
        const emailDetails = { fromAddress, toAddress, subject, content, mailFormat: "html", askReceipt: "no" };
        
        let bodyParts: (string | Buffer)[] = [];
        bodyParts.push(`--${boundary}\r\n`, `Content-Disposition: form-data; name="jsonBody"\r\n\r\n`, `${JSON.stringify(emailDetails)}\r\n`);
        for (const attachment of attachments) {
            bodyParts.push(`--${boundary}\r\n`, `Content-Disposition: form-data; name="attachment"; filename="${attachment.fileName}"\r\n`, `Content-Type: ${attachment.mimeType}\r\n`, `Content-Transfer-Encoding: base64\r\n\r\n`, Buffer.from(attachment.content, 'base64'), `\r\n`);
        }
        bodyParts.push(`--${boundary}--\r\n`);
        
        const finalBody = Buffer.concat(bodyParts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
        const sendResponse = await fetch(`${zohoConfig.apiBaseUrl}/accounts/${accountId}/messages`, { method: 'POST', headers, body: finalBody });
        
        if (!sendResponse.ok) {
            await handleZohoError(sendResponse, 'Falha ao enviar o e-mail.');
        }
        return res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!' });
    }

    if (req.method === 'DELETE' && action === 'deleteEmail') {
        const { accountId, messageId } = req.body;
        if (!accountId || !messageId) return res.status(400).json({ error: 'accountId e messageId são obrigatórios para exclusão.' });

        const deleteResponse = await fetch(`${zohoConfig.apiBaseUrl}/accounts/${accountId}/messages/${messageId}`, { method: 'DELETE', headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } });
        if (!deleteResponse.ok) {
            await handleZohoError(deleteResponse, 'Falha ao excluir o e-mail.');
        }
        return res.status(204).send();
    }

    if (req.method === 'GET' && action === 'downloadAttachment') {
        const { messageId, accountId, attachmentId, fileName } = req.query;
        if (!messageId || !accountId || !attachmentId) return res.status(400).json({ error: 'messageId, accountId e attachmentId são obrigatórios.' });

        const attachmentResponse = await fetch(`${zohoConfig.apiBaseUrl}/accounts/${accountId}/messages/${messageId}/attachments/${attachmentId}`, { headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } });
        if (!attachmentResponse.ok) {
            await handleZohoError(attachmentResponse, 'Falha ao baixar anexo.');
        }

        const contentType = attachmentResponse.headers.get('Content-Type') || 'application/octet-stream';
        const contentDisposition = `attachment; filename="${encodeURIComponent(fileName || 'download')}"`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);

        if(attachmentResponse.body) {
           const reader = attachmentResponse.body.getReader();
           const readableStream = new Readable({
                async read() {
                    const { done, value } = await reader.read();
                    if (done) { this.push(null); } else { this.push(Buffer.from(value)); }
                }
           });
           readableStream.pipe(res);
        } else {
            return res.status(500).json({ error: "O corpo da resposta do anexo está vazio." });
        }
        return;
    }

    return res.status(404).json({ error: `Unknown action for Zoho: ${action}` });
}
