import React, { useEffect, useState, useRef } from 'react';
import Button from './Button';
import { X } from 'lucide-react';
import { cn } from '../../utils/utils';

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

export default WelcomeTour;
