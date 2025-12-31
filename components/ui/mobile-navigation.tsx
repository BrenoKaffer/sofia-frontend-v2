'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useBreakpoint } from './responsive-container';
import { 
  Home, 
  BarChart3, 
  Settings, 
  User, 
  Menu, 
  X,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: 3
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { label: 'Profile', href: '/settings/profile', icon: User },
      { label: 'Notifications', href: '/settings/notifications', icon: Bell },
      { label: 'Privacy', href: '/settings/privacy', icon: Settings }
    ]
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User
  }
];

interface MobileNavigationProps {
  className?: string;
  onNavigate?: (href: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const pathname = usePathname();
  const { isMobile } = useBreakpoint();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    closeMenu();
  };

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('[data-mobile-nav]')) {
        closeMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Fechar menu ao mudar de rota
  React.useEffect(() => {
    closeMenu();
  }, [pathname]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Header Mobile */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3',
          className
        )}
        data-mobile-nav
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900">Sofia</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="mobile-search-button"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="mobile-notifications-button"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="mobile-menu-button"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        data-mobile-nav
        data-testid="mobile-menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={closeMenu}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggleExpanded={toggleExpanded}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                João Silva
              </p>
              <p className="text-xs text-gray-500 truncate">
                joao@example.com
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer para compensar header fixo */}
      <div className="h-16" />
    </>
  );
};

interface NavigationItemProps {
  item: NavigationItem;
  pathname: string;
  expandedItems: string[];
  onToggleExpanded: (href: string) => void;
  onNavigate: (href: string) => void;
  level?: number;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  pathname,
  expandedItems,
  onToggleExpanded,
  onNavigate,
  level = 0
}) => {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const isExpanded = expandedItems.includes(item.href);
  const hasChildren = item.children && item.children.length > 0;

  const paddingLeft = level === 0 ? 'pl-4' : 'pl-8';

  return (
    <div>
      {/* Item Principal */}
      <div
        className={cn(
          'flex items-center justify-between py-3 pr-4 transition-colors',
          paddingLeft,
          isActive 
            ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpanded(item.href)}
              className="flex items-center space-x-3 flex-1 min-w-0"
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ) : (
            <Link
              href={item.href}
              onClick={() => onNavigate(item.href)}
              className="flex items-center space-x-3 flex-1 min-w-0"
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Badge */}
          {item.badge && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {item.badge}
            </span>
          )}

          {/* Expand Icon */}
          {hasChildren && (
            <button
              onClick={() => onToggleExpanded(item.href)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronDown 
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Subitens */}
      {hasChildren && isExpanded && (
        <div className="bg-gray-50">
          {item.children!.map((child) => (
            <NavigationItem
              key={child.href}
              item={child}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Bottom Navigation para mobile
interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  className
}) => {
  const pathname = usePathname();
  const { isMobile } = useBreakpoint();

  const bottomNavItems = navigationItems.slice(0, 4); // Apenas os 4 principais

  if (!isMobile) {
    return null;
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40',
        className
      )}
      data-testid="bottom-navigation"
    >
      <div className="flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors relative',
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Badge */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};