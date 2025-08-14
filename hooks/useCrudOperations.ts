import { useState } from 'react';
import { useForm, UseFormReturn, SubmitHandler, FieldValues, DefaultValues } from 'react-hook-form';
import { useToast } from '../contexts/ToastContext';

interface CrudFunctions<T> {
  add: (item: Omit<T, 'id'>) => Promise<boolean>;
  update: (item: T) => Promise<boolean>;
  delete: (id: number | string) => Promise<boolean>;
}

interface UseCrudOperationsProps<T> {
  entityName: string;
  crud: CrudFunctions<T>;
  defaultValues: DefaultValues<T>;
}

interface UseCrudOperationsReturn<T> {
  modal: {
    isOpen: boolean;
    open: (item?: T) => void;
    close: () => void;
    title: string;
  };
  confirmModal: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    isLoading: boolean;
  };
  form: UseFormReturn<T>;
  handleSave: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleDeleteRequest: (id: number | string) => void;
}

export const useCrudOperations = <T extends FieldValues & { id?: number | string }>({
  entityName,
  crud,
  defaultValues,
}: UseCrudOperationsProps<T>): UseCrudOperationsReturn<T> => {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const form = useForm<T>({ defaultValues });
  const { reset, handleSubmit, getValues } = form;

  const isEditing = !!getValues().id;
  
  const openModal = (item?: T) => {
    reset(item || defaultValues);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset(defaultValues as DefaultValues<T>);
  };

  const onSaveSubmit: SubmitHandler<T> = async (data) => {
    const currentlyEditing = !!data.id;
    try {
      if (currentlyEditing) {
        await crud.update(data);
      } else {
        const { id, ...addData } = data;
        await crud.add(addData as Omit<T, 'id'>);
      }
      addToast(`${entityName} ${currentlyEditing ? 'atualizado(a)' : 'adicionado(a)'} com sucesso!`, 'success');
      closeModal();
    } catch (err: any) {
      addToast(`Erro ao salvar ${entityName.toLowerCase()}: ${err.message}`, 'error');
    }
  };
  
  const handleDeleteRequest = (id: number | string) => {
    setItemToDeleteId(id);
    setIsConfirmOpen(true);
  };
  
  const closeConfirmModal = () => {
    setItemToDeleteId(null);
    setIsConfirmOpen(false);
  };
  
  const handleConfirmDelete = async () => {
      if(itemToDeleteId === null) return;
      setIsDeleting(true);
      try {
        await crud.delete(itemToDeleteId);
        addToast(`${entityName} excluído(a) com sucesso.`, 'success');
        closeConfirmModal();
      } catch (err: any) {
        addToast(`Erro ao excluir ${entityName.toLowerCase()}: ${err.message}`, 'error');
      } finally {
        setIsDeleting(false);
      }
  };

  return {
    modal: {
      isOpen: isModalOpen,
      open: openModal,
      close: closeModal,
      title: `${isEditing ? 'Editar' : 'Adicionar'} ${entityName}`
    },
    confirmModal: {
        isOpen: isConfirmOpen,
        onClose: closeConfirmModal,
        onConfirm: handleConfirmDelete,
        title: `Confirmar Exclusão de ${entityName}`,
        isLoading: isDeleting
    },
    form,
    handleSave: handleSubmit(onSaveSubmit),
    handleDeleteRequest,
  };
};