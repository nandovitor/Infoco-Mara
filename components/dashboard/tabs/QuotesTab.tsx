
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { QuoteFolder, QuoteFile } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import PdfViewerModal from '../../ui/PdfViewerModal';
import Alert from '../../ui/Alert';
import { cn } from '../../../utils/utils';
import { Folder, FileText, UploadCloud, Download, Eye, Trash2, Edit, PlusCircle, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FolderFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName?: string;
}> = ({ isOpen, onClose, onSave, initialName = '' }) => {
    const [name, setName] = useState(initialName);

    useEffect(() => {
        if (isOpen) setName(initialName);
    }, [isOpen, initialName]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialName ? 'Renomear Pasta' : 'Nova Pasta'}>
            <form onSubmit={handleSave} className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pasta" required />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </div>
            </form>
        </Modal>
    );
};

const QuotesTab: React.FC = () => {
    const {
        quoteFolders, quoteFiles, addQuoteFolder, updateQuoteFolder, deleteQuoteFolder,
        addQuoteFile, deleteQuoteFile
    } = useData();
    
    const [selectedFolder, setSelectedFolder] = useState<QuoteFolder | null>(null);
    const [folderModal, setFolderModal] = useState<{ isOpen: boolean; data?: Partial<QuoteFolder> }>({ isOpen: false });
    const [folderToDelete, setFolderToDelete] = useState<QuoteFolder | null>(null);
    const [fileToDelete, setFileToDelete] = useState<QuoteFile | null>(null);
    const [pdfToView, setPdfToView] = useState<QuoteFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filesInSelectedFolder = useMemo(() => {
        if (!selectedFolder) return [];
        return quoteFiles.filter(file => file.folderId === selectedFolder.id);
    }, [quoteFiles, selectedFolder]);

    const openNewFolderModal = () => setFolderModal({ isOpen: true, data: { name: '' } });
    const openEditFolderModal = (folder: QuoteFolder) => setFolderModal({ isOpen: true, data: folder });
    const closeFolderModal = () => setFolderModal({ isOpen: false });

    const handleSaveFolder = (name: string) => {
        const { data: folderData } = folderModal;
        // Check if folderData exists and has an id for update, otherwise it's a new folder
        if (folderData?.id) {
            updateQuoteFolder({ ...folderData, name } as QuoteFolder);
        } else {
            addQuoteFolder({ name });
        }
        closeFolderModal();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedFolder) return;
        setError(null);
        setIsUploading(true);
        const file = e.target.files?.[0];
        if (!file) {
            setIsUploading(false);
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`O arquivo é muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
            setIsUploading(false);
            return;
        }

        try {
            const filePath = `quotes/${selectedFolder.name}/${Date.now()}-${file.name}`;
            const response = await fetch(`/api/upload-blob?filename=${encodeURIComponent(filePath)}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Falha no upload do arquivo.');
            }
            const blob = await response.json();

            await addQuoteFile({
                name: file.name,
                type: file.type,
                size: file.size,
                url: blob.url,
                folderId: selectedFolder.id,
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
            if(e.target) e.target.value = '';
        }
    };
    
    const handleConfirmDeleteFile = async () => {
        if (fileToDelete) {
            try {
                await fetch(`/api/upload-blob?url=${encodeURIComponent(fileToDelete.url)}`, { method: 'DELETE' });
            } catch (err) {
                 console.error("Failed to delete from blob storage, proceeding with DB deletion:", err);
            }
            await deleteQuoteFile(fileToDelete.id);
            setFileToDelete(null);
        }
    };
    
    const handleConfirmDeleteFolder = async () => {
        if (folderToDelete) {
            await deleteQuoteFolder(folderToDelete.id);
            if (selectedFolder?.id === folderToDelete.id) {
                setSelectedFolder(null);
            }
            setFolderToDelete(null);
        }
    };

    const fileColumns: Column<QuoteFile>[] = [
        { key: 'name', header: 'Nome', render: (file) => <div className="flex items-center gap-2 font-medium text-gray-900"><FileText size={16} /><span>{file.name}</span></div> },
        { key: 'size', header: 'Tamanho', render: (file) => `${(file.size / 1024 / 1024).toFixed(2)} MB` },
        { key: 'createdAt', header: 'Data de Upload', render: (file) => new Date(file.createdAt).toLocaleDateString('pt-BR') },
        {
            key: 'actions', header: 'Ações', className: 'text-right', render: (file) => (
                <div className="flex items-center justify-end gap-2">
                    {file.type === 'application/pdf' && (
                        <Button variant="secondary" size="sm" onClick={() => setPdfToView(file)} className="p-2 h-auto" aria-label="Visualizar"><Eye size={16} /></Button>
                    )}
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                        <Button variant="secondary" size="sm" className="p-2 h-auto" aria-label="Baixar"><Download size={16} /></Button>
                    </a>
                    <Button variant="danger" size="sm" onClick={() => setFileToDelete(file)} className="p-2 h-auto" aria-label="Excluir"><Trash2 size={16} /></Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Cotações</h2>
                    <Button onClick={openNewFolderModal}><PlusCircle size={16} className="mr-2" />Nova Pasta</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {quoteFolders.map(folder => (
                        <div key={folder.id} className={cn("rounded-lg border-2 p-4 flex flex-col justify-between transition-all", selectedFolder?.id === folder.id ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200')}>
                             <button onClick={() => setSelectedFolder(folder)} className="flex-1 text-left flex items-start gap-3">
                                <Folder className={cn("w-8 h-8 flex-shrink-0", selectedFolder?.id === folder.id ? "text-blue-600" : "text-gray-500")} />
                                <div>
                                     <p className="font-semibold text-gray-800 break-all">{folder.name}</p>
                                     <p className="text-xs text-gray-500">{quoteFiles.filter(f=>f.folderId === folder.id).length} arquivo(s)</p>
                                </div>
                            </button>
                            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                <Button size="sm" variant="secondary" className="p-1 h-auto" onClick={() => openEditFolderModal(folder)}><Edit size={14}/></Button>
                                <Button size="sm" variant="danger" className="p-1 h-auto" onClick={() => setFolderToDelete(folder)}><Trash2 size={14}/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {selectedFolder && (
                 <Card>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700">Arquivos em: <span className="font-bold text-blue-600">{selectedFolder.name}</span></h3>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <UploadCloud size={16} className="mr-2"/>}
                            {isUploading ? 'Enviando...' : 'Carregar Arquivo'}
                        </Button>
                    </div>
                    {error && <Alert type="danger" message={error} className="mb-4" />}
                    <DataTable columns={fileColumns} data={filesInSelectedFolder} emptyMessage="Nenhum arquivo encontrado nesta pasta."/>
                </Card>
            )}

            <FolderFormModal
                isOpen={folderModal.isOpen}
                onClose={closeFolderModal}
                onSave={handleSaveFolder}
                initialName={folderModal.data?.name}
            />

            <DeleteConfirmationModal
                isOpen={!!folderToDelete}
                onClose={() => setFolderToDelete(null)}
                onConfirm={handleConfirmDeleteFolder}
                title="Excluir Pasta"
                message={`Tem certeza que deseja excluir a pasta "${folderToDelete?.name}"? Todos os arquivos dentro dela também serão removidos.`}
            />

            <DeleteConfirmationModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={handleConfirmDeleteFile}
                title="Excluir Arquivo"
                message={`Tem certeza que deseja excluir o arquivo "${fileToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />

            {pdfToView && (
                <PdfViewerModal
                    isOpen={!!pdfToView}
                    onClose={() => setPdfToView(null)}
                    pdfUrl={pdfToView.url}
                    title={pdfToView.name}
                />
            )}
        </div>
    );
};

export default QuotesTab;
