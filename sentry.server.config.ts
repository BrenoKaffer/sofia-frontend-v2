import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configurações de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configurações de debug
  debug: process.env.NODE_ENV === 'development',
  
  // Configurações de release
  release: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV,
  
  // Configurações específicas do servidor
  integrations: [
    Sentry.httpIntegration(),
  ],
  
  // Filtros de erro para servidor
  beforeSend(event, hint) {
    const error = hint.originalException as Error | undefined;
    
    // Ignorar erros de timeout conhecidos
    if (error && error.message) {
      if (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('socket hang up')
      ) {
        return null;
      }
    }
    
    // Ignorar erros 404 em rotas de API
    if (event.request?.url?.includes('/api/') && 
        event.contexts?.response?.status_code === 404) {
      return null;
    }
    
    return event;
  },
  
  // Configurações de privacidade para servidor
  beforeBreadcrumb(breadcrumb) {
    // Remover dados sensíveis de requisições HTTP
    if (breadcrumb.category === 'http') {
      if (breadcrumb.data?.url) {
        // Remover query parameters sensíveis
        breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|key|password|secret)=[^&]*/gi, '$1$2=***');
      }
    }
    
    return breadcrumb;
  },
});