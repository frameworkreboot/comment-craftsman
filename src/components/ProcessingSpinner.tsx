
import React from 'react';
import { cn } from '@/lib/utils';

interface ProcessingSpinnerProps {
  status: 'analyzing' | 'generating' | 'complete' | 'idle';
  className?: string;
}

const ProcessingSpinner: React.FC<ProcessingSpinnerProps> = ({ status, className }) => {
  const statusMessages = {
    analyzing: "Analyzing document",
    generating: "Generating responses",
    complete: "Processing complete",
    idle: "Ready to process"
  };

  const isActive = status !== 'idle' && status !== 'complete';

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative h-20 w-20">
        {isActive && (
          <div className="absolute inset-0 animate-spin-slow">
            <div className="h-full w-full rounded-full border-t-2 border-primary opacity-30"></div>
          </div>
        )}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          status === 'complete' ? "text-green-500" : "text-primary"
        )}>
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center transition-all",
            status === 'complete' ? "bg-green-500/10" : "bg-primary/10"
          )}>
            {status === 'complete' ? (
              <svg 
                className="h-8 w-8 animate-fade-in" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <div className={cn(
                "h-10 w-10 rounded-full", 
                isActive ? "animate-pulse-subtle bg-primary/30" : "bg-muted"
              )}></div>
            )}
          </div>
        </div>
      </div>
      <p className={cn(
        "mt-4 text-sm font-medium",
        status === 'complete' ? "text-green-500" : "text-primary"
      )}>
        {statusMessages[status]}
      </p>
    </div>
  );
};

export default ProcessingSpinner;
