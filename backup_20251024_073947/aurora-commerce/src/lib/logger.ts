/**
 * Structured Logging Utility
 * Provides standardized logging for critical transactions with traceability
 */

export interface LogContext {
  userId?: string;
  email?: string;
  orderId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  message: string;
  traceId: string;
  userId?: string;
  context?: Record<string, any>;
  duration?: number;
  error?: string;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private traceId: string;
  private context: LogContext;
  private startTime: number;

  private constructor(traceId?: string, context?: LogContext) {
    this.traceId = traceId || this.generateTraceId();
    this.context = context || {};
    this.startTime = Date.now();
  }

  /**
   * Create a new logger instance for a specific trace/request
   */
  static create(traceId?: string, context?: LogContext): Logger {
    return new Logger(traceId, context);
  }

  /**
   * Generate a unique trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Format timestamp in ISO format
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Calculate duration since logger creation
   */
  private getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogEvent['level'],
    event: string,
    message: string,
    additionalContext?: Record<string, any>,
    error?: Error
  ): LogEvent {
    const logEntry: LogEvent = {
      timestamp: this.formatTimestamp(),
      level,
      event,
      message,
      traceId: this.traceId,
      userId: this.context.userId,
      context: {
        ...this.context,
        ...additionalContext,
      },
      duration: this.getDuration(),
    };

    if (error) {
      logEntry.error = error.message;
      logEntry.stack = error.stack;
    }

    return logEntry;
  }

  /**
   * Output log entry to console with structured format
   */
  private outputLog(logEntry: LogEvent): void {
    const logString = JSON.stringify(logEntry, null, 2);
    
    switch (logEntry.level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
      default:
        console.log(logString);
        break;
    }
  }

  /**
   * Log info level events
   */
  info(event: string, message: string, context?: Record<string, any>): void {
    const logEntry = this.createLogEntry('info', event, message, context);
    this.outputLog(logEntry);
  }

  /**
   * Log warning level events
   */
  warn(event: string, message: string, context?: Record<string, any>): void {
    const logEntry = this.createLogEntry('warn', event, message, context);
    this.outputLog(logEntry);
  }

  /**
   * Log error level events
   */
  error(event: string, message: string, context?: Record<string, any>, error?: Error): void {
    const logEntry = this.createLogEntry('error', event, message, context, error);
    this.outputLog(logEntry);
  }

  /**
   * Log debug level events
   */
  debug(event: string, message: string, context?: Record<string, any>): void {
    const logEntry = this.createLogEntry('debug', event, message, context);
    this.outputLog(logEntry);
  }

  /**
   * Log transaction start
   */
  startTransaction(event: string, message: string, context?: Record<string, any>): void {
    this.info(`${event}_started`, `Transaction started: ${message}`, {
      ...context,
      transactionStart: true,
    });
  }

  /**
   * Log transaction completion
   */
  completeTransaction(event: string, message: string, context?: Record<string, any>): void {
    this.info(`${event}_completed`, `Transaction completed: ${message}`, {
      ...context,
      transactionEnd: true,
      totalDuration: this.getDuration(),
    });
  }

  /**
   * Log transaction failure
   */
  failTransaction(event: string, message: string, error?: Error, context?: Record<string, any>): void {
    this.error(`${event}_failed`, `Transaction failed: ${message}`, {
      ...context,
      transactionEnd: true,
      totalDuration: this.getDuration(),
    }, error);
  }

  /**
   * Update logger context (useful for adding user info after authentication)
   */
  updateContext(newContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Get current trace ID
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Get current context
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Record<string, any>): Logger {
    const childLogger = new Logger(this.traceId, {
      ...this.context,
      ...additionalContext,
    });
    childLogger.startTime = this.startTime; // Preserve original start time
    return childLogger;
  }
}

/**
 * Convenience function to create a logger for API routes
 */
export function createApiLogger(request?: Request): Logger {
  const headers = request?.headers;
  const userAgent = headers?.get('user-agent') || undefined;
  const forwardedFor = headers?.get('x-forwarded-for') || undefined;
  const realIp = headers?.get('x-real-ip') || undefined;
  const ipAddress = forwardedFor || realIp || undefined;

  const context: LogContext = {
    userAgent,
    ipAddress,
  };

  return Logger.create(undefined, context);
}

/**
 * Convenience function to create a logger with user context
 */
export function createUserLogger(userId: string, email?: string, sessionId?: string): Logger {
  const context: LogContext = {
    userId,
    email,
    sessionId,
  };

  return Logger.create(undefined, context);
}

export default Logger;