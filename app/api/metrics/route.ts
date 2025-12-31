import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddlewares } from '@/lib/security';

// Interface para payload de métricas
interface MetricsPayload {
  performance: Array<{
    name: string;
    value: number;
    unit: string;
    timestamp: string;
    context?: Record<string, any>;
  }>;
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
    context?: Record<string, any>;
  }>;
  usage: Array<{
    event: string;
    component: string;
    timestamp: string;
    userId?: string;
    metadata?: Record<string, any>;
  }>;
  timestamp: string;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    // Aplicar middleware de segurança
    const securityCheck = SecurityMiddlewares.publicApi(request);
    if (securityCheck) {
      return securityCheck;
    }

    const payload: MetricsPayload = await request.json();

    // Validar payload básico
    if (!payload.timestamp || !payload.url) {
      return NextResponse.json(
        { error: 'Payload inválido' },
        { status: 400 }
      );
    }

    // Processar métricas de performance
    if (payload.performance?.length > 0) {
      await processPerformanceMetrics(payload.performance, {
        url: payload.url,
        userAgent: payload.userAgent,
        timestamp: payload.timestamp,
      });
    }

    // Processar métricas de erro
    if (payload.errors?.length > 0) {
      await processErrorMetrics(payload.errors, {
        url: payload.url,
        userAgent: payload.userAgent,
        timestamp: payload.timestamp,
      });
    }

    // Processar métricas de uso
    if (payload.usage?.length > 0) {
      await processUsageMetrics(payload.usage, {
        url: payload.url,
        userAgent: payload.userAgent,
        timestamp: payload.timestamp,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar métricas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Processar métricas de performance
async function processPerformanceMetrics(
  metrics: MetricsPayload['performance'],
  context: { url: string; userAgent: string; timestamp: string }
) {
  // Agrupar métricas por tipo
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, typeof metrics>);

  // Calcular estatísticas
  for (const [metricName, metricValues] of Object.entries(groupedMetrics)) {
    const values = metricValues.map(m => m.value);
    const stats = {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p95: calculatePercentile(values, 95),
      p99: calculatePercentile(values, 99),
    };

    // Log estatísticas (em produção, enviar para serviço de métricas)
    console.log(`📊 Performance [${metricName}]:`, {
      ...stats,
      url: context.url,
      timestamp: context.timestamp,
    });

    // Alertas para métricas críticas
    if (metricName.includes('web_vitals')) {
      checkWebVitalsThresholds(metricName, stats.avg);
    }
  }
}

// Processar métricas de erro
async function processErrorMetrics(
  errors: MetricsPayload['errors'],
  context: { url: string; userAgent: string; timestamp: string }
) {
  // Agrupar erros por tipo
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, typeof errors>);

  for (const [errorType, errorList] of Object.entries(errorsByType)) {
    console.error(`🚨 Erros [${errorType}]:`, {
      count: errorList.length,
      errors: errorList.map(e => ({
        message: e.message,
        timestamp: e.timestamp,
        context: e.context,
      })),
      url: context.url,
      userAgent: context.userAgent,
    });

    // Alertas para erros críticos
    if (errorList.length > 5) {
      console.error(`⚠️ ALERTA: Muitos erros do tipo ${errorType} detectados!`);
    }
  }
}

// Processar métricas de uso
async function processUsageMetrics(
  usage: MetricsPayload['usage'],
  context: { url: string; userAgent: string; timestamp: string }
) {
  // Agrupar por componente e evento
  const usageByComponent = usage.reduce((acc, metric) => {
    const key = `${metric.component}:${metric.event}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(metric);
    return acc;
  }, {} as Record<string, typeof usage>);

  for (const [key, metrics] of Object.entries(usageByComponent)) {
    console.log(`👤 Uso [${key}]:`, {
      count: metrics.length,
      uniqueUsers: new Set(metrics.map(m => m.userId).filter(Boolean)).size,
      url: context.url,
      timestamp: context.timestamp,
    });
  }
}

// Calcular percentil
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Verificar thresholds dos Web Vitals
function checkWebVitalsThresholds(metricName: string, value: number) {
  const thresholds = {
    web_vitals_fcp: { good: 1800, poor: 3000 }, // First Contentful Paint
    web_vitals_lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    web_vitals_fid: { good: 100, poor: 300 },   // First Input Delay
    web_vitals_cls: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  };

  const threshold = thresholds[metricName as keyof typeof thresholds];
  if (!threshold) return;

  let status = 'good';
  if (value > threshold.poor) {
    status = 'poor';
  } else if (value > threshold.good) {
    status = 'needs-improvement';
  }

  if (status !== 'good') {
    console.warn(`⚠️ Web Vital [${metricName}] está ${status}: ${value}ms`);
  }
}

// Endpoint GET para obter estatísticas (desenvolvimento)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Não disponível em produção' }, { status: 403 });
  }

  // Retornar estatísticas mockadas para desenvolvimento
  return NextResponse.json({
    performance: {
      web_vitals_fcp: { avg: 1200, p95: 1800, count: 150 },
      web_vitals_lcp: { avg: 2100, p95: 3200, count: 150 },
      web_vitals_fid: { avg: 45, p95: 120, count: 120 },
      web_vitals_cls: { avg: 0.05, p95: 0.15, count: 150 },
      api_request_duration: { avg: 250, p95: 800, count: 500 },
      component_render_duration: { avg: 15, p95: 45, count: 1200 },
    },
    errors: {
      javascript: { count: 5, last_24h: 2 },
      promise: { count: 3, last_24h: 1 },
      api: { count: 12, last_24h: 4 },
    },
    usage: {
      page_views: { count: 1250, unique_users: 85 },
      button_clicks: { count: 3400, unique_users: 78 },
      form_submissions: { count: 156, unique_users: 45 },
    },
    timestamp: new Date().toISOString(),
  });
}
