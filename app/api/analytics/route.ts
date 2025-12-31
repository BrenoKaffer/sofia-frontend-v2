/**
 * API de Analytics
 * Endpoints para coleta e recuperação de métricas de analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

// Interface para parâmetros de consulta
interface AnalyticsQuery {
  action?: string;
  timeRange?: string;
  userId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  offset?: string;
}

// GET - Recuperar métricas de analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query: AnalyticsQuery = {
      action: searchParams.get('action') || 'overview',
      timeRange: searchParams.get('timeRange') || '24h',
      userId: searchParams.get('userId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || '100',
      offset: searchParams.get('offset') || '0',
    };

    logger.info('Analytics API request', {
      userId,
      metadata: {
        query,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    switch (query.action) {
      case 'overview':
        return await handleOverview(userId, query);
      
      case 'performance':
        return await handlePerformanceMetrics(userId, query);
      
      case 'engagement':
        return await handleEngagementMetrics(userId, query);
      
      case 'business':
        return await handleBusinessMetrics(userId, query);
      
      case 'events':
        return await handleEventMetrics(userId, query);
      
      case 'realtime':
        return await handleRealtimeMetrics(userId, query);
      
      case 'export':
        return await handleExportData(userId, query);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Analytics API error', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Rastrear eventos customizados
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, eventName, properties, timestamp } = body;

    if (!eventType || !eventName) {
      return NextResponse.json(
        { error: 'eventType and eventName are required' },
        { status: 400 }
      );
    }

    // Rastreia o evento
    analytics.track(eventType, eventName, {
      ...properties,
      timestamp: timestamp || Date.now(),
      source: 'api',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    }, userId);

    logger.info('Custom event tracked', {
      userId,
      metadata: {
        eventType,
        eventName,
        properties,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: `${eventType}_${eventName}_${Date.now()}`,
    });
  } catch (error) {
    logger.error('Analytics POST error', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações de analytics
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      );
    }

    // Atualiza configurações no Redis
    const configKey = `analytics:config:${userId}`;
    await redis.set(configKey, JSON.stringify(config), 86400); // 24h TTL

    logger.info('Analytics config updated', {
      userId,
      metadata: {
        config,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config,
    });
  } catch (error) {
    logger.error('Analytics PUT error', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar dados de analytics
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'clear_user_data';
    const timeRange = searchParams.get('timeRange');

    switch (action) {
      case 'clear_user_data':
        await clearUserData(userId, timeRange);
        break;
      
      case 'clear_events':
        await clearEventData(userId, timeRange);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

    logger.info('Analytics data cleared', {
      userId,
      metadata: {
        action,
        timeRange,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Data cleared successfully',
    });
  } catch (error) {
    logger.error('Analytics DELETE error', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handlers para diferentes tipos de métricas

async function handleOverview(userId: string, query: AnalyticsQuery) {
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  // Busca métricas agregadas do Redis
  const [performanceData, engagementData, businessData, eventData] = await Promise.all([
    getAggregatedMetrics('performance', userId, startTime, now),
    getAggregatedMetrics('engagement', userId, startTime, now),
    getAggregatedMetrics('business', userId, startTime, now),
    getAggregatedMetrics('events', userId, startTime, now),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      overview: {
        totalEvents: eventData.totalEvents || 0,
        uniqueUsers: eventData.uniqueUsers || 0,
        avgSessionDuration: engagementData.avgSessionDuration || 0,
        avgPageLoadTime: performanceData.avgPageLoadTime || 0,
        errorRate: performanceData.errorRate || 0,
        conversionRate: businessData.conversionRate || 0,
      },
      performance: performanceData,
      engagement: engagementData,
      business: businessData,
      events: eventData,
    },
  });
}

async function handlePerformanceMetrics(userId: string, query: AnalyticsQuery) {
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  const data = await getAggregatedMetrics('performance', userId, startTime, now);

  return NextResponse.json({
    success: true,
    data: {
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      metrics: data,
    },
  });
}

async function handleEngagementMetrics(userId: string, query: AnalyticsQuery) {
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  const data = await getAggregatedMetrics('engagement', userId, startTime, now);

  return NextResponse.json({
    success: true,
    data: {
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      metrics: data,
    },
  });
}

async function handleBusinessMetrics(userId: string, query: AnalyticsQuery) {
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  const data = await getAggregatedMetrics('business', userId, startTime, now);

  return NextResponse.json({
    success: true,
    data: {
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      metrics: data,
    },
  });
}

async function handleEventMetrics(userId: string, query: AnalyticsQuery) {
  const limit = parseInt(query.limit || '100');
  const offset = parseInt(query.offset || '0');
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  // Busca eventos do Redis
  const eventsKey = `analytics:events:${userId}`;
  const allEvents = await redis.get(eventsKey) || [];
  const events = Array.isArray(allEvents) ? allEvents.filter((event: any) => {
    const eventTime = event.timestamp || 0;
    return eventTime >= startTime && eventTime <= now;
  }).slice(0, 100) : [];

  const parsedEvents = [];
  for (let i = 0; i < events.length; i += 2) {
    try {
      const eventData = JSON.parse(events[i]);
      const timestamp = parseInt(events[i + 1]);
      parsedEvents.push({ ...eventData, timestamp });
    } catch (error) {
      logger.error('Failed to parse event data', { metadata: { eventData: events[i] } }, error as Error);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      events: parsedEvents,
      pagination: {
        limit,
        offset,
        total: Array.isArray(allEvents) ? allEvents.length : 0,
      },
    },
  });
}

async function handleRealtimeMetrics(userId: string, query: AnalyticsQuery) {
  const last5Minutes = 5 * 60 * 1000;
  const now = Date.now();
  const startTime = now - last5Minutes;

  const [realtimeEvents, activeUsers] = await Promise.all([
    getRealtimeEvents(userId, startTime, now),
    getActiveUsers(startTime, now),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      timestamp: now,
      period: { startTime, endTime: now },
      realtimeEvents,
      activeUsers,
      systemStatus: {
        healthy: true,
        lastUpdate: now,
      },
    },
  });
}

async function handleExportData(userId: string, query: AnalyticsQuery) {
  const timeRange = getTimeRangeMs(query.timeRange || '24h');
  const now = Date.now();
  const startTime = now - timeRange;

  // Busca todos os dados para exportação
  const [performanceData, engagementData, businessData, eventData] = await Promise.all([
    getAggregatedMetrics('performance', userId, startTime, now),
    getAggregatedMetrics('engagement', userId, startTime, now),
    getAggregatedMetrics('business', userId, startTime, now),
    getAllEvents(userId, startTime, now),
  ]);

  const exportData = {
    exportInfo: {
      userId,
      timeRange: query.timeRange,
      period: { startTime, endTime: now },
      exportedAt: now,
    },
    performance: performanceData,
    engagement: engagementData,
    business: businessData,
    events: eventData,
  };

  return NextResponse.json({
    success: true,
    data: exportData,
  });
}

// Funções auxiliares

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

async function getAggregatedMetrics(
  type: string,
  userId: string,
  startTime: number,
  endTime: number
): Promise<any> {
  try {
    const key = `analytics:aggregated:${type}:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    logger.error('Failed to get aggregated metrics', { metadata: { type, userId } }, error as Error);
    return {};
  }
}

async function getRealtimeEvents(
  userId: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  try {
    const key = `analytics:realtime:${userId}`;
    const allEvents = await redis.get(key) || [];
    const events = Array.isArray(allEvents) ? allEvents.filter((event: any) => {
      const eventTime = event.timestamp || 0;
      return eventTime >= startTime && eventTime <= endTime;
    }) : [];
    
    const parsedEvents = [];
    for (let i = 0; i < events.length; i += 2) {
      try {
        const eventData = JSON.parse(events[i]);
        const timestamp = parseInt(events[i + 1]);
        parsedEvents.push({ ...eventData, timestamp });
      } catch (error) {
        logger.error('Failed to parse realtime event', {}, error as Error);
      }
    }
    
    return parsedEvents;
  } catch (error) {
    logger.error('Failed to get realtime events', {}, error as Error);
    return [];
  }
}

async function getActiveUsers(
  startTime: number,
  endTime: number
): Promise<number> {
  try {
    const key = 'analytics:active_users';
    const allUsers = await redis.get(key) || [];
    const users = Array.isArray(allUsers) ? allUsers.filter((user: any) => {
      const userTime = user.timestamp || 0;
      return userTime >= startTime && userTime <= endTime;
    }) : [];
    return users.length;
  } catch (error) {
    logger.error('Failed to get active users', {}, error as Error);
    return 0;
  }
}

async function getAllEvents(
  userId: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  try {
    const key = `analytics:events:${userId}`;
    const allEvents = await redis.get(key) || [];
    const events = Array.isArray(allEvents) ? allEvents.filter((event: any) => {
      const eventTime = event.timestamp || 0;
      return eventTime >= startTime && eventTime <= endTime;
    }) : [];
    
    const parsedEvents = [];
    for (let i = 0; i < events.length; i += 2) {
      try {
        const eventData = JSON.parse(events[i]);
        const timestamp = parseInt(events[i + 1]);
        parsedEvents.push({ ...eventData, timestamp });
      } catch (error) {
        logger.error('Failed to parse event for export', {}, error as Error);
      }
    }
    
    return parsedEvents;
  } catch (error) {
    logger.error('Failed to get all events', {}, error as Error);
    return [];
  }
}

async function clearUserData(userId: string, timeRange?: string | null) {
  try {
    const keys = [
      `analytics:events:${userId}`,
      `analytics:aggregated:performance:${userId}`,
      `analytics:aggregated:engagement:${userId}`,
      `analytics:aggregated:business:${userId}`,
      `analytics:realtime:${userId}`,
      `analytics:config:${userId}`,
    ];
    
    if (timeRange) {
      // Limpa apenas dados do período especificado
      const timeRangeMs = getTimeRangeMs(timeRange);
      const cutoffTime = Date.now() - timeRangeMs;
      
      for (const key of keys) {
        if (key.includes('events') || key.includes('realtime')) {
          const allEvents = await redis.get(key) || [];
      if (Array.isArray(allEvents)) {
        const filteredEvents = allEvents.filter((event: any) => {
          const eventTime = event.timestamp || 0;
          return eventTime > cutoffTime;
        });
        await redis.set(key, filteredEvents);
      }
        }
      }
    } else {
      // Limpa todos os dados do usuário
      for (const key of keys) {
        await redis.del(key);
      }
    }
  } catch (error) {
    logger.error('Failed to clear user data', { metadata: { userId, timeRange } }, error as Error);
    throw error;
  }
}

async function clearEventData(userId: string, timeRange?: string | null) {
  try {
    const key = `analytics:events:${userId}`;
    
    if (timeRange) {
      const timeRangeMs = getTimeRangeMs(timeRange);
      const cutoffTime = Date.now() - timeRangeMs;
      const allData = await redis.get(key) || [];
      if (Array.isArray(allData)) {
        const filteredData = allData.filter((item: any) => {
          const itemTime = item.timestamp || 0;
          return itemTime > cutoffTime;
        });
        await redis.set(key, filteredData);
      }
    } else {
      await redis.del(key);
    }
  } catch (error) {
    logger.error('Failed to clear event data', { metadata: { userId, timeRange } }, error as Error);
    throw error;
  }
}
