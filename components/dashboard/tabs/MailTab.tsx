
import React, { useState } from 'react';
import { useMail } from '../../../contexts/MailContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Inbox from './mail/Inbox';
import EmailDetail from './mail/EmailDetail';
import ComposeMailModal from './mail/ComposeMailModal';
import { ZohoEmailListItem, ZohoEmail } from '../../../types';
import { LogIn, Mail, Edit, Inbox as InboxIcon } from 'lucide-react';
import Alert from '../../ui/Alert';

type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';
interface ComposeState {
    isOpen: boolean;
    mode: ComposeMode;
    initialData?: ZohoEmail;
}

const MailTab: React.FC = () => {
    const { isAuthenticated, isConnecting, connect, error: authError, disconnect, accountInfo } = useMail();
    const [selectedEmail, setSelectedEmail] = useState<ZohoEmailListItem | null>(null);
    const [composeState, setComposeState] = useState<ComposeState>({ isOpen: false, mode: 'new' });
    const [refreshKey, setRefreshKey] = useState(0); // Used to trigger inbox refresh

    const handleCompose = (mode: ComposeMode, email?: ZohoEmail) => {
        setComposeState({ isOpen: true, mode, initialData: email });
    };
    
    const handleEmailDeleted = () => {
        setSelectedEmail(null);
        setRefreshKey(prev => prev + 1); // Increment key to force Inbox re-render and fetch
    }

    if (!isAuthenticated) {
        return (
            <Card className="flex flex-col items-center justify-center text-center p-10">
                <Mail size={48} className="text-blue-500 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800">Conectar ao Zoho Mail</h2>
                <p className="text-gray-600 mt-2 mb-6 max-w-md">Para gerenciar, ler e enviar e-mails, você precisa conectar sua conta do Zoho Mail ao sistema.</p>
                {authError && <div className="mb-4 w-full max-w-sm"><Alert type="danger" message={authError} /></div>}
                <Button onClick={connect} isLoading={isConnecting} size="lg">
                    <LogIn size={18} className="mr-2" />
                    Conectar com Zoho Mail
                </Button>
            </Card>
        );
    }
    
    return (
        <div className="h-[calc(100vh-160px)] flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm shrink-0">
                 <div>
                    <p className="font-semibold text-gray-800">Zoho Mail</p>
                    <p className="text-sm text-gray-500">{accountInfo?.primaryEmailAddress}</p>
                 </div>
                 <Button onClick={disconnect} variant="danger" size="sm">Desconectar</Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
                {/* Left Pane: Navigation */}
                <div className="hidden md:flex md:col-span-2 bg-white rounded-lg shadow-sm p-3 flex-col">
                    <Button onClick={() => handleCompose('new')} className="w-full mb-4">
                        <Edit size={16} className="mr-2"/> Escrever E-mail
                    </Button>
                    <nav>
                        <ul>
                           <li>
                               <a href="#" className="flex items-center gap-3 p-2 rounded-md bg-blue-100 text-blue-700 font-semibold">
                                   <InboxIcon size={18} />
                                   Caixa de Entrada
                               </a>
                           </li>
                           {/* Outras pastas podem ser adicionadas aqui */}
                        </ul>
                    </nav>
                </div>
                
                {/* Center Pane: Email List */}
                <div className="col-span-12 md:col-span-4 bg-white rounded-lg shadow-sm flex flex-col overflow-y-auto">
                    <Inbox 
                        key={refreshKey}
                        onEmailSelect={setSelectedEmail} 
                        selectedEmailId={selectedEmail?.messageId}
                    />
                </div>
                
                {/* Right Pane: Email Detail */}
                <div className="col-span-12 md:col-span-6 bg-white rounded-lg shadow-sm overflow-y-auto">
                    <EmailDetail 
                        emailListItem={selectedEmail} 
                        onReply={handleCompose}
                        onDelete={handleEmailDeleted}
                    />
                </div>
            </div>
            
            <ComposeMailModal 
                isOpen={composeState.isOpen} 
                onClose={() => setComposeState({ isOpen: false, mode: 'new' })} 
                mode={composeState.mode}
                initialEmail={composeState.initialData}
            />
        </div>
    );
};

export default MailTab;
