import React from 'react';
import Toast from './Toast';
import { Toast as ToastType } from '../../contexts/ToastContext';

interface ToastContainerProps {
  toasts: ToastType[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <>
      <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={removeToast}
          />
        ))}
      </div>
      <style>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        .animate-toast-enter {
          animation: toast-enter 0.3s ease-out forwards;
        }
        .animate-toast-exit {
          animation: toast-exit 0.3s ease-in forwards;
        }
      `}</style>
    </>
  );
};

export default ToastContainer;
