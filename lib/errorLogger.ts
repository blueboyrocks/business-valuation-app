interface ErrorLog {
  timestamp: Date;
  error: Error | string;
  context: string;
  userId?: string;
  additionalData?: Record<string, any>;
  stackTrace?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(
    error: Error | string,
    context: string,
    userId?: string,
    additionalData?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      error,
      context,
      userId,
      additionalData,
      stackTrace: error instanceof Error ? error.stack : undefined,
    };

    this.logs.unshift(errorLog);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    console.error(`[${context}]`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      additionalData,
    });

    if (typeof window !== 'undefined') {
      try {
        const existingLogs = localStorage.getItem('error_logs');
        const storedLogs = existingLogs ? JSON.parse(existingLogs) : [];
        storedLogs.unshift({
          ...errorLog,
          timestamp: errorLog.timestamp.toISOString(),
          error: error instanceof Error ? error.message : error,
        });

        if (storedLogs.length > this.maxLogs) {
          storedLogs.length = this.maxLogs;
        }

        localStorage.setItem('error_logs', JSON.stringify(storedLogs));
      } catch (e) {
        console.warn('Failed to store error log in localStorage:', e);
      }
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getStoredLogs(): ErrorLog[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const storedLogs = localStorage.getItem('error_logs');
      if (!storedLogs) {
        return [];
      }

      const parsed = JSON.parse(storedLogs);
      return parsed.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (e) {
      console.warn('Failed to retrieve error logs from localStorage:', e);
      return [];
    }
  }

  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('error_logs');
      } catch (e) {
        console.warn('Failed to clear error logs from localStorage:', e);
      }
    }
  }

  exportLogs(): string {
    const allLogs = [...this.logs, ...this.getStoredLogs()];
    return JSON.stringify(allLogs, null, 2);
  }
}

export const errorLogger = new ErrorLogger();

export function logError(
  error: Error | string,
  context: string,
  userId?: string,
  additionalData?: Record<string, any>
): void {
  errorLogger.log(error, context, userId, additionalData);
}

export function getErrorLogs(): ErrorLog[] {
  return errorLogger.getLogs();
}

export function getStoredErrorLogs(): ErrorLog[] {
  return errorLogger.getStoredLogs();
}

export function clearErrorLogs(): void {
  errorLogger.clearLogs();
}

export function exportErrorLogs(): string {
  return errorLogger.exportLogs();
}
