

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    Employee, Task, FinanceData, Permissions, EmployeeExpense, InternalExpense, Asset, ManagedFile,
    PaymentNote, Notification, Supplier, Transaction, PayrollRecord, LeaveRequest, MaintenanceRecord,
    UpdatePost, ExternalSystem, NewsArticle, GroundingSource, Profile
} from '../types';
import { handleApiResponse } from '../utils/utils';
import { DEFAULT_PERMISSIONS } from '../constants';

interface AppData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
    permissions: Permissions;
    employeeExpenses: EmployeeExpense[];
    internalExpenses: InternalExpense[];
    assets: Asset[];
    managedFiles: ManagedFile[];
    paymentNotes: PaymentNote[];
    notifications: Notification[];
    suppliers: Supplier[];
    transactions: Transaction[];
    payrolls: PayrollRecord[];
    leaveRequests: LeaveRequest[];
    profiles: Profile[];
    updatePosts: UpdatePost[];
    externalSystems: ExternalSystem[];
    loginScreenImageUrl: string | null;
}

const initialData: AppData = {
    employees: [], tasks: [], financeData: [], permissions: DEFAULT_PERMISSIONS, employeeExpenses: [], internalExpenses: [], assets: [],
    managedFiles: [], paymentNotes: [], notifications: [], suppliers: [], transactions: [], payrolls: [], leaveRequests: [],
    profiles: [], updatePosts: [], externalSystems: [], loginScreenImageUrl: null,
};

