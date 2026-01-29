'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

type SofiaToastVariant = 'default' | 'success' | 'error' | 'warning';

type SofiaToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface SofiaToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface SofiaToastProps {
  title?: string;
  message: string;
  variant?: SofiaToastVariant;
  duration?: number;
  position?: SofiaToastPosition;
  action?: SofiaToastAction;
  secondaryAction?: SofiaToastAction;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

const sofiaToastVariantStyles: Record<SofiaToastVariant, string> = {
  default: 'bg-card border-border text-foreground',
  success: 'bg-card border-green-600/50 text-foreground',
  error: 'bg-card border-destructive/50 text-foreground',
  warning: 'bg-card border-amber-600/50 text-foreground',
};

const sofiaToastTitleColor: Record<SofiaToastVariant, string> = {
  default: 'text-foreground',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const sofiaToastIconColor: Record<SofiaToastVariant, string> = {
  default: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const sofiaToastVariantIcons: Record<SofiaToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const sofiaToastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
};

export function sofiaToast({
  title,
  message,
  variant = 'default',
  duration = 4000,
  position = 'top-right',
  action,
  secondaryAction,
  onDismiss,
  highlightTitle,
}: SofiaToastProps) {
  const Icon = sofiaToastVariantIcons[variant];

  const actionIsOutlined = (v?: SofiaToastAction['variant']) => !v || v === 'outline' || v === 'ghost';

  return sonnerToast.custom(
    (toastId) => (
      <motion.div
        variants={sofiaToastAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'w-full max-w-xs p-3 rounded-xl border shadow-md',
          sofiaToastVariantStyles[variant]
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', sofiaToastIconColor[variant])} />
            <div className="min-w-0 space-y-0.5">
              {title ? (
                <h3
                  className={cn(
                    'text-xs font-medium leading-none',
                    highlightTitle ? sofiaToastTitleColor.success : sofiaToastTitleColor[variant]
                  )}
                >
                  {title}
                </h3>
              ) : null}
              <p className="text-xs text-muted-foreground break-words">{message}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sonnerToast.dismiss(toastId);
              onDismiss?.();
            }}
            className="rounded-full p-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Dismiss notification"
            type="button"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {action?.label || secondaryAction?.label ? (
          <div className="mt-2 flex items-center justify-end gap-2">
            {secondaryAction?.label ? (
              <Button
                variant={secondaryAction.variant || 'ghost'}
                size="sm"
                onClick={() => {
                  secondaryAction.onClick();
                  sonnerToast.dismiss(toastId);
                }}
                className={cn(
                  'cursor-pointer',
                  actionIsOutlined(secondaryAction.variant)
                    ? variant === 'success'
                      ? 'text-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                      : variant === 'error'
                        ? 'text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                        : variant === 'warning'
                          ? 'text-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                          : 'text-foreground hover:bg-muted/10 dark:hover:bg-muted/20'
                    : null
                )}
              >
                {secondaryAction.label}
              </Button>
            ) : null}

            {action?.label ? (
              <Button
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => {
                  action.onClick();
                  sonnerToast.dismiss(toastId);
                }}
                className={cn(
                  'cursor-pointer',
                  actionIsOutlined(action.variant)
                    ? variant === 'success'
                      ? 'text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                      : variant === 'error'
                        ? 'text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                        : variant === 'warning'
                          ? 'text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                          : 'text-foreground border-border hover:bg-muted/10 dark:hover:bg-muted/20'
                    : null
                )}
              >
                {action.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </motion.div>
    ),
    { duration, position }
  );
}

export { Toaster };
