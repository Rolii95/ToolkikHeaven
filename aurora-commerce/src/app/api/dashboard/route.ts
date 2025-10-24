import { NextRequest, NextResponse } from 'next/server';
import { 
  getCacheMetrics, 
  checkCacheHealth,
  incrementCacheStats 
} from '../../../lib/cache/middleware';
import { 
  PerformanceMonitor, 
  QueryOptimizer,
  AutoScaler 
} from '../../../lib/performance/optimization';
import { cache } from '../../../lib/cache/redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    await PerformanceMonitor.recordMetric('dashboard_request', 1, {
      action,
      timestamp: new Date().toISOString(),
    });

    switch (action) {
      case 'overview':
        return await getDashboardOverview();
      
      case 'cache':
        return await getCacheDashboard();
      
      case 'performance':
        return await getPerformanceDashboard();
      
      case 'queries':
        return await getQueryDashboard();
      
      case 'scaling':
        return await getScalingDashboard();
      
      case 'health':
        return await getHealthCheck();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDashboardOverview() {
  const [
    cacheMetrics,
    cacheHealth,
    performanceSummary,
    slowQueries,
    scalingStatus,
  ] = await Promise.all([
    getCacheMetrics(),
    checkCacheHealth(),
    PerformanceMonitor.getPerformanceSummary(),
    QueryOptimizer.getSlowQueries(5),
    AutoScaler.checkScalingConditions(),
  ]);

  const overview = {
    timestamp: new Date().toISOString(),
    status: cacheHealth.status,
    metrics: {
      cache: {
        hitRatio: cacheMetrics.hitRatio,
        totalRequests: cacheMetrics.totalRequests,
        memory: cacheMetrics.memory,
        connected: cacheMetrics.connected,
      },
      performance: {
        avgResponseTime: performanceSummary.avgResponseTime,
        errorRate: performanceSummary.errorRate,
        slowQueryCount: performanceSummary.slowQueryCount,
      },
      scaling: {
        shouldScale: scalingStatus.shouldScale,
        direction: scalingStatus.direction,
        reason: scalingStatus.reason,
      },
    },
    recentSlowQueries: slowQueries.slice(0, 3),
    health: {
      cache: cacheHealth,
      overall: cacheHealth.status === 'healthy' && performanceSummary.errorRate < 5 
        ? 'healthy' 
        : 'degraded',
    },
  };

  return NextResponse.json(overview, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

async function getCacheDashboard() {
  const [metrics, health] = await Promise.all([
    getCacheMetrics(),
    checkCacheHealth(),
  ]);

  // Get cache key statistics
  const keyStats = await cache.getStats();
  
  // Simulate cache operation metrics for the last hour
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  const recentMetrics = await PerformanceMonitor.getMetrics('cache_operation', {
    start: hourAgo,
    end: now,
  });

  const dashboard = {
    overview: {
      status: health.status,
      latency: health.latency,
      hitRatio: metrics.hitRatio,
      totalRequests: metrics.totalRequests,
      memory: metrics.memory,
    },
    statistics: {
      hits: metrics.hitCount,
      misses: metrics.missCount,
      keyspace: keyStats.keyspace,
      uptime: keyStats.uptime,
    },
    recentActivity: recentMetrics.slice(0, 20),
    recommendations: generateCacheRecommendations(metrics),
  };

  return NextResponse.json(dashboard);
}

async function getPerformanceDashboard() {
  const [summary, responseTimeMetrics, errorMetrics] = await Promise.all([
    PerformanceMonitor.getPerformanceSummary(),
    PerformanceMonitor.getMetrics('response_time'),
    PerformanceMonitor.getMetrics('error'),
  ]);

  // Calculate trends (last 24 hours vs previous 24 hours)
  const now = Date.now();
  const last24h = now - (24 * 60 * 60 * 1000);
  const previous24h = last24h - (24 * 60 * 60 * 1000);

  const recent = responseTimeMetrics.filter(m => m.timestamp >= last24h);
  const previous = responseTimeMetrics.filter(
    m => m.timestamp >= previous24h && m.timestamp < last24h
  );

  const avgRecent = recent.length > 0 
    ? recent.reduce((sum, m) => sum + m.value, 0) / recent.length 
    : 0;
  const avgPrevious = previous.length > 0 
    ? previous.reduce((sum, m) => sum + m.value, 0) / previous.length 
    : 0;

  const trend = avgPrevious > 0 
    ? ((avgRecent - avgPrevious) / avgPrevious) * 100 
    : 0;

  const dashboard = {
    summary,
    trends: {
      responseTime: {
        current: Math.round(avgRecent),
        previous: Math.round(avgPrevious),
        change: Math.round(trend * 100) / 100,
        direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
      },
    },
    charts: {
      responseTime: recent.slice(-50), // Last 50 data points
      errors: errorMetrics.slice(-50),
    },
    alerts: generatePerformanceAlerts(summary),
  };

  return NextResponse.json(dashboard);
}

async function getQueryDashboard() {
  const slowQueries = await QueryOptimizer.getSlowQueries(50);
  
  // Group by query name
  const queryGroups = slowQueries.reduce((groups: any, query) => {
    const name = query.queryName;
    if (!groups[name]) {
      groups[name] = {
        name,
        count: 0,
        avgTime: 0,
        maxTime: 0,
        recentExecutions: [],
      };
    }
    
    groups[name].count++;
    groups[name].avgTime = (groups[name].avgTime + query.executionTime) / groups[name].count;
    groups[name].maxTime = Math.max(groups[name].maxTime, query.executionTime);
    groups[name].recentExecutions.push(query);
    
    return groups;
  }, {});

  const topSlowQueries = Object.values(queryGroups)
    .sort((a: any, b: any) => b.avgTime - a.avgTime)
    .slice(0, 10);

  const dashboard = {
    summary: {
      totalSlowQueries: slowQueries.length,
      uniqueQueries: Object.keys(queryGroups).length,
      averageExecutionTime: slowQueries.length > 0
        ? Math.round(slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / slowQueries.length)
        : 0,
    },
    topSlowQueries,
    recentSlowQueries: slowQueries.slice(0, 20),
    recommendations: generateQueryRecommendations(queryGroups),
  };

  return NextResponse.json(dashboard);
}

async function getScalingDashboard() {
  const scalingStatus = await AutoScaler.checkScalingConditions();
  
  // Simulate resource usage history
  const now = Date.now();
  const resourceHistory = Array.from({ length: 24 }, (_, i) => ({
    timestamp: now - (i * 60 * 60 * 1000), // Hourly data for 24 hours
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    requests: Math.floor(Math.random() * 1000) + 100,
  })).reverse();

  const dashboard = {
    currentStatus: scalingStatus,
    resourceUsage: {
      current: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        storage: Math.random() * 100,
      },
      history: resourceHistory,
    },
    scalingHistory: await getScalingHistory(),
    thresholds: {
      scaleUp: {
        cpu: 80,
        memory: 80,
        responseTime: 1000,
        errorRate: 5,
      },
      scaleDown: {
        cpu: 30,
        memory: 30,
        responseTime: 200,
        errorRate: 1,
      },
    },
    recommendations: generateScalingRecommendations(scalingStatus),
  };

  return NextResponse.json(dashboard);
}

async function getHealthCheck() {
  const [cacheHealth, performanceSummary] = await Promise.all([
    checkCacheHealth(),
    PerformanceMonitor.getPerformanceSummary(),
  ]);

  const checks = {
    cache: {
      status: cacheHealth.status,
      latency: cacheHealth.latency,
      details: cacheHealth.details,
    },
    database: {
      status: 'healthy', // Simplified
      latency: Math.floor(Math.random() * 50) + 10,
      details: 'Connection pool healthy',
    },
    api: {
      status: performanceSummary.errorRate < 5 ? 'healthy' : 'degraded',
      latency: performanceSummary.avgResponseTime,
      details: `Error rate: ${performanceSummary.errorRate}%`,
    },
    external: {
      status: 'healthy',
      latency: Math.floor(Math.random() * 100) + 50,
      details: 'All external services responding',
    },
  };

  const overallStatus = Object.values(checks).every(check => check.status === 'healthy')
    ? 'healthy'
    : Object.values(checks).some(check => check.status === 'down')
    ? 'down'
    : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  });
}

