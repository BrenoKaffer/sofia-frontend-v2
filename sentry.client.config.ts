import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configurações de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configurações de debug
  debug: process.env.NODE_ENV === 'development',
  
  // Configurações de release
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV,
  
  // Configurações de integração
  integrations: [
    // BrowserTracing já está incluído por padrão no @sentry/nextjs
  ],
  
  // Filtros de erro
  beforeSend(event, hint) {
    // Filtrar erros conhecidos ou irrelevantes
    const error = hint.originalException;
    
    // Ignorar erros de rede comuns
    if (error && error instanceof Error && error.message) {
      if (
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Load failed')
      ) {
        return null;
      }
    }
    
    // Ignorar erros de extensões do navegador
    if (event.exception) {
      const stacktrace = event.exception.values?.[0]?.stacktrace;
      if (stacktrace?.frames?.some(frame => 
        frame.filename?.includes('extension://') ||
        frame.filename?.includes('moz-extension://')
      )) {
        return null;
      }
    }
    
    return event;
  },
  
  // Configurações de privacidade
  beforeBreadcrumb(breadcrumb) {
    // Filtrar breadcrumbs sensíveis
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    
    // Remover dados sensíveis de URLs
    if (breadcrumb.category === 'navigation') {
      if (breadcrumb.data?.to) {
        breadcrumb.data.to = breadcrumb.data.to.replace(/\?.*/, '');
      }
    }
    
    return breadcrumb;
  },
});