

import React, { useState, useMemo } from 'react';
import { Task, Employee, TaskStatus } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Badge from '../../ui/Badge';
import { formatDate, getEmployeeName } from '../../../utils/utils';
import { PlusCircle } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import TaskFilters from './TaskFilters';
import { useCrudOperations } from '../../../hooks/useCrudOperations';
import { SubmitHandler } from 'react-hook-form';

const TaskForm: React.FC<{
  register: any;
  errors: any;
  employees: Employee[];
  isSubmitting: boolean;
}> = ({ register, errors, employees, isSubmitting }) => (
  <>
    <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Funcionário</label>
        <Select {...register('employeeId', { required: 'É necessário selecionar um funcionário', valueAsNumber: true })} disabled={isSubmitting}>
            <option value="">Selecione um funcionário</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </Select>
        {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-blue-700 mb-1">Título da Tarefa</label>
      <Input type="text" {...register('title', { required: 'O título é obrigatório' })} disabled={isSubmitting}/>
      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
    </div>
     <div>
      <label className="block text-sm font-medium text-blue-700 mb-1">Descrição</label>
      <textarea 
        {...register('description', { required: 'A descrição é obrigatória' })}
        rows={3} 
        className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSubmitting}
      />
      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Data</label>
            <Input type="date" {...register('date', { required: 'A data é obrigatória' })} disabled={isSubmitting}/>
             {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Horas Trabalhadas</label>
            <Input type="number" {...register('hours', { required: 'As horas são obrigatórias', valueAsNumber: true, min: { value: 0.1, message: 'O valor deve ser positivo' }})} min="0" step="0.5" disabled={isSubmitting}/>
             {errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours.message}</p>}
        </div>
    </div>
    <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Status</label>
        <Select {...register('status', { required: 'O status é obrigatório' })} disabled={isSubmitting}>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluída">Concluída</option>
        </Select>
    </div>
  </>
);

const TasksTab: React.FC = () => {
  const { tasks, employees, addTask, updateTask, deleteTask } = useData();
  const [filters, setFilters] = useState({ employee: '', status: '', date: '' });

  const {
    modal,
    confirmModal,
    form,
    handleSave,
    handleDeleteRequest,
  } = useCrudOperations<Task>({
    entityName: 'Tarefa',
    crud: { add: addTask, update: updateTask, delete: deleteTask },
    defaultValues: {
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0], 
        hours: 0,
        status: 'Pendente'
    }
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const employeeMatch = !filters.employee || task.employeeId === Number(filters.employee);
      const statusMatch = !filters.status || task.status === filters.status;
      const dateMatch = !filters.date || task.date === filters.date;
      return employeeMatch && statusMatch && dateMatch;
    });
  }, [tasks, filters]);
  
  const columns: Column<Task>[] = [
      { key: 'employeeId', header: 'Funcionário', render: (task) => getEmployeeName(task.employeeId, employees), className: 'font-medium text-gray-900'},
      { key: 'title', header: 'Tarefa' },
      { key: 'date', header: 'Data', render: (task) => formatDate(task.date) },
      { key: 'hours', header: 'Horas', render: (task) => `${task.hours}h` },
      { key: 'status', header: 'Status', render: (task) => <Badge status={task.status} /> },
      { key: 'actions', header: 'Ações', className: 'text-right' },
  ];

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Gerenciar Tarefas</h2>
        <Button onClick={() => modal.open()} className="w-full md:w-auto"><PlusCircle size={16} className="mr-2"/>Registrar Tarefa</Button>
      </div>

      <TaskFilters filters={filters} setFilters={setFilters} employees={employees} />

      <DataTable 
        columns={columns}
        data={filteredTasks}
        onEdit={(task) => modal.open(task)}
        onDelete={handleDeleteRequest}
        emptyMessage="Nenhuma tarefa encontrada para os filtros selecionados."
      />

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.title} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
            <TaskForm 
                register={form.register}
                errors={form.formState.errors}
                employees={employees}
                isSubmitting={form.formState.isSubmitting}
            />
            <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                <Button type="button" variant="secondary" onClick={modal.close} disabled={form.formState.isSubmitting}>Cancelar</Button>
                <Button type="submit" isLoading={form.formState.isSubmitting}>Salvar Tarefa</Button>
            </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        {...confirmModal}
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
      />
    </Card>
  );
};

export default TasksTab;