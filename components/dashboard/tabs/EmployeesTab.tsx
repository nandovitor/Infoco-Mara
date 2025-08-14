
import React from 'react';
import { Employee } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { DEPARTMENTS } from '../../../constants';
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

const EmployeeForm: React.FC<{
  register: any;
  errors: any;
  isSubmitting: boolean;
}> = ({ register, errors, isSubmitting }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-blue-700 mb-1">Nome Completo</label>
      <Input
        type="text"
        {...register('name', { required: 'O nome é obrigatório' })}
        disabled={isSubmitting}
      />
      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Cargo</label>
        <Input
          type="text"
          {...register('position', { required: 'O cargo é obrigatório' })}
          disabled={isSubmitting}
        />
        {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Departamento</label>
        <Select
          {...register('department', { required: 'O departamento é obrigatório' })}
          disabled={isSubmitting}
        >
          <option value="">Selecione</option>
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </Select>
        {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
      <Input
        type="email"
        {...register('email', { required: 'O email é obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
        disabled={isSubmitting}
      />
      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
    </div>
  </>
);


const EmployeesTab: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();

  const {
    modal,
    confirmModal,
    form,
    handleSave,
    handleDeleteRequest,
  } = useCrudOperations<Employee>({
    entityName: 'Funcionário',
    crud: {
      add: addEmployee,
      update: updateEmployee,
      delete: deleteEmployee,
    },
    defaultValues: {
      name: '',
      position: '',
      department: '',
      email: '',
    },
  });

  const columns: Column<Employee>[] = [
    { key: 'name', header: 'Nome', className: 'font-medium text-gray-900' },
    { key: 'position', header: 'Cargo' },
    { key: 'department', header: 'Departamento' },
    { key: 'email', header: 'Email' },
    { key: 'actions', header: 'Ações', className: 'text-right' },
  ];

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gerenciar Funcionários</h2>
        <Button onClick={() => modal.open()} className="w-full md:w-auto">
            <PlusCircle size={16} className="mr-2"/>
            Adicionar Funcionário
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={employees}
        onEdit={(employee) => modal.open(employee)}
        onDelete={handleDeleteRequest}
        emptyMessage="Nenhum funcionário encontrado."
      />

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.title}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <EmployeeForm 
            isSubmitting={form.formState.isSubmitting}
            register={form.register}
            errors={form.formState.errors}
          />
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
              <Button type="button" variant="secondary" onClick={modal.close} disabled={form.formState.isSubmitting}>Cancelar</Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        {...confirmModal}
        message="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
      />
    </Card>
  );
};

export default EmployeesTab;
