
import { createSession } from './lib/session.js';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import { Buffer } from 'buffer';
import { db } from './lib/db.js';
import { profiles } from './lib/schema.js';
import { eq } from 'drizzle-orm';

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

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }
        
        const userWithPassword = await db.query.profiles.findFirst({
            where: eq(profiles.email, email.toLowerCase()),
        });

        if (!userWithPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (!userWithPassword.passwordHash) {
             console.error(`Usuário ${email} não possui um hash de senha no banco de dados.`);
             return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (!verifyPassword(password, userWithPassword.passwordHash)) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        const { passwordHash, ...userToReturn } = userWithPassword;
        
        await createSession(userWithPassword.id, res);

        return res.status(200).json({ user: userToReturn });

    } catch (error: any) {
        console.error("API Login Error:", error);
        return res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
    }
}
