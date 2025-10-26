/**
 * Client-side analytics helpers
 * Safe utilities for browser that DO NOT import server-only modules
 */

import { analytics } from './analytics';
import { logger } from './logger';

// Capture basic performance metrics in the browser
export function capturePerformanceMetrics(userId?: string): void {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  try {
    const win = window as unknown as Window;
    const perf = win.performance as Performance;

    // Page load timing
    let pageLoadTime: number | undefined;
    if ('getEntriesByType' in perf) {
      const navEntries = perf.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0];
        pageLoadTime = nav.loadEventEnd - nav.startTime;
      }
    }

    // FCP and LCP via PerformanceObserver (if available)
    let firstContentfulPaint: number | undefined;
    let largestContentfulPaint: number | undefined;

    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              firstContentfulPaint = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true } as PerformanceObserverInit);

        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            largestContentfulPaint = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true } as PerformanceObserverInit);

        // Disconnect observers after load
        win.addEventListener('load', () => {
          try { fcpObserver.disconnect(); } catch {}
          try { lcpObserver.disconnect(); } catch {}

          analytics.trackPerformance(
            {
              pageLoadTime: typeof pageLoadTime === 'number' ? pageLoadTime : 0,
              firstContentfulPaint: typeof firstContentfulPaint === 'number' ? firstContentfulPaint : 0,
              largestContentfulPaint: typeof largestContentfulPaint === 'number' ? largestContentfulPaint : 0,
              cumulativeLayoutShift: 0,
              firstInputDelay: 0,
              timeToInteractive: 0,
            },
            userId
          );
        });
      } catch (err) {
        logger.warn?.('PerformanceObserver not available or failed', { metadata: { error: (err as Error)?.message } });
      }
    } else {
      // Fallback: still send page load time if available
      win.addEventListener('load', () => {
        analytics.trackPerformance(
          {
            pageLoadTime: typeof pageLoadTime === 'number' ? pageLoadTime : 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            timeToInteractive: 0,
          },
          userId
        );
      });
    }

    logger.debug('Performance metrics capture initialized');
  } catch (error) {
    logger.error('Failed to capture performance metrics', { component: 'analytics-client' }, error as Error);
  }
}

// Capture engagement: scroll depth, clicks per session, time on page
export function captureEngagementMetrics(userId?: string): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  try {
    let clicks = 0;
    let maxScrollDepth = 0;
    let startTime = Date.now();

    const clickHandler = () => { clicks += 1; };
    const scrollHandler = () => {
      const scrolled = (window.scrollY + window.innerHeight) / Math.max(document.body.scrollHeight, window.innerHeight);
      maxScrollDepth = Math.max(maxScrollDepth, Math.round(scrolled * 100));
    };

    document.addEventListener('click', clickHandler);
    window.addEventListener('scroll', scrollHandler);

    const interval = window.setInterval(() => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      analytics.trackEngagement(
        {
          timeOnPage,
          scrollDepth: maxScrollDepth,
          clicksPerSession: clicks,
          pagesPerSession: 1,
          bounceRate: 0,
          returnVisitor: false,
          featureUsage: {},
        },
        userId
      );
    }, 15000); // every 15s

    logger.debug('Engagement metrics capture initialized');

    return () => {
      try {
        document.removeEventListener('click', clickHandler);
        window.removeEventListener('scroll', scrollHandler);
        window.clearInterval(interval);
      } catch {}
    };
  } catch (error) {
    logger.error('Failed to setup engagement metrics', { component: 'analytics-client' }, error as Error);
    return () => {};
  }
}

// Setup global error tracking for browser
export function setupErrorTracking(userId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const onError = (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => {
      const err = error || new Error(typeof message === 'string' ? message : 'Browser error');
      analytics.trackError(err, 'global_error_handler', userId, {
        source,
        lineno,
        colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let err: Error;
      if (reason instanceof Error) err = reason;
      else err = new Error(typeof reason === 'string' ? reason : 'Unhandled rejection');
      analytics.trackError(err, 'unhandled_rejection', userId);
    };

    window.addEventListener('error', onError as any);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    logger.debug('Error tracking enabled (browser)');
  } catch (error) {
    logger.error('Failed to setup error tracking', { component: 'analytics-client' }, error as Error);
  }
}
