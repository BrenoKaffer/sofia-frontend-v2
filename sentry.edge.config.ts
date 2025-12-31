import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configurações de performance para edge
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Configurações de debug
  debug: process.env.NODE_ENV === 'development',
  
  // Configurações de release
  release: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV,
  
  // Filtros específicos para edge runtime
  beforeSend(event, hint) {
    const error = hint.originalException as Error | undefined;
    
    // Ignorar erros específicos do edge runtime
    if (error && error.message) {
      if (
        error.message.includes('Dynamic Code Evaluation') ||
        error.message.includes('Edge Runtime')
      ) {
        return null;
      }
    }
    
    return event;
  },
});