


import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../utils/utils';
import { LayoutDashboard, Users, ListChecks, DollarSign, BarChart2, Building, Landmark, SlidersHorizontal, Handshake, ClipboardList, Archive, Database, ChevronDown, NotebookText, UsersRound, Megaphone, Mail, AppWindow, ReceiptText } from 'lucide-react';
import { PermissionSet } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    permission: keyof PermissionSet;
    subItems?: Omit<NavItem, 'subItems'>[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' },
  { id: 'updates-feed', label: 'Notas de Atualização', icon: Megaphone, permission: 'canViewDashboard' },
  { 
    id: 'organs', 
    label: 'Órgãos', 
    icon: Building, 
    permission: 'canManageDocuments', 
    subItems: [
      { id: 'database', label: 'Base de Dados', icon: Database, permission: 'canManageDocuments' },
      { id: 'quotes', label: 'Cotações', icon: ReceiptText, permission: 'canManageDocuments' },
    ]
  },
  { id: 'employees', label: 'Funcionários', icon: Users, permission: 'canManageEmployees' },
  { id: 'tasks', label: 'Tarefas', icon: ListChecks, permission: 'canManageTasks' },
  { id: 'mail', label: 'Zoho Mail', icon: Mail, permission: 'canManageEmail' },
  { id: 'finance', label: 'Financeiro', icon: DollarSign, permission: 'canManageFinance' },
  { id: 'notes', label: 'Gestão de Notas', icon: NotebookText, permission: 'canManageNotes' },
  { id: 'hr', label: 'Recursos Humanos', icon: Handshake, permission: 'canManageHR' },
  { id: 'internal-expenses', label: 'ADM Infoco', icon: ClipboardList, permission: 'canManageInternalExpenses' },
  { id: 'assets', label: 'Patrimônio', icon: Archive, permission: 'canManageAssets' },
  { id: 'municipalities', label: 'Municípios', icon: Landmark, permission: 'canManageFinance' },
  { id: 'reports', label: 'Relatórios', icon: BarChart2, permission: 'canViewReports' },
  { id: 'users', label: 'Usuários', icon: UsersRound, permission: 'canManageUsers' },
  { id: 'settings', label: 'Configurações', icon: SlidersHorizontal, permission: 'canManageSettings' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const authContext = useContext(AuthContext);
  const { permissions } = useData();
  const userRole = authContext?.user?.role;
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const userPermissions = userRole ? permissions[userRole] : null;

  // Sync open submenu with active tab
  useEffect(() => {
    const activeParent = navItems.find(item => item.subItems?.some(sub => sub.id === activeTab));
    if (activeParent) {
      setOpenSubMenu(activeParent.id);
    }
  }, [activeTab]);


  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) { // md breakpoint
        setIsOpen(false);
    }
  };

  const toggleSubMenu = (id: string) => {
    setOpenSubMenu(openSubMenu === id ? null : id);
  }

  return (
    <aside className={cn(
        'w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col shrink-0',
        'fixed inset-y-0 left-0 z-30',
        'transform transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="h-20 flex items-center justify-center border-b border-gray-700/50">
          <div className="flex items-center gap-3">
              <AppWindow className="text-blue-400" size={28}/>
              <h1 className="text-2xl font-bold">INFOCO</h1>
          </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (!userPermissions || !userPermissions[item.permission]) {
            return null;
          }

          if (item.subItems) {
            const isSubMenuOpen = openSubMenu === item.id;
            const isSubMenuActive = item.subItems.some(sub => sub.id === activeTab);
            return (
              <div key={item.id}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); toggleSubMenu(item.id); }}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isSubMenuActive ? 'text-white bg-gray-700/50' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown size={16} className={cn('transition-transform duration-300', isSubMenuOpen && 'rotate-180')} />
                </a>
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isSubMenuOpen ? 'max-h-96' : 'max-h-0'
                )}>
                  <div className="pl-4 pt-2 pb-1 space-y-1">
                    {item.subItems.map(subItem => (
                       userPermissions[subItem.permission] && (
                        <a
                          key={subItem.id}
                          href="#"
                          onClick={(e) => { e.preventDefault(); handleNavClick(subItem.id); }}
                          className={cn(
                            'flex items-center pl-6 pr-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-l-4',
                            activeTab === subItem.id
                              ? 'bg-blue-900/50 text-white border-blue-500'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white border-transparent'
                          )}
                        >
                          <subItem.icon className="mr-3 h-5 w-5" />
                          <span>{subItem.label}</span>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              className={cn(
                'flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 border-l-4',
                activeTab === item.id
                  ? 'bg-blue-900/50 text-white border-blue-500'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700/50 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Infoco
      </div>
    </aside>
  );
};

export default Sidebar;
