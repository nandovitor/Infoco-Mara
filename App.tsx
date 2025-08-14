

import React, { useContext, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { AuthContext } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import Spinner from './components/ui/Spinner';

const App: React.FC = () => {
  const authContext = useContext(AuthContext);
  const dataContext = useData();

  useEffect(() => {
    // Quando o usuário for autenticado (e não estiver carregando), busque os dados.
    if (authContext?.user && !authContext.loading) {
      dataContext.fetchData();
    }
  }, [authContext?.user, authContext?.loading, dataContext.fetchData]);

  // Exibe o spinner enquanto a sessão está sendo verificada OU os dados iniciais estão sendo carregados
  if (authContext?.loading || (authContext?.user && dataContext.isLoading)) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Spinner size="lg" />
        </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-gray-50 overflow-hidden">
        {authContext?.user ? <DashboardLayout /> : <LoginPage />}
      </div>
    </>
  );
};

export default App;