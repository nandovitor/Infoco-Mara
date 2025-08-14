

import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { DOCUMENT_FOLDERS } from '../../../constants';
import { ManagedFile } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import DataTable, { Column } from '../../ui/DataTable';
import { UploadCloud, Folder, FileText, Download, Eye, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import PdfViewerModal from '../../ui/PdfViewerModal';
import { cn } from '../../../utils/utils';
import Alert from '../../ui/Alert';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DatabaseTab: React.FC = () => {
    const { financeData, managedFiles, addFile, deleteFile: deleteDataContextFile } = useData();
    const [selectedMunicipality, setSelectedMunicipality] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [fileToDelete, setFileToDelete] = useState<ManagedFile | null>(null);
    const [pdfToView, setPdfToView] = useState<ManagedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const municipalities = financeData.map(f => f.municipality).sort();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setIsUploading(true);
        const file = e.target.files?.[0];
        if (!file) {
            setIsUploading(false);
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`O arquivo é muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`);
            setIsUploading(false);
            return;
        }

        try {
            const filePath = `documents/${selectedMunicipality}/${selectedFolder}/${Date.now()}-${file.name}`;
            const response = await fetch(`/api/upload-blob?filename=${encodeURIComponent(filePath)}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Falha no upload do arquivo.');
            }
            const blob = await response.json();

            const newFile: Omit<ManagedFile, 'id' | 'createdAt'> = {
                name: file.name,
                type: file.type,
                size: file.size,
                url: blob.url,
                municipalityName: selectedMunicipality,
                folder: selectedFolder,
            };
            await addFile(newFile);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
            if(e.target) e.target.value = '';
        }
    };
    
    const handleConfirmDelete = async () => {
        if (fileToDelete) {
            // Delete from Vercel Blob storage
            try {
                await fetch(`/api/upload-blob?url=${encodeURIComponent(fileToDelete.url)}`, {
                    method: 'DELETE',
                });
            } catch (err) {
                 console.error("Failed to delete from blob storage, but proceeding with DB deletion:", err);
            }
            
            // Delete from database via context
            await deleteDataContextFile(fileToDelete.id);
            setFileToDelete(null);
        }
    };

    const files = useMemo(() => {
        if (!selectedMunicipality || !selectedFolder) return [];
        return managedFiles.filter(f => f.municipalityName === selectedMunicipality && f.folder === selectedFolder);
    }, [managedFiles, selectedMunicipality, selectedFolder]);
    
    const fileCounts = useMemo(() => {
        const counts: Record<string, Record<string, number>> = {};
        managedFiles.forEach(file => {
            if (!counts[file.municipalityName]) counts[file.municipalityName] = {};
            if (!counts[file.municipalityName][file.folder]) counts[file.municipalityName][file.folder] = 0;
            counts[file.municipalityName][file.folder]++;
        });
        return counts;
    }, [managedFiles]);

    const columns: Column<ManagedFile>[] = [
        { key: 'name', header: 'Nome', render: (file) => <div className="flex items-center gap-2 font-medium text-gray-900"><FileText size={16} /><span>{file.name}</span></div> },
        { key: 'type', header: 'Tipo' },
        { key: 'size', header: 'Tamanho', render: (file) => `${(file.size / 1024 / 1024).toFixed(2)} MB` },
        {
            key: 'actions', header: 'Ações', className: 'text-right', render: (file) => (
                <div className="flex items-center justify-end gap-2">
                    {file.type === 'application/pdf' && (
                        <Button variant="secondary" size="sm" onClick={() => setPdfToView(file)} className="p-2 h-auto" aria-label="Visualizar">
                            <Eye size={16} />
                        </Button>
                    )}
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                        <Button variant="secondary" size="sm" className="p-2 h-auto" aria-label="Baixar">
                            <Download size={16} />
                        </Button>
                    </a>
                    <Button variant="danger" size="sm" onClick={() => setFileToDelete(file)} className="p-2 h-auto" aria-label="Excluir">
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Base de Dados por Município</h2>
                <p className="text-sm text-gray-500 mb-4">Selecione um município para gerenciar seus arquivos e documentos.</p>
                <Select value={selectedMunicipality} onChange={e => { setSelectedMunicipality(e.target.value); setSelectedFolder(''); }}>
                    <option value="">Selecione um município...</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
            </Card>

            {selectedMunicipality && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Pastas de: {selectedMunicipality}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {DOCUMENT_FOLDERS.map(folder => {
                            const fileCount = fileCounts[selectedMunicipality]?.[folder] || 0;
                            return (
                                <button key={folder} onClick={() => setSelectedFolder(folder)} className={cn(
                                    "p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center justify-between",
                                    selectedFolder === folder ? 'bg-blue-100 border-blue-500 shadow-md' : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                )}>
                                    <div>
                                        <Folder className={cn("w-8 h-8 mb-2", selectedFolder === folder ? "text-blue-600" : "text-gray-500")} />
                                        <p className="font-semibold text-gray-800">{folder}</p>
                                        <p className="text-xs text-gray-500">{fileCount} arquivo(s)</p>
                                    </div>
                                    <ChevronRight size={20} className={cn("text-gray-400 transition-transform", selectedFolder === folder && "transform translate-x-1 text-blue-600")} />
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {selectedMunicipality && selectedFolder && (
                 <Card>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700">Arquivos em: <span className="font-bold text-blue-600">{selectedFolder}</span></h3>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <UploadCloud size={16} className="mr-2"/>}
                            {isUploading ? 'Enviando...' : 'Carregar Arquivo'}
                        </Button>
                    </div>
                    {error && <Alert type="danger" message={error} className="mb-4" />}
                    <DataTable
                        columns={columns}
                        data={files}
                        emptyMessage="Nenhum arquivo encontrado nesta pasta."
                    />
                </Card>
            )}
            
            <DeleteConfirmationModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
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

export default DatabaseTab;