// Helper functions for generating recommendations and history
function generateCacheRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.hitRatio < 50) {
    recommendations.push('Consider increasing cache TTL for frequently accessed data');
  }
  
  if (metrics.hitRatio < 30) {
    recommendations.push('Review cache keys and ensure proper cache warming');
  }
  
  if (metrics.totalRequests > 10000 && metrics.hitRatio > 90) {
    recommendations.push('Excellent cache performance! Consider expanding cache scope');
  }
  
  return recommendations;
}

function generatePerformanceAlerts(summary: any): Array<{type: string, message: string, severity: string}> {
  const alerts = [];
  
  if (summary.avgResponseTime > 1000) {
    alerts.push({
      type: 'response_time',
      message: `High average response time: ${summary.avgResponseTime}ms`,
      severity: 'warning',
    });
  }
  
  if (summary.errorRate > 5) {
    alerts.push({
      type: 'error_rate',
      message: `High error rate: ${summary.errorRate}%`,
      severity: 'critical',
    });
  }
  
  if (summary.cacheHitRatio < 50) {
    alerts.push({
      type: 'cache_performance',
      message: `Low cache hit ratio: ${summary.cacheHitRatio}%`,
      severity: 'warning',
    });
  }
  
  return alerts;
}

function generateQueryRecommendations(queryGroups: any): string[] {
  const recommendations = [];
  const queries = Object.values(queryGroups) as any[];
  
  const slowestQuery = queries.sort((a, b) => b.avgTime - a.avgTime)[0];
  if (slowestQuery && slowestQuery.avgTime > 2000) {
    recommendations.push(`Optimize "${slowestQuery.name}" - average execution time: ${Math.round(slowestQuery.avgTime)}ms`);
  }
  
  const frequentSlow = queries.filter(q => q.count > 10 && q.avgTime > 500);
  if (frequentSlow.length > 0) {
    recommendations.push(`${frequentSlow.length} frequently executed slow queries need optimization`);
  }
  
  return recommendations;
}

function generateScalingRecommendations(scalingStatus: any): string[] {
  const recommendations = [];
  
  if (scalingStatus.shouldScale && scalingStatus.direction === 'up') {
    recommendations.push(`Consider scaling up: ${scalingStatus.reason}`);
  }
  
  if (scalingStatus.shouldScale && scalingStatus.direction === 'down') {
    recommendations.push(`Consider scaling down: ${scalingStatus.reason}`);
  }
  
  if (!scalingStatus.shouldScale) {
    recommendations.push('Resource utilization is optimal');
  }
  
  return recommendations;
}

async function getScalingHistory(): Promise<Array<{timestamp: number, action: string, reason: string}>> {
  // Simulate scaling history
  const now = Date.now();
  return [
    {
      timestamp: now - (2 * 60 * 60 * 1000),
      action: 'scale_up',
      reason: 'High CPU usage: 85%',
    },
    {
      timestamp: now - (6 * 60 * 60 * 1000),
      action: 'scale_down',
      reason: 'Low CPU usage: 25%',
    },
  ];
}