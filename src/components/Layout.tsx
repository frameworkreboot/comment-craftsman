
import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/50">
      <div className={cn(
        "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
        className
      )}>
        {children}
      </div>
      
      {/* Background gradient elements */}
      <div className="fixed top-[-50%] left-[-50%] right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="fixed top-[20%] right-[-30%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl -z-10" />
    </div>
  );
};

export default Layout;
