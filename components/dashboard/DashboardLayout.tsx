import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { Bot, X } from 'lucide-react';
import { PermissionSet } from '../../types';
import { cn } from '../../utils/utils';
import ZohoCallbackHandler from '../auth/ZohoCallbackHandler';
import useLocalStorage from '../../hooks/useLocalStorage';
import Button from '../ui/Button';

// --- WelcomeTour Component (Co-located to fix resolution error) ---

interface TourStep {
  selector: string;
  content: string;
  title: string;
}

interface WelcomeTourProps {
  steps: TourStep[];
  stepIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  startMessage?: { title: string; content: string; };
  endMessage?: { title: string; content: string; };
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ steps, stepIndex, isOpen, onClose, onNext, onPrev, startMessage, endMessage }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isStartStep = stepIndex === -1 && startMessage;
  const isEndStep = stepIndex === steps.length && endMessage;
  const isTourStep = stepIndex >= 0 && stepIndex < steps.length;

  useEffect(() => {
    if (!isOpen || !isTourStep) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(steps[stepIndex].selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        // Wait for scroll to finish before getting rect
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 300);
      } else {
        console.warn(`Tour target not found: ${steps[stepIndex].selector}`);
        onNext(); // Skip to the next step if element not found
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [stepIndex, isOpen, steps, onNext, isTourStep]);

  if (!isOpen) {
    return null;
  }

  const tooltipStyle: React.CSSProperties = {};
  if (targetRect && tooltipRef.current) {
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    
    if (spaceBelow > tooltipHeight + 20) {
      // Position below
      tooltipStyle.top = `${targetRect.bottom + 10}px`;
    } else {
      // Position above
      tooltipStyle.top = `${targetRect.top - tooltipHeight - 10}px`;
    }
    
    // Center horizontally
    tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
    tooltipStyle.transform = 'translateX(-50%)';
    
    // Adjust if off-screen horizontally
    if (targetRect.left + targetRect.width / 2 < 160) {
        tooltipStyle.left = '10px';
        tooltipStyle.transform = 'translateX(0)';
    } else if (targetRect.left + targetRect.width / 2 > window.innerWidth - 160) {
        const tooltipWidth = 320; // Corresponds to w-80
        tooltipStyle.left = 'auto';
        tooltipStyle.right = '10px';
        tooltipStyle.transform = 'translateX(0)';
    }
  }
  
  const renderModalContent = (title: string, content: string, onPrimaryClick: () => void, primaryText: string, onSecondaryClick?: () => void, secondaryText?: string) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center animate-fade-in p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-6">{content}</p>
            <div className="flex justify-center gap-4">
                {onSecondaryClick && secondaryText && (
                    <Button variant="secondary" onClick={onSecondaryClick}>{secondaryText}</Button>
                )}
                <Button onClick={onPrimaryClick}>{primaryText}</Button>
            </div>
        </div>
    </div>
  );

  if (isStartStep) {
      return renderModalContent(startMessage.title, startMessage.content, onNext, 'Iniciar Tour', onClose, 'Pular');
  }
  
  if (isEndStep) {
      return renderModalContent(endMessage.title, endMessage.content, onClose, 'Concluir');
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay and Spotlight */}
      <div
        className="fixed inset-0 transition-all duration-300 pointer-events-none"
        style={{
          boxShadow: targetRect
            ? `0 0 0 9999px rgba(0, 0, 0, 0.6)`
            : 'none',
          clipPath: targetRect
            ? `inset(${targetRect.top - 5}px ${window.innerWidth - targetRect.right - 5}px ${window.innerHeight - targetRect.bottom - 5}px ${targetRect.left - 5}px round 8px)`
            : 'inset(0)',
        }}
        onClick={onClose} // Allow closing by clicking overlay
      />
      {/* Tooltip */}
      {targetRect && isTourStep && (
         <div
            ref={tooltipRef}
            style={tooltipStyle}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking tooltip
            className="fixed bg-white rounded-lg shadow-2xl p-4 w-80 z-[10000] animate-fade-in-up"
        >
            <div className="flex justify-between items-start">
                 <h4 className="font-bold text-blue-700 mb-2">{steps[stepIndex].title}</h4>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <p className="text-sm text-gray-700 mb-4">{steps[stepIndex].content}</p>
            <div className="flex justify-between items-center">
                 <span className="text-xs text-gray-500">{stepIndex + 1} de {steps.length}</span>
                <div className="flex gap-2">
                    {stepIndex > 0 && <Button variant="secondary" size="sm" onClick={onPrev}>Voltar</Button>}
                    <Button size="sm" onClick={onNext}>
                        {stepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                    </Button>
                </div>
            </div>
        </div>
      )}
       <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          @keyframes fade-in-up { 
              from { 
                  opacity: 0; 
                  transform: translateY(10px) translateX(-50%); 
              } 
              to { 
                  opacity: 1; 
                  transform: translateY(0) translateX(-50%); 
              } 
          }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};


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
