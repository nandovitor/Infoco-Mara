
import React from 'react';
import { Profile, UserRole } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { DEPARTMENTS, ROLE_LABELS } from '../../../constants';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { useCrudOperations } from '../../../hooks/useCrudOperations';
import { SubmitHandler } from 'react-hook-form';


const UserForm: React.FC<{
  register: any;
  errors: any;
  isSubmitting: boolean;
  isEditing: boolean;
}> = ({ register, errors, isSubmitting, isEditing }) => (
    <>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Nome Completo</label>
            <Input
                type="text"
                placeholder='Nome do Usuário'
                {...register('name', { required: 'O nome é obrigatório' })}
                disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Email (Login)</label>
            <Input
                type="email"
                placeholder='email@exemplo.com'
                 {...register('email', { required: 'O email é obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
                disabled={isSubmitting || isEditing} // Can't edit email
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Função</label>
                <Select
                    {...register('role', { required: 'A função é obrigatória' })}
                    disabled={isSubmitting}
                >
                <option value="">Selecione uma função</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                ))}
                </Select>
                 {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Departamento</label>
                <Select
                    {...register('department', { required: 'O departamento é obrigatório' })}
                    disabled={isSubmitting}
                >
                <option value="">Selecione um departamento</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </Select>
                 {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
            </div>
        </div>
        {!isEditing && (
            <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Senha</label>
                <Input
                    type="password"
                    placeholder={'Senha forte (mínimo 6 caracteres)'}
                    {...register('password', { required: 'A senha é obrigatória para novos usuários', minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres' } })}
                    disabled={isSubmitting}
                />
                 {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
        )}
  </>
);

const UsersTab: React.FC = () => {
    const { profiles, addUser, updateUser, deleteUser } = useData();

    const {
        modal,
        confirmModal,
        form,
        handleSave,
        handleDeleteRequest,
    } = useCrudOperations<Profile & { password?: string }>({
        entityName: 'Usuário',
        crud: {
            // @ts-ignore - The hook doesn't know about the `password` field, but the API does.
            add: addUser,
            update: updateUser,
            delete: deleteUser,
        },
        defaultValues: {
            name: '',
            email: '',
            role: 'support',
            department: '',
            password: '',
        },
    });

    const columns: Column<Profile>[] = [
        { key: 'name', header: 'Nome', className: 'font-medium text-gray-900' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Função', render: (user) => ROLE_LABELS[user.role] || user.role },
        { key: 'department', header: 'Departamento' },
        { key: 'actions', header: 'Ações', className: 'text-right' },
    ];

    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Gerenciar Usuários do Sistema</h2>
                <Button onClick={() => modal.open()} className="w-full md:w-auto">
                    <PlusCircle size={16} className="mr-2"/>
                    Adicionar Usuário
                </Button>
            </div>
            
            <DataTable
                columns={columns}
                data={profiles}
                onEdit={(user) => modal.open(user)}
                onDelete={handleDeleteRequest}
                emptyMessage="Nenhum usuário encontrado."
            />

            <Modal
                isOpen={modal.isOpen}
                onClose={modal.close}
                title={modal.title}
                size="lg"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <UserForm 
                        register={form.register}
                        errors={form.formState.errors}
                        isSubmitting={form.formState.isSubmitting}
                        isEditing={!!form.getValues('id')}
                    />
                    <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                        <Button type="button" variant="secondary" onClick={modal.close} disabled={form.formState.isSubmitting}>Cancelar</Button>
                        <Button type="submit" isLoading={form.formState.isSubmitting}>{form.getValues('id') ? 'Salvar Alterações' : 'Adicionar Usuário'}</Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmationModal
                {...confirmModal}
                message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e removerá permanentemente seu acesso."
            />
        </Card>
    );
};

export default UsersTab;