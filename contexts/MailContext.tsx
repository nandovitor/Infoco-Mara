

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ZohoTokenData, ZohoAccountInfo, ZohoEmailListItem, ZohoEmail, AttachmentPayload, ZohoTokenPayload } from '../types';
import { handleApiResponse } from '../utils/utils';

interface MailContextType {
    tokens: ZohoTokenData | null;
    accountInfo: ZohoAccountInfo | null;
    isAuthenticated: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    saveTokens: (tokenPayload: ZohoTokenPayload) => void;
    listEmails: () => Promise<ZohoEmailListItem[]>;
    getEmailDetails: (messageId: string) => Promise<ZohoEmail | null>;
    sendEmail: (to: string, subject: string, content: string, attachments?: File[]) => Promise<void>;
    deleteEmail: (messageId: string) => Promise<void>;
    getValidAccessToken: () => Promise<string | null>;
}

export const MailContext = createContext<MailContextType | null>(null);

const apiRequest = async (entity: 'zoho', action: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', options: RequestInit = {}) => {
    const { headers: optionHeaders, ...restOfOptions } = options;
    const response = await fetch(`/api/router?entity=${entity}&action=${action}`, {
        method,
        ...restOfOptions,
        headers: {
            'Content-Type': 'application/json',
            ...optionHeaders,
        },
    });
    return handleApiResponse(response);
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove o prefixo 'data:*/*;base64,' para obter apenas os dados base64
            resolve(result.substring(result.indexOf(',') + 1));
        };
        reader.onerror = error => reject(error);
    });


export const MailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tokens, setTokens] = useLocalStorage<ZohoTokenData | null>('infoco_zoho_tokens', null);
    const [accountInfo, setAccountInfo] = useLocalStorage<ZohoAccountInfo | null>('infoco_zoho_account', null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = !!(tokens && tokens.access_token);
    
    const disconnect = useCallback(() => {
        setTokens(null);
        setAccountInfo(null);
        setError(null);
    }, [setTokens, setAccountInfo]);

    const getValidAccessToken = useCallback(async (): Promise<string | null> => {
        if (!tokens) {
            disconnect();
            return null;
        }

        if (Date.now() >= tokens.expires_at) {
            console.log("Token do Zoho expirado, renovando...");
            try {
                const data = await apiRequest('zoho', 'refreshToken', 'POST', {
                    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
                }) as { access_token: string; expires_in: number };

                const newExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
                const newTokens = { ...tokens, access_token: data.access_token, expires_at: newExpiresAt };
                setTokens(newTokens);
                return newTokens.access_token;

            } catch (err: any) {
                console.error("Erro ao renovar token, desconectando:", err);
                setError(`Sua sessão com o Zoho expirou. Por favor, conecte-se novamente. (Erro: ${err.message})`);
                disconnect();
                return null;
            }
        }
        return tokens.access_token;

    }, [tokens, setTokens, disconnect]);

    const connect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const data = await apiRequest('zoho', 'getAuthUrl') as { authUrl: string };
            if (data && data.authUrl && typeof data.authUrl === 'string' && data.authUrl.startsWith('https://')) {
                window.location.href = data.authUrl;
            } else {
                console.error("Resposta inválida do servidor para getAuthUrl:", data);
                throw new Error("O servidor retornou uma URL de autenticação inválida. Verifique a configuração do Zoho no servidor.");
            }
        } catch (err: any) {
            const errorMessage = err.details ? `${err.message}. Detalhes: ${err.details}` : err.message;
            setError(errorMessage);
            setIsConnecting(false);
        }
    };

    const saveTokens = (tokenPayload: ZohoTokenPayload) => {
        const { access_token, refresh_token, expires_in } = tokenPayload;

        if (access_token && expires_in) {
            const expiresAt = Date.now() + (expires_in - 300) * 1000;

            // Lógica Corrigida:
            // Um refresh_token é geralmente fornecido apenas na primeira autorização.
            // Ele deve ser preservado. Só o atualizamos se um novo for explicitamente fornecido.
            const final_refresh_token = refresh_token || tokens?.refresh_token;

            if (!final_refresh_token) {
                // Isso é uma falha crítica no fluxo de autenticação.
                setError('Falha crítica: O Zoho não forneceu um "refresh_token". A conexão não poderá ser mantida. Por favor, desconecte, revogue o acesso do aplicativo na sua conta Zoho e tente conectar novamente.');
                // Não salva tokens sem um refresh_token, pois eles falharão mais tarde.
                disconnect();
                return;
            }

            setTokens({
                access_token: access_token,
                refresh_token: final_refresh_token,
                expires_at: expiresAt,
            });
            setError(null);
        } else {
            setError('Falha ao processar os tokens recebidos do servidor.');
        }
    };

    const listEmails = async (): Promise<ZohoEmailListItem[]> => {
        const accessToken = await getValidAccessToken();
        if (!accessToken) throw new Error("Não autenticado.");
        
        const data = await apiRequest('zoho', 'listEmails', 'GET', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }) as { emails: ZohoEmailListItem[], accountId: string, primaryEmailAddress: string };
        
        if (!accountInfo && data.accountId) {
            setAccountInfo({ accountId: data.accountId, primaryEmailAddress: data.primaryEmailAddress || '' })
        }
        
        return data.emails;
    };

    const getEmailDetails = async (messageId: string): Promise<ZohoEmail | null> => {
        const accessToken = await getValidAccessToken();
        if (!accessToken || !accountInfo) throw new Error("Não autenticado ou conta não encontrada.");

        const response = await fetch(`/api/router?entity=zoho&action=getEmail&messageId=${messageId}&accountId=${accountInfo.accountId}`, {
             headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await handleApiResponse<ZohoEmail>(response);
        return data;
    };
    
    const sendEmail = async (to: string, subject: string, content: string, attachments: File[] = []): Promise<void> => {
        const accessToken = await getValidAccessToken();
        if (!accessToken || !accountInfo) throw new Error("Não autenticado ou conta não encontrada.");
        
        const attachmentPayloads: AttachmentPayload[] = await Promise.all(
            attachments.map(async (file) => ({
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                content: await fileToBase64(file),
            }))
        );

        await apiRequest('zoho', 'sendEmail', 'POST', {
             headers: { 'Authorization': `Bearer ${accessToken}` },
             body: JSON.stringify({
                accountId: accountInfo.accountId,
                fromAddress: accountInfo.primaryEmailAddress,
                toAddress: to,
                subject,
                content,
                attachments: attachmentPayloads
            })
        });
    };
    
    const deleteEmail = async (messageId: string): Promise<void> => {
        const accessToken = await getValidAccessToken();
        if (!accessToken || !accountInfo) throw new Error("Não autenticado ou conta não encontrada.");

        await apiRequest('zoho', 'deleteEmail', 'DELETE', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({
                accountId: accountInfo.accountId,
                messageId: messageId,
            })
        });
    };

    return (
        <MailContext.Provider value={{ tokens, accountInfo, isAuthenticated, isConnecting, error, connect, disconnect, saveTokens, listEmails, getEmailDetails, sendEmail, deleteEmail, getValidAccessToken }}>
            {children}
        </MailContext.Provider>
    );
};

export const useMail = (): MailContextType => {
    const context = useContext(MailContext);
    if (!context) {
        throw new Error('useMail deve ser usado dentro de um MailProvider');
    }
    return context;
};
