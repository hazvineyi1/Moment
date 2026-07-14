import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  isLoading?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function SharePageShell({ isLoading, icon, title, subtitle, children }: Props) {
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col container mx-auto px-6 py-12 max-w-lg">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            {icon}
          </div>
          <h1 className="text-3xl font-serif font-medium mb-2">{title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
