import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/utils';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: number) => void;
}

const ICONS = {
  success: <CheckCircle className="w-6 h-6" />,
  error: <AlertTriangle className="w-6 h-6" />,
  info: <Info className="w-6 h-6" />,
};

const COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300); // Wait for animation to finish
  };

  return (
    <div
      className={cn(
        'flex items-center text-white p-4 rounded-lg shadow-2xl w-full max-w-sm transform transition-all duration-300 ease-in-out',
        COLORS[type],
        isExiting ? 'animate-toast-exit' : 'animate-toast-enter'
      )}
    >
      <div className="flex-shrink-0 mr-3">{ICONS[type]}</div>
      <div className="flex-1 font-medium">{message}</div>
      <button onClick={handleDismiss} className="ml-4 p-1 rounded-full hover:bg-black/20">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
