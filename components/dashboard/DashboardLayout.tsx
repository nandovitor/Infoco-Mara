

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import Sidebar from './Sidebar';
import Header from './Header';
import DashboardTab from './tabs/DashboardTab';
import EmployeesTab from './tabs/EmployeesTab';
import TasksTab from './tabs/TasksTab';
import FinanceTab from './tabs/FinanceTab';
import ReportsTab from './tabs/ReportsTab';
import MunicipalitiesTab from './tabs/MunicipalitiesTab';
import SettingsTab from './tabs/SettingsTab';
import HumanResourcesTab from './tabs/HumanResourcesTab';
import InternalExpensesTab from './tabs/InternalExpensesTab';
import AssetsTab from './tabs/AssetsTab';
import DatabaseTab from './tabs/DatabaseTab';
import QuotesTab from './tabs/QuotesTab';
import NotesTab from './tabs/NotesTab';
import UsersTab from './tabs/UsersTab';
import UpdatesFeedTab from './tabs/UpdatesFeedTab';
import MailTab from './tabs/MailTab';
import AiAssistant from '../ai/AiAssistant';
import { Bot } from 'lucide-react';
import { PermissionSet } from '../../types';
import { cn } from '../../utils/utils';
import ZohoCallbackHandler from '../auth/ZohoCallbackHandler';
import WelcomeTour from '../ui/WelcomeTour';
import useLocalStorage from '../../hooks/useLocalStorage';


