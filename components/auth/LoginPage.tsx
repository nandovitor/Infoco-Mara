



import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/utils';
import { useData } from '../../contexts/DataContext';

// A simplified blue and white earth icon
const EarthIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={className}
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="50" fill="#3B82F6" />
    <path
      fill="#FFFFFF"
      d="M59.4,23.1c-3-1.6-6.4-2.6-9.9-2.6c-10,0-18.5,6-22.1,14.5c-1,2.4-1.6,4.9-1.8,7.6c-0.1,2.5-0.1,5.2,0.6,7.8 c1.7,6.4,5.4,12,10.6,15.9c3.1,2.3,6.7,3.9,10.5,4.5c1.1,0.2,2.3,0.3,3.4,0.3c3.5,0,6.8-0.9,9.8-2.6c5.1-3,8.9-7.8,11-13.6 c1.6-4.5,2.1-9.3,1.3-14c-1.3-8.3-6.2-15.5-13.4-19.8V23.1z M39.3,35.7c0.8-2.6,2.3-4.9,4.4-6.8c1.3-1.2,2.8-2.1,4.5-2.8 c-0.9,2.8-1.4,5.8-1.4,8.8c0,8.4,3.4,15.9,8.8,20.8c-2,0.9-4.2,1.3-6.4,1.3c-6.9,0-13-4.2-15.8-10.4 C37.2,43.2,38.1,39.3,39.3,35.7z"
    />
    <path
      fill="#FFFFFF"
      d="M72.9,50.1c-0.4-3.4-1.6-6.6-3.6-9.5c-0.8-1.2-1.7-2.3-2.7-3.4c-2.4,4.3-3.8,9.2-3.8,14.4c0,3.1,0.5,6,1.4,8.8 c4.1-1.3,7.5-4.2,9.8-8.2C74.6,51.5,73.8,50.8,72.9,50.1z"
    />
  </svg>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const authContext = useContext(AuthContext);
  const { loginScreenImageUrl } = useData();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email e senha são obrigatórios.');
      triggerShake();
      return;
    }
    try {
      await authContext?.login(email, password);
    } catch (err: any) {
      // Display the detailed error message if the server provides one
      const displayError = (err.details ? `${err.message}: ${err.details}` : err.message) || 'Falha ao autenticar.';
      setError(displayError);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
      <div className={cn("w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all duration-500", isShaking && 'animate-shake')}>
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full mb-4 shadow-lg overflow-hidden">
                 {loginScreenImageUrl ? (
                    <img src={loginScreenImageUrl} alt="Logo do Sistema" className="w-full h-full object-cover" />
                ) : (
                    <EarthIcon className="w-20 h-20 p-2" />
                )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800">INFOCO</h1>
            <p className="text-gray-500">Gestão Pública</p>
        </div>
        
        {error && <Alert type="danger" message={error} />}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-blue-700 block mb-2">Email</label>
            <Input 
                id="email" 
                type="email" 
                placeholder="seu.email@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16}/>}
                disabled={authContext?.loading}
                required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700 block mb-2">Senha</label>
            <div className="relative">
                <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={16}/>}
                    disabled={authContext?.loading}
                    required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16}/>}
                </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-sm text-blue-600 hover:underline">Esqueceu a senha?</a>
          </div>
          <Button type="submit" className="w-full" isLoading={authContext?.loading}>
            Entrar no Sistema
          </Button>
        </form>
        <p className="text-center text-xs text-gray-400 pt-4 border-t mt-6">
            &copy; {new Date().getFullYear()} Infoco Gestão Pública. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
