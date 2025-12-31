'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
  breakpoint?: 'mobile' | 'tablet' | 'desktop' | 'all';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: '',
  sm: 'px-2 py-1 sm:px-4 sm:py-2',
  md: 'px-4 py-2 sm:px-6 sm:py-4',
  lg: 'px-6 py-4 sm:px-8 sm:py-6',
  xl: 'px-8 py-6 sm:px-12 sm:py-8'
};

const breakpointClasses = {
  mobile: 'block sm:hidden',
  tablet: 'hidden sm:block lg:hidden',
  desktop: 'hidden lg:block',
  all: 'block'
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  center = false,
  breakpoint = 'all'
}) => {
  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        breakpointClasses[breakpoint],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

// Hook para detectar breakpoints
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet'
  };
};

// Componente para grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}) => {
  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;

  return (
    <div
      className={cn(
        'grid',
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

// Componente para texto responsivo
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    tablet?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    desktop?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  size = { mobile: 'sm', tablet: 'base', desktop: 'lg' },
  weight = 'normal',
  align = 'left'
}) => {
  const responsiveSize = `${sizeClasses[size.mobile || 'sm']} sm:${sizeClasses[size.tablet || 'base']} lg:${sizeClasses[size.desktop || 'lg']}`;

  return (
    <span
      className={cn(
        responsiveSize,
        weightClasses[weight],
        alignClasses[align],
        className
      )}
    >
      {children}
    </span>
  );
};

// Hook para orientação do dispositivo
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
};

// Componente para imagens responsivas
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  sizes = {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw'
  },
  priority = false,
  loading = 'lazy'
}) => {
  const sizesString = `(max-width: 640px) ${sizes.mobile}, (max-width: 1024px) ${sizes.tablet}, ${sizes.desktop}`;

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizesString}
      loading={loading}
      className={cn(
        'w-full h-auto object-cover',
        className
      )}
      {...(priority && { fetchPriority: 'high' })}
    />
  );
};

// Hook para detecção de touch
export const useTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return { isTouch };
};

// Componente para espaçamento responsivo
interface ResponsiveSpacerProps {
  size?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  direction?: 'horizontal' | 'vertical';
}

export const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size = { mobile: 4, tablet: 6, desktop: 8 },
  direction = 'vertical'
}) => {
  const spacingClass = direction === 'vertical' 
    ? `h-${size.mobile} sm:h-${size.tablet} lg:h-${size.desktop}`
    : `w-${size.mobile} sm:w-${size.tablet} lg:w-${size.desktop}`;

  return <div className={spacingClass} />;
};