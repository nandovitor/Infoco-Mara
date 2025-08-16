import React, { useState, useEffect, useCallback } from 'react';
import { useMail } from '../../../../contexts/MailContext';
import { ZohoEmailListItem } from '../../../../types';
import EmailListItem from './EmailListItem';
import Spinner from '../../../ui/Spinner';
import Button from '../../../ui/Button';
import { RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface InboxProps {
    onEmailSelect: (email: ZohoEmailListItem | null) => void;
    selectedEmailId?: string;
}

const Inbox: React.FC<InboxProps> = ({ onEmailSelect, selectedEmailId }) => {
    const { listEmails } = useMail();
    const [emails, setEmails] = useState<ZohoEmailListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedEmails = await listEmails();
            setEmails(fetchedEmails);
        } catch (err: any) {
            // Exibe o erro detalhado da API do Zoho se disponível, para um melhor diagnóstico.
            setError(err.details || err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [listEmails]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    const renderErrorState = () => {
        if (!error) return null;

        // Check for the specific account configuration error
        if (error.includes("Não foi possível encontrar uma conta de e-mail habilitada")) {
            return (
                <div className="p-6 text-center text-yellow-800 bg-yellow-50 rounded-lg m-4 border border-yellow-200">
                    <HelpCircle className="mx-auto w-10 h-10 mb-3 text-yellow-500" />
                    <h3 className="font-bold text-lg mb-2">Ação Necessária: Ativar Zoho Mail</h3>
                    <p className="text-sm mb-4">
                        Conseguimos nos conectar à sua conta Zoho, mas parece que o serviço de e-mail não está ativo para o seu usuário.
                    </p>
                    <div className="text-left text-sm space-y-3 bg-white p-4 rounded-md border">
                        <p className="font-semibold">Para resolver, por favor, verifique o seguinte:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>
                                <strong>Para Administradores:</strong> Acesse o Painel de Controle do Zoho e certifique-se de que uma licença do "Zoho Mail" está atribuída a este usuário.
                            </li>
                            <li>
                                <strong>Para Usuários:</strong> Entre em contato com o administrador da sua organização e solicite a ativação do Zoho Mail para a sua conta.
                            </li>
                        </ol>
                    </div>
                     <Button onClick={fetchEmails} variant="secondary" size="sm" className="mt-6" disabled={isLoading}>
                        <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Tentar Novamente Após Ativar
                    </Button>
                </div>
            );
        }

        // Generic error
        return (
            <div className="p-4 text-center text-red-600">
                <AlertCircle className="mx-auto w-8 h-8 mb-2" />
                <p className="text-sm">{error}</p>
            </div>
        );
    };


    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-800 text-lg">Caixa de Entrada</h3>
                <Button onClick={fetchEmails} variant="secondary" size="sm" className="p-2" disabled={isLoading} aria-label="Atualizar caixa de entrada">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-full p-4">
                        <Spinner />
                    </div>
                )}
                {error && renderErrorState()}
                {!isLoading && !error && emails.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        <p>Sua caixa de entrada está vazia.</p>
                    </div>
                )}
                {!isLoading && !error && emails.length > 0 && (
                    <ul>
                        {emails.map(email => (
                            <EmailListItem
                                key={email.messageId}
                                email={email}
                                isSelected={email.messageId === selectedEmailId}
                                onSelect={() => onEmailSelect(email)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Inbox;
