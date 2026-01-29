'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

type GradientAlertVariant = 'information' | 'success' | 'warning' | 'error';

export type GradientAlertProps = {
  variant?: GradientAlertVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

const gradientAlertVariants = cva(
  'relative w-full overflow-hidden rounded-xl border p-4',
  {
    variants: {
      variant: {
        information: 'border-sky-500/25',
        success: 'border-emerald-500/25',
        warning: 'border-amber-500/25',
        error: 'border-rose-500/25',
      },
    },
    defaultVariants: {
      variant: 'information',
    },
  }
);

const gradientBgVariants: Record<GradientAlertVariant, string> = {
  information: 'bg-gradient-to-r from-sky-500/35 via-indigo-500/15 to-transparent',
  success: 'bg-gradient-to-r from-emerald-500/35 via-green-500/15 to-transparent',
  warning: 'bg-gradient-to-r from-amber-500/35 via-yellow-500/15 to-transparent',
  error: 'bg-gradient-to-r from-rose-500/35 via-red-500/15 to-transparent',
};

const iconVariants: Record<GradientAlertVariant, React.ReactNode> = {
  information: <Info className="h-5 w-5 text-sky-300" />,
  success: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-300" />,
  error: <XCircle className="h-5 w-5 text-rose-300" />,
};

const GradientAlert = React.forwardRef<HTMLDivElement, GradientAlertProps>(
  ({ variant = 'information', title, description, className, onClose }, ref) => (
    <motion.div
      ref={ref}
      role="alert"
      initial={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(gradientAlertVariants({ variant }), className)}
    >
      <div className={cn('absolute inset-0', gradientBgVariants[variant])} />
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{iconVariants[variant]}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </motion.div>
  )
);
GradientAlert.displayName = 'GradientAlert';

export { Alert, AlertTitle, AlertDescription, GradientAlert };
