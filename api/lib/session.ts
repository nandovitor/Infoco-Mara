
import { db } from './db.js';
import { sessions } from './schema.js';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Buffer } from 'buffer';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'infoco_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

const secret = process.env.SESSION_SECRET;
const key = (secret && secret.length >= 64) ? Buffer.from(secret, 'hex') : null;

if (!key) {
    console.error('CRITICAL: SESSION_SECRET environment variable is not set or is too short. It must be at least 64 hex characters. Session functionality will fail.');
}

function parseCookies(cookieHeader: string | undefined): { [key: string]: string } {
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
        }
        return acc;
    }, {} as { [key: string]: string });
}

function serializeCookie(name: string, value: string, options: any): string {
    let str = `${name}=${encodeURIComponent(value)}`;
    if (options.maxAge) str += `; Max-Age=${options.maxAge}`;
    if (options.path) str += `; Path=${options.path}`;
    if (options.httpOnly) str += '; HttpOnly';
    if (options.secure) str += '; Secure';
    if (options.sameSite) str += `; SameSite=${options.sameSite}`;
    return str;
}

async function encrypt(payload: object): Promise<string> {
    if (!key) throw new Error('Session secret not configured on the server.');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function decrypt(token: string): Promise<object | null> {
    if (!key) throw new Error('Session secret not configured on the server.');
    try {
        const [ivHex, authTagHex, encryptedHex] = token.split(':');
        if (!ivHex || !authTagHex || !encryptedHex) return null;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString());
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

export async function createSession(userId: string, res: any) {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    await db.insert(sessions).values({
        id: sessionId,
        userId: userId,
        expiresAt: expiresAt,
    });

    const encryptedSessionId = await encrypt({ id: sessionId });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DURATION_SECONDS,
        path: '/',
        sameSite: 'lax',
    };
    
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, encryptedSessionId, cookieOptions));
}

export async function getSessionUser(req: any): Promise<{ id: string } | null> {
    const cookies = parseCookies(req.headers.cookie);
    const cookieValue = cookies[SESSION_COOKIE_NAME];
    
    if (!cookieValue) return null;

    const decrypted = await decrypt(cookieValue);
    if (!decrypted || typeof decrypted !== 'object' || !('id' in decrypted)) {
        return null;
    }

    const sessionId = (decrypted as { id: string }).id;
    const [sessionData] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    
    if (!sessionData || sessionData.expiresAt < new Date()) {
        if(sessionData) await db.delete(sessions).where(eq(sessions.id, sessionId));
        return null;
    }

    // Refresh the session expiration on each request
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, sessionId));

    return { id: sessionData.userId };
}

export async function deleteSession(req: any, res: any) {
    const cookies = parseCookies(req.headers.cookie);
    const cookieValue = cookies[SESSION_COOKIE_NAME];

    if (cookieValue) {
        const decrypted = await decrypt(cookieValue);
        if (decrypted && typeof decrypted === 'object' && 'id' in decrypted) {
            const sessionId = (decrypted as { id: string }).id;
            await db.delete(sessions).where(eq(sessions.id, sessionId));
        }
    }
    
    const expiredCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: -1, // Expire immediately
        path: '/',
        sameSite: 'lax',
    };
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', expiredCookieOptions));
}