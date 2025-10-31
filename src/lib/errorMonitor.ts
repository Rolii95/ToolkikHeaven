/**
 * Enhanced Error Monitoring and Logging System
 * Provides structured logging, error tracking, and performance monitoring
 */

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  traceId?: string;
}

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    additionalData?: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private isProduction: boolean;
  private apiEndpoint: string;
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.apiEndpoint = '/api/analytics/track';
    this.sessionId = this.generateSessionId();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          type: 'promise_rejection',
          reason: event.reason,
        }
      );
    });

    // Catch network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.captureError(
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            {
              type: 'network_error',
              url: args[0],
              status: response.status,
              statusText: response.statusText,
            }
          );
        }
        
        return response;
      } catch (error) {
        this.captureError(error as Error, {
          type: 'network_error',
          url: args[0],
        });
        throw error;
      }
    };
  }

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
      traceId: this.generateTraceId(),
    };

    // Console logging for development
    if (!this.isProduction) {
      const consoleMethod = level === 'ERROR' ? 'error' : 
                           level === 'WARN' ? 'warn' : 
                           level === 'DEBUG' ? 'debug' : 'log';
      console[consoleMethod](`[${level}]`, message, context, error);
    }

    // Send to analytics endpoint
    this.sendToAnalytics(logEntry);
  }

  captureError(error: Error, additionalContext?: Record<string, any>): void {
    const severity = this.determineSeverity(error, additionalContext);
    
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        userId: this.userId,
        sessionId: this.sessionId,
        additionalData: additionalContext,
      },
      severity,
    };

    // Log the error
    this.log('ERROR', `Error captured: ${error.message}`, {
      errorId: errorReport.id,
      severity,
      ...additionalContext,
    }, error);

    // Send error report
    this.sendErrorReport(errorReport);
  }

  private determineSeverity(error: Error, context?: Record<string, any>): ErrorReport['severity'] {
    // Critical errors that break core functionality
    if (error.message.includes('ChunkLoadError') || 
        error.message.includes('Loading chunk') ||
        context?.type === 'payment_error') {
      return 'critical';
    }

    // High severity for user-facing errors
    if (error.name === 'TypeError' || 
        error.name === 'ReferenceError' ||
        context?.type === 'api_error') {
      return 'high';
    }

    // Medium for non-critical but important errors
    if (context?.type === 'network_error' || 
        context?.type === 'validation_error') {
      return 'medium';
    }

    return 'low';
  }

  private async sendToAnalytics(logEntry: LogEntry): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'log_entry',
          metadata: logEntry,
          user_id: this.userId,
          session_id: this.sessionId,
        }),
      });
    } catch (error) {
      // Fail silently to avoid infinite loops
      if (!this.isProduction) {
        console.error('Failed to send log to analytics:', error);
      }
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'error_report',
          metadata: errorReport,
          user_id: this.userId,
          session_id: this.sessionId,
        }),
      });
    } catch (error) {
      // Fail silently
      if (!this.isProduction) {
        console.error('Failed to send error report:', error);
      }
    }
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => Promise<any> | any): Promise<any> {
    const startTime = performance.now();
    const traceId = this.generateTraceId();

    this.log('INFO', `Performance measurement started: ${name}`, {
      performanceMark: name,
      traceId,
      startTime,
    });

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.log('INFO', `Performance measurement completed: ${name}`, {
              performanceMark: name,
              traceId,
              duration,
              status: 'success',
            });
            
            return value;
          })
          .catch((error) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.captureError(error, {
              performanceMark: name,
              traceId,
              duration,
              status: 'error',
            });
            
            throw error;
          });
      } else {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.log('INFO', `Performance measurement completed: ${name}`, {
          performanceMark: name,
          traceId,
          duration,
          status: 'success',
        });
        
        return result;
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.captureError(error as Error, {
        performanceMark: name,
        traceId,
        duration,
        status: 'error',
      });
      
      throw error;
    }
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Helper functions for different log levels
export const logger = {
  error: (message: string, context?: Record<string, any>, error?: Error) => 
    errorMonitor.log('ERROR', message, context, error),
  
  warn: (message: string, context?: Record<string, any>) => 
    errorMonitor.log('WARN', message, context),
  
  info: (message: string, context?: Record<string, any>) => 
    errorMonitor.log('INFO', message, context),
  
  debug: (message: string, context?: Record<string, any>) => 
    errorMonitor.log('DEBUG', message, context),
};

// React hook for error monitoring
export const useErrorMonitor = () => {
  return {
    captureError: (error: Error, context?: Record<string, any>) => 
      errorMonitor.captureError(error, context),
    
    setUserId: (userId: string) => errorMonitor.setUserId(userId),
    
    measurePerformance: (name: string, fn: () => any) => 
      errorMonitor.measurePerformance(name, fn),
    
    logger,
  };
};

export default errorMonitor;