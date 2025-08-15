
import React, { useState, useEffect } from 'react';
import { useMail } from '../../../../contexts/MailContext';
import { ZohoEmailListItem, ZohoEmail } from '../../../../types';
import Spinner from '../../../ui/Spinner';
import { formatDate } from '../../../../utils/utils';
import { MailOpen, AlertCircle, Paperclip, Download, CornerUpLeft, CornerUpRight, Trash2 } from 'lucide-react';
import Button from '../../../ui/Button';
import DeleteConfirmationModal from '../../../ui/DeleteConfirmationModal';

interface EmailDetailProps {
    emailListItem: ZohoEmailListItem | null;
    onReply: (mode: 'reply' | 'replyAll' | 'forward', email: ZohoEmail) => void;
    onDelete: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const EmailDetail: React.FC<EmailDetailProps> = ({ emailListItem, onReply, onDelete }) => {
    const { getEmailDetails, accountInfo, deleteEmail } = useMail();
    const [detailedEmail, setDetailedEmail] = useState<ZohoEmail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (emailListItem) {
            setIsLoading(true);
            setError(null);
            setDetailedEmail(null);
            getEmailDetails(emailListItem.messageId)
                .then(details => {
                    setDetailedEmail(details);
                })
                .catch(err => {
                    setError(err.message || 'Falha ao buscar detalhes do e-mail.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [emailListItem, getEmailDetails]);

    const getDownloadUrl = (attachmentId: string, fileName: string) => {
        if (!accountInfo || !emailListItem) return '#';
        return `/api/router?entity=zoho&action=downloadAttachment&messageId=${emailListItem.messageId}&accountId=${accountInfo.accountId}&attachmentId=${attachmentId}&fileName=${encodeURIComponent(fileName)}`;
    };

    const handleDelete = async () => {
        if (!emailListItem) return;
        setIsDeleting(true);
        setError(null);
        try {
            await deleteEmail(emailListItem.messageId);
            onDelete(); // Notify parent to refresh list and clear selection
        } catch (err: any) {
            setError(err.message || 'Falha ao excluir o e-mail.');
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    if (!emailListItem) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                <MailOpen size={48} className="mb-4" />
                <h3 className="text-lg font-semibold">Selecione um e-mail para ler</h3>
                <p className="text-sm">Os detalhes do e-mail selecionado serão exibidos aqui.</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col">
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" />
                </div>
            )}
            {error && (
                <div className="p-4 text-center text-red-600">
                    <AlertCircle className="mx-auto w-8 h-8 mb-2" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {detailedEmail && !isLoading && (
                 <div className="flex flex-col h-full overflow-hidden">
                    <div className="border-b pb-4">
                        <div className="flex justify-between items-start mb-4">
                             <h2 className="text-xl font-bold text-gray-800 break-words">{detailedEmail.subject}</h2>
                             <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <Button size="sm" variant="secondary" onClick={() => onReply('reply', detailedEmail)}><CornerUpLeft size={16}/> Responder</Button>
                                <Button size="sm" variant="secondary" onClick={() => onReply('forward', detailedEmail)}><CornerUpRight size={16}/> Encaminhar</Button>
                                <Button size="sm" variant="danger" onClick={() => setIsConfirmOpen(true)} isLoading={isDeleting}><Trash2 size={16}/> Excluir</Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-sm">
                             <div className="flex items-center gap-2">
                                <span className="font-semibold">{detailedEmail.from.name || detailedEmail.from.emailAddress}</span>
                                <span className="text-gray-500">&lt;{detailedEmail.from.emailAddress}&gt;</span>
                            </div>
                            <span className="text-gray-500">{formatDate(detailedEmail.receivedTime)}</span>
                        </div>
                         <div className="text-xs text-gray-500 mt-1">
                            Para: {detailedEmail.to.map(t => t.name || t.emailAddress).join(', ')}
                        </div>
                    </div>

                    {detailedEmail.attachments && detailedEmail.attachments.length > 0 && (
                        <div className="py-4 border-b">
                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Paperclip size={16} />
                                {detailedEmail.attachments.length} Anexo(s)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {detailedEmail.attachments.map(att => (
                                    <a 
                                        key={att.attachmentId} 
                                        href={getDownloadUrl(att.attachmentId, att.fileName)} 
                                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors p-2 rounded-md text-sm"
                                        download={att.fileName}
                                    >
                                        <Download size={14} />
                                        <span>{att.fileName} ({formatBytes(att.size)})</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 mt-4 overflow-y-auto pr-2">
                        <div dangerouslySetInnerHTML={{ __html: detailedEmail.content }} className="prose max-w-none"/>
                    </div>
                </div>
            )}
             <DeleteConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este e-mail? Esta ação pode ser irreversível."
                isLoading={isDeleting}
            />
        </div>
    );
};

export default EmailDetail;