const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const authContext = useContext(AuthContext);
  const { permissions } = useData();
  const user = authContext?.user;
  const userPermissions = user ? permissions[user.role] : null;

  const [tourCompleted, setTourCompleted] = useLocalStorage('infoco-tour-completed', false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(-1); // -1 for start, length for end

  const startTour = () => {
    setIsTourOpen(true);
    setTourStepIndex(-1);
  };

  useEffect(() => {
    // Automatically start the tour for first-time users after a short delay
    const timer = setTimeout(() => {
        if (!tourCompleted && !isTourOpen) {
            startTour();
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [tourCompleted, isTourOpen]);


  useEffect(() => {
    // Se a URL contiver o 'code' do Zoho, é um callback de autenticação.
    // Mudamos para a aba de callback para que o manipulador possa processá-lo.
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('code')) {
      setActiveTab('mail_callback');
    }
  }, []);

  useEffect(() => {
    if (!userPermissions) return;

    const tabPermissionMap: Record<string, keyof PermissionSet> = {
        dashboard: 'canViewDashboard',
        'updates-feed': 'canViewDashboard',
        database: 'canManageDocuments',
        quotes: 'canManageDocuments',
        employees: 'canManageEmployees',
        tasks: 'canManageTasks',
        finance: 'canManageFinance',
        notes: 'canManageNotes',
        hr: 'canManageHR',
        'internal-expenses': 'canManageInternalExpenses',
        assets: 'canManageAssets',
        municipalities: 'canManageFinance',
        reports: 'canViewReports',
        settings: 'canManageSettings',
        users: 'canManageUsers',
        mail: 'canManageEmail',
    };
    
    const currentTabPermission = tabPermissionMap[activeTab];

    if (currentTabPermission && !userPermissions[currentTabPermission]) {
        setActiveTab('dashboard');
    }
  }, [activeTab, userPermissions]);

  const renderContent = () => {
    if (!userPermissions) return <div className="p-6">Carregando permissões...</div>;

    if (activeTab === 'mail_callback') {
        return <ZohoCallbackHandler onComplete={() => setActiveTab('mail')} />;
    }

    const tabs: Record<string, { component: React.ReactNode, permission: keyof PermissionSet }> = {
        dashboard: { component: <DashboardTab setActiveTab={setActiveTab} />, permission: 'canViewDashboard' },
        'updates-feed': { component: <UpdatesFeedTab />, permission: 'canViewDashboard' },
        database: { component: <DatabaseTab />, permission: 'canManageDocuments' },
        quotes: { component: <QuotesTab />, permission: 'canManageDocuments' },
        employees: { component: <EmployeesTab />, permission: 'canManageEmployees' },
        tasks: { component: <TasksTab />, permission: 'canManageTasks' },
        finance: { component: <FinanceTab />, permission: 'canManageFinance' },
        notes: { component: <NotesTab />, permission: 'canManageNotes' },
        hr: { component: <HumanResourcesTab />, permission: 'canManageHR' },
        'internal-expenses': { component: <InternalExpensesTab />, permission: 'canManageInternalExpenses' },
        assets: { component: <AssetsTab />, permission: 'canManageAssets' },
        municipalities: { component: <MunicipalitiesTab />, permission: 'canManageFinance' },
        reports: { component: <ReportsTab />, permission: 'canViewReports' },
        settings: { component: <SettingsTab />, permission: 'canManageSettings' },
        users: { component: <UsersTab />, permission: 'canManageUsers' },
        mail: { component: <MailTab />, permission: 'canManageEmail' },
    }
    
    const currentTabInfo = tabs[activeTab];

    if(currentTabInfo && userPermissions[currentTabInfo.permission]) {
        return currentTabInfo.component;
    }
    
    // Fallback to dashboard if something goes wrong or access is denied
    return <DashboardTab setActiveTab={setActiveTab} />;
  };

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    'updates-feed': 'Notas de Atualização',
    database: 'Base de Dados de Municípios',
    quotes: 'Gerenciamento de Cotações',
    employees: 'Gerenciar Funcionários',
    tasks: 'Gerenciar Tarefas',
    finance: 'Balanço Financeiro',
    notes: 'Gestão de Notas de Pagamento',
    hr: 'Recursos Humanos',
    'internal-expenses': 'ADM Infoco - Gastos Internos',
    assets: 'Patrimônio da Empresa',
    municipalities: 'Gerenciar Municípios',
    reports: 'Relatórios e Análises',
    settings: 'Configurações Gerais',
    users: 'Gerenciamento de Usuários',
    mail: 'Caixa de Entrada - Zoho Mail',
    mail_callback: 'Autenticando com Zoho...'
  };

  const handleNextTourStep = () => {
    setTourStepIndex(prev => prev + 1);
  };
  
  const handlePrevTourStep = () => {
      setTourStepIndex(prev => prev - 1);
  };

  const handleCloseTour = () => {
      setIsTourOpen(false);
      setTourCompleted(true);
  };

  const tourSteps = [
    {
      selector: '#tour-step-1-sidebar',
      title: 'Navegação Principal',
      content: 'Este é o seu menu de navegação. Acesse todos os módulos como Funcionários, Tarefas e Financeiro por aqui.',
    },
    {
      selector: '#tour-step-2-stats',
      title: 'Visão Geral Rápida',
      content: 'Seu dashboard fornece uma visão rápida das principais métricas, como funcionários ativos e o status das tarefas.',
    },
    {
      selector: '#tour-step-3-calendar',
      title: 'Calendário de Eventos',
      content: 'Acompanhe datas importantes, como vencimentos de contratos e prazos de tarefas, diretamente aqui.',
    },
    {
      selector: '#tour-step-4-notifications',
      title: 'Central de Notificações',
      content: 'Fique atualizado com notificações do sistema e lembretes pessoais. Não perca nada importante!',
    },
    {
      selector: '#tour-step-5-profile',
      title: 'Seu Perfil',
      content: 'Clique aqui para gerenciar seu perfil, alterar sua foto ou sair do sistema com segurança.',
    },
    {
      selector: '#tour-step-6-ai-assistant',
      title: 'Assistente com IA',
      content: 'Precisa de ajuda para analisar seus dados? Clique aqui para abrir nosso Assistente de IA e obter insights instantâneos.',
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title={pageTitles[activeTab] ?? 'Dashboard'} onMenuClick={() => setIsSidebarOpen(true)} setActiveTab={setActiveTab} onStartTour={startTour} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <div className="container mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
         {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>
        )}
      </div>
      
      <button 
        id="tour-step-6-ai-assistant"
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-40"
        aria-label="Abrir Assistente de IA"
      >
        <Bot size={24} />
      </button>

      <AiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
       <WelcomeTour
          isOpen={isTourOpen}
          onClose={handleCloseTour}
          steps={tourSteps}
          stepIndex={tourStepIndex}
          onNext={handleNextTourStep}
          onPrev={handlePrevTourStep}
          startMessage={{
              title: 'Bem-vindo ao INFOCO!',
              content: 'Vamos fazer um rápido tour para apresentar as principais funcionalidades do sistema.'
          }}
          endMessage={{
              title: 'Tour Concluído!',
              content: 'Você está pronto para começar. Explore o sistema e, se precisar, pode refazer este tour a qualquer momento clicando no ícone de ajuda no topo.'
          }}
      />
    </div>
  );
};

export default DashboardLayout;