interface DataContextType extends AppData {
  isLoading: boolean;
  fetchData: () => Promise<void>;
  clearData: () => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<boolean>;
  updateEmployee: (employee: Employee) => Promise<boolean>;
  deleteEmployee: (employeeId: number | string) => Promise<boolean>;
  addTask: (task: Omit<Task, 'id'>) => Promise<boolean>;
  updateTask: (task: Task) => Promise<boolean>;
  deleteTask: (taskId: number | string) => Promise<boolean>;
  addMunicipality: (municipality: Omit<FinanceData, 'id'>) => Promise<boolean>;
  updateMunicipality: (municipality: FinanceData) => Promise<boolean>;
  deleteMunicipality: (municipalityId: number) => Promise<boolean>;
  addEmployeeExpense: (expense: Omit<EmployeeExpense, 'id'>) => Promise<boolean>;
  updateEmployeeExpense: (expense: EmployeeExpense) => Promise<boolean>;
  deleteEmployeeExpense: (expenseId: number) => Promise<boolean>;
  addInternalExpense: (expense: Omit<InternalExpense, 'id'>) => Promise<boolean>;
  updateInternalExpense: (expense: InternalExpense) => Promise<boolean>;
  deleteInternalExpense: (expenseId: number) => Promise<boolean>;
  addAsset: (asset: Omit<Asset, 'id' | 'maintenanceLog'>) => Promise<boolean>;
  updateAsset: (asset: Asset) => Promise<boolean>;
  deleteAsset: (assetId: number) => Promise<boolean>;
  addMaintenanceRecord: (assetId: number, record: Omit<MaintenanceRecord, 'id'>) => Promise<boolean>;
  addFile: (file: Omit<ManagedFile, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteFile: (fileId: number) => Promise<boolean>;
  addPaymentNote: (note: Omit<PaymentNote, 'id' | 'uploadDate'>) => Promise<boolean>;
  deletePaymentNote: (noteId: number) => Promise<boolean>;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => Promise<boolean>;
  markNotificationAsRead: (id: number) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  deleteNotification: (id: number) => Promise<boolean>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<boolean>;
  updateSupplier: (supplier: Supplier) => Promise<boolean>;
  deleteSupplier: (supplierId: number) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  updateTransaction: (transaction: Transaction) => Promise<boolean>;
  deleteTransaction: (transactionId: number) => Promise<boolean>;
  addPayroll: (payroll: Omit<PayrollRecord, 'id'>) => Promise<boolean>;
  deletePayroll: (payrollId: number) => Promise<boolean>;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id'>) => Promise<boolean>;
  updateLeaveRequest: (request: LeaveRequest) => Promise<boolean>;
  addUser: (user: Omit<Profile, 'id' | 'pfp'> & { password?: string }) => Promise<boolean>;
  updateUser: (user: Profile) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  addUpdatePost: (post: Omit<UpdatePost, 'id' | 'created_at' | 'author_id'>) => Promise<boolean>;
  updateUpdatePost: (post: UpdatePost) => Promise<boolean>;
  deleteUpdatePost: (postId: number) => Promise<boolean>;
  addExternalSystem: (system: Omit<ExternalSystem, 'id'>) => Promise<boolean>;
  updateExternalSystem: (system: ExternalSystem) => Promise<boolean>;
  deleteExternalSystem: (systemId: number) => Promise<boolean>;
  news: NewsArticle[];
  newsSources: GroundingSource[];
  isNewsLoading: boolean;
  newsError: string | null;
  fetchNews: () => void;
  updatePermissions: (role: string, permissionKey: keyof Permissions[string], value: boolean) => Promise<boolean>;
  updateLoginScreenImage: (imageUrl: string | null) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | null>(null);

const apiRequest = async (method: 'GET' | 'POST' | 'DELETE', entity: string, action?: string, payload?: any) => {
    const response = await fetch(`/api/router?entity=${entity}${action ? `&action=${action}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(payload && { body: JSON.stringify(payload) }),
    });
    return handleApiResponse<any>(response);
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    const [news, setNews] = useState<NewsArticle[]>([]);
    const [newsSources, setNewsSources] = useState<GroundingSource[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
    const [newsError, setNewsError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('GET', 'allData');
            // Ensure assets have maintenanceLog array
            if (data.assets) {
                data.assets = data.assets.map((a: Asset) => ({ ...a, maintenanceLog: a.maintenanceLog || [] }));
            }
            setAppData(prev => ({...prev, ...data}));
        } catch (err) {
            console.error("Falha ao buscar dados iniciais:", err);
            // In case of error (e.g., logged out), clear data
            setAppData(initialData);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const clearData = () => setAppData(initialData);

    const createCrud = <T extends {id: any}>(entity: keyof AppData) => {
        const updateState = (data: T[]) => setAppData(prev => ({ ...prev, [entity]: data }));
        return {
            add: async (item: Omit<T, 'id'>): Promise<boolean> => {
                const { data } = await apiRequest('POST', entity as string, 'add', item);
                updateState(data);
                return true;
            },
            update: async (item: T): Promise<boolean> => {
                const { data } = await apiRequest('POST', entity as string, 'update', item);
                updateState(data);
                return true;
            },
            remove: async (id: number | string): Promise<boolean> => {
                const { data } = await apiRequest('DELETE', entity as string, 'delete', { id });
                updateState(data);
                return true;
            }
        };
    };

    const crudHandlers = {
        employees: createCrud<Employee>('employees'),
        tasks: createCrud<Task>('tasks'),
        financeData: createCrud<FinanceData>('financeData'),
        employeeExpenses: createCrud<EmployeeExpense>('employeeExpenses'),
        internalExpenses: createCrud<InternalExpense>('internalExpenses'),
        assets: createCrud<Asset>('assets'),
        suppliers: createCrud<Supplier>('suppliers'),
        transactions: createCrud<Transaction>('transactions'),
        payrolls: createCrud<PayrollRecord>('payrolls'),
        leaveRequests: createCrud<LeaveRequest>('leaveRequests'),
        profiles: createCrud<Profile>('profiles'),
        updatePosts: createCrud<UpdatePost>('updatePosts'),
        externalSystems: createCrud<ExternalSystem>('externalSystems'),
        managedFiles: createCrud<ManagedFile>('managedFiles'),
        paymentNotes: createCrud<PaymentNote>('paymentNotes'),
        notifications: createCrud<Notification>('notifications'),
    };
    
    // --- Specific Handlers ---
    const addMaintenanceRecord = async (assetId: number, record: Omit<MaintenanceRecord, 'id'>) => {
        const { data } = await apiRequest('POST', 'assets', 'addMaintenanceRecord', { assetId, record });
        setAppData(prev => ({ ...prev, assets: data }));
        return true;
    };

    const fetchNews = useCallback(async () => {
        setIsNewsLoading(true); setNewsError(null);
        try {
            const data = await apiRequest('GET', 'gemini', 'news');
            setNews(data.articles || []); setNewsSources(data.sources || []);
        } catch (err: any) { setNewsError(err.message); }
        finally { setIsNewsLoading(false); }
    }, []);

    const updateConfig = async (key: string, value: any) => {
        await apiRequest('POST', 'config', 'set', { key, value });
        setAppData(prev => ({ ...prev!, [key]: value }));
        return true;
    };
    
    const markAllNotificationsAsRead = async () => {
        const updatedNotifications = appData.notifications.map(n => ({ ...n, read: true }));
        setAppData(prev => ({ ...prev, notifications: updatedNotifications }));
        // This can be a fire-and-forget, or we can make a specific API endpoint for it.
        // For simplicity, we'll update them one by one. A bulk update endpoint would be better.
        await Promise.all(updatedNotifications.map(n => crudHandlers.notifications.update(n)));
        return true;
    };

    const value: DataContextType = {
        isLoading, fetchData, clearData,
        ...appData,
        addEmployee: crudHandlers.employees.add, updateEmployee: crudHandlers.employees.update, deleteEmployee: crudHandlers.employees.remove,
        addTask: crudHandlers.tasks.add, updateTask: crudHandlers.tasks.update, deleteTask: crudHandlers.tasks.remove,
        addMunicipality: crudHandlers.financeData.add, updateMunicipality: crudHandlers.financeData.update, deleteMunicipality: crudHandlers.financeData.remove,
        addEmployeeExpense: crudHandlers.employeeExpenses.add, updateEmployeeExpense: crudHandlers.employeeExpenses.update, deleteEmployeeExpense: crudHandlers.employeeExpenses.remove,
        addInternalExpense: crudHandlers.internalExpenses.add, updateInternalExpense: crudHandlers.internalExpenses.update, deleteInternalExpense: crudHandlers.internalExpenses.remove,
        addAsset: crudHandlers.assets.add as any, updateAsset: crudHandlers.assets.update, deleteAsset: crudHandlers.assets.remove,
        addSupplier: crudHandlers.suppliers.add, updateSupplier: crudHandlers.suppliers.update, deleteSupplier: crudHandlers.suppliers.remove,
        addTransaction: crudHandlers.transactions.add, updateTransaction: crudHandlers.transactions.update, deleteTransaction: crudHandlers.transactions.remove,
        addPayroll: crudHandlers.payrolls.add, deletePayroll: crudHandlers.payrolls.remove,
        addLeaveRequest: crudHandlers.leaveRequests.add, updateLeaveRequest: crudHandlers.leaveRequests.update,
        addUser: crudHandlers.profiles.add as any, updateUser: crudHandlers.profiles.update, deleteUser: crudHandlers.profiles.remove,
        addUpdatePost: crudHandlers.updatePosts.add as any, updateUpdatePost: crudHandlers.updatePosts.update, deleteUpdatePost: crudHandlers.updatePosts.remove,
        addExternalSystem: crudHandlers.externalSystems.add, updateExternalSystem: crudHandlers.externalSystems.update, deleteExternalSystem: crudHandlers.externalSystems.remove,
        addFile: crudHandlers.managedFiles.add as (file: Omit<ManagedFile, 'id' | 'createdAt'>) => Promise<boolean>, 
        deleteFile: crudHandlers.managedFiles.remove,
        addPaymentNote: crudHandlers.paymentNotes.add as (note: Omit<PaymentNote, 'id' | 'uploadDate'>) => Promise<boolean>, 
        deletePaymentNote: crudHandlers.paymentNotes.remove,
        addNotification: crudHandlers.notifications.add,
        markNotificationAsRead: async (id) => {
            const notification = appData.notifications.find(n => n.id === id);
            if(notification) return crudHandlers.notifications.update({ ...notification, read: true });
            return false;
        },
        markAllNotificationsAsRead,
        deleteNotification: crudHandlers.notifications.remove,
        addMaintenanceRecord,
        updatePermissions: async (role, key, value) => updateConfig('permissions', {...appData.permissions, [role]: {...appData.permissions[role], [key]: value }}),
        updateLoginScreenImage: async (url) => updateConfig('loginScreenImageUrl', url),
        news, newsSources, isNewsLoading, newsError, fetchNews,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};