
import React, { useState, useRef, useEffect } from 'react';
import { useMail } from '../../../../contexts/MailContext';
import { ZohoEmail } from '../../../../types';
import Modal from '../../../ui/Modal';
import Input from '../../../ui/Input';
import Button from '../../../ui/Button';
import Alert from '../../../ui/Alert';
import { Paperclip, X } from 'lucide-react';

type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

interface ComposeMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: ComposeMode;
    initialEmail?: ZohoEmail;
}

const MAX_TOTAL_SIZE_MB = 10;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ComposeMailModal: React.FC<ComposeMailModalProps> = ({ isOpen, onClose, mode = 'new', initialEmail }) => {
    const { sendEmail, accountInfo } = useMail();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const resetState = () => {
        setTo('');
        setSubject('');
        setContent('');
        setAttachments([]);
        setSuccess(null);
        setError(null);
        setIsLoading(false);
    };
    
    useEffect(() => {
        if (isOpen) {
            resetState();
            if (initialEmail) {
                switch (mode) {
                    case 'reply':
                        setTo(initialEmail.from.emailAddress);
                        setSubject(`Re: ${initialEmail.subject}`);
                        setContent(`\n\n\n--- Em ${new Date(initialEmail.receivedTime).toLocaleString('pt-BR')}, ${initialEmail.from.name || initialEmail.from.emailAddress} escreveu:\n\n> ` + initialEmail.content.replace(/<[^>]*>/g, '').replace(/\n/g, '\n> '));
                        break;
                    case 'replyAll':
                         const allRecipients = [initialEmail.from, ...initialEmail.to].map(r => r.emailAddress);
                         const uniqueRecipients = [...new Set(allRecipients)].filter(email => email !== accountInfo?.primaryEmailAddress);
                        setTo(uniqueRecipients.join(', '));
                        setSubject(`Re: ${initialEmail.subject}`);
                        setContent(`\n\n\n--- Em ${new Date(initialEmail.receivedTime).toLocaleString('pt-BR')}, ${initialEmail.from.name || initialEmail.from.emailAddress} escreveu:\n\n> ` + initialEmail.content.replace(/<[^>]*>/g, '').replace(/\n/g, '\n> '));
                        break;
                    case 'forward':
                        setSubject(`Fwd: ${initialEmail.subject}`);
                        setContent(`\n\n\n--- Mensagem encaminhada ---\nDe: ${initialEmail.from.name || initialEmail.from.emailAddress}\nData: ${new Date(initialEmail.receivedTime).toLocaleString('pt-BR')}\nAssunto: ${initialEmail.subject}\nPara: ${initialEmail.to.map(r => r.emailAddress).join(', ')}\n\n` + initialEmail.content);
                        break;
                }
            }
        }
    }, [isOpen, mode, initialEmail, accountInfo]);

    const handleClose = () => {
        if (!isLoading) {
             resetState();
             onClose();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const currentTotalSize = attachments.reduce((sum, file) => sum + file.size, 0);
            const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);

            if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE_BYTES) {
                setError(`O tamanho total dos anexos não pode exceder ${MAX_TOTAL_SIZE_MB} MB.`);
                return;
            }
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await sendEmail(to, subject, content, attachments);
            setSuccess('E-mail enviado com sucesso!');
            setTimeout(() => {
                resetState();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Falha ao enviar e-mail.');
        } finally {
            if (!success) { // Don't turn off loading if success message is showing
                setIsLoading(false);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Escrever E-mail" size="lg">
            <form onSubmit={handleSend} className="space-y-4">
                {error && <Alert type="danger" message={error} />}
                {success && <Alert type="success" message={success} />}
                
                <Input
                    type="email"
                    placeholder="Para"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <Input
                    type="text"
                    placeholder="Assunto"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="Digite sua mensagem aqui..."
                    required
                    disabled={isLoading}
                />

                {attachments.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Anexos:</h4>
                        <ul className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => (
                                <li key={index} className="flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-1 py-1 text-sm">
                                    <span>{file.name} ({formatBytes(file.size)})</span>
                                    <button type="button" onClick={() => removeAttachment(index)} className="text-gray-500 hover:text-red-600 rounded-full p-0.5" disabled={isLoading}>
                                        <X size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div className="flex justify-between items-center pt-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple disabled={isLoading}/>
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                        <Paperclip size={16} className="mr-2"/>
                        Anexar
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" isLoading={isLoading}>Enviar</Button>
                    </div>
                </div>
                 {accountInfo?.primaryEmailAddress && <p className="text-xs text-gray-500 text-right">Enviando de: {accountInfo.primaryEmailAddress}</p>}
            </form>
        </Modal>
    );
};

export default ComposeMailModal;