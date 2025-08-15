
import React, { useEffect, useContext } from 'react';
import { MailContext } from '../../contexts/MailContext';
import { useToast } from '../../contexts/ToastContext';
import { handleApiResponse } from '../../utils/utils';
import Spinner from '../ui/Spinner';
import { ZohoTokenPayload } from '../../types';

interface ZohoCallbackHandlerProps {
    onComplete: () => void;
}

const ZohoCallbackHandler: React.FC<ZohoCallbackHandlerProps> = ({ onComplete }) => {
    const mailContext = useContext(MailContext);
    const { addToast } = useToast();
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        // Limpa a URL de imediato para uma melhor experiência do usuário
        window.history.replaceState(null, '', window.location.pathname);

        if (error) {
            addToast(`Erro de autenticação do Zoho: ${error}`, 'error');
            onComplete();
            return;
        }

        if (code) {
            const exchangeCodeForTokens = async (authCode: string) => {
                try {
                    const response = await fetch('/api/router?entity=zoho&action=exchangeCode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: authCode }),
                    });
                    
                    const tokenData = await handleApiResponse<ZohoTokenPayload>(response);
                    
                    if (tokenData) {
                        mailContext?.saveTokens(tokenData);
                        addToast('Conectado ao Zoho Mail com sucesso!', 'success');
                    } else {
                        throw new Error('O servidor não retornou dados de token válidos.');
                    }

                } catch (err: any) {
                    console.error("Falha ao trocar o código do Zoho pelo token:", err);
                    addToast(`Falha ao conectar com o Zoho: ${err.message}`, 'error');
                } finally {
                    onComplete();
                }
            };

            exchangeCodeForTokens(code);
        } else {
             // Se não houver código nem erro, é provável que seja um callback antigo ou inválido.
             onComplete();
        }
    }, []); // Executar apenas uma vez na montagem

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <Spinner size="lg" />
            <p className="text-gray-600">Processando autenticação com o Zoho Mail...</p>
        </div>
    );
};

export default ZohoCallbackHandler;
