/**
 * Componente de overlay de carregamento
 * Fornece feedback visual durante operações que bloqueiam a interface
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'blur' | 'dark';
}

export function LoadingOverlay({
  isVisible,
  message = 'Carregando...',
  className,
  size = 'md',
  variant = 'default',
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const variantClasses = {
    default: 'bg-background/80 backdrop-blur-sm',
    blur: 'bg-background/60 backdrop-blur-md',
    dark: 'bg-black/50 backdrop-blur-sm',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-card/90 shadow-lg border">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {message && (
          <p className="text-sm text-muted-foreground font-medium text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Hook para controlar o loading overlay
 */
export function useLoadingOverlay() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [message, setMessage] = React.useState<string>('Carregando...');

  const show = (loadingMessage?: string) => {
    if (loadingMessage) setMessage(loadingMessage);
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const toggle = (loadingMessage?: string) => {
    if (isVisible) {
      hide();
    } else {
      show(loadingMessage);
    }
  };

  return {
    isVisible,
    message,
    show,
    hide,
    toggle,
  };
}