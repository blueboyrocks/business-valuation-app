/**
 * Extraction Audit Logger
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Logs every extraction step with traceability for debugging.
 * Uses structured JSON format for easy parsing and analysis.
 *
 * Log format:
 * {
 *   timestamp: ISO string
 *   level: 'info' | 'warn' | 'error'
 *   stage: 'stage1' | 'stage2' | 'stage3' | 'pipeline'
 *   event: string
 *   document_id: string
 *   report_id?: string
 *   duration_ms?: number
 *   model?: string
 *   input_size?: number
 *   output_size?: number
 *   metadata?: object
 * }
 */

/**
 * Log levels
 */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Extraction stages
 */
export type ExtractionStage = 'stage1' | 'stage2' | 'stage3' | 'pipeline' | 'validation';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  level: LogLevel;
  stage: ExtractionStage;
  event: string;
  document_id: string;
  report_id?: string;
  duration_ms?: number;
  model?: string;
  input_size?: number;
  output_size?: number;
  retry_count?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel?: LogLevel;

  /** Whether to include metadata in logs */
  includeMetadata?: boolean;

  /** Custom log handler (defaults to console.log) */
  handler?: (entry: AuditLogEntry) => void;

  /** Report ID for correlation */
  reportId?: string;
}

/**
 * Default log handler - outputs to console
 */
function defaultLogHandler(entry: AuditLogEntry): void {
  const prefix = `[Extraction:${entry.stage}]`;
  const levelTag = entry.level === 'error' ? 'ERROR' : entry.level === 'warn' ? 'WARN' : 'INFO';

  // Build log message
  const parts: string[] = [
    prefix,
    `[${levelTag}]`,
    entry.event,
  ];

  if (entry.document_id) {
    parts.push(`doc=${entry.document_id}`);
  }

  if (entry.duration_ms !== undefined) {
    parts.push(`time=${entry.duration_ms}ms`);
  }

  if (entry.model) {
    parts.push(`model=${entry.model}`);
  }

  if (entry.error_message) {
    parts.push(`error="${entry.error_message}"`);
  }

  // Output based on level
  const message = parts.join(' ');
  switch (entry.level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    default:
      console.log(message);
  }

  // Output full JSON for debugging
  if (process.env.NODE_ENV === 'development' || process.env.EXTRACTION_DEBUG === 'true') {
    console.log(JSON.stringify(entry, null, 2));
  }
}

/**
 * Log level priority (higher = more important)
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

/**
 * Extraction audit logger
 */
export class ExtractionAuditLogger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel ?? 'info',
      includeMetadata: config.includeMetadata ?? true,
      handler: config.handler ?? defaultLogHandler,
      reportId: config.reportId ?? '',
    };
  }

  /**
   * Log an extraction step
   */
  log(
    level: LogLevel,
    stage: ExtractionStage,
    event: string,
    documentId: string,
    details?: Partial<Omit<AuditLogEntry, 'timestamp' | 'level' | 'stage' | 'event' | 'document_id'>>
  ): void {
    // Check log level
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      event,
      document_id: documentId,
      report_id: this.config.reportId || details?.report_id,
      ...details,
    };

    // Remove metadata if not configured
    if (!this.config.includeMetadata) {
      delete entry.metadata;
    }

    this.config.handler(entry);
  }

  /**
   * Convenience method for info logs
   */
  info(
    stage: ExtractionStage,
    event: string,
    documentId: string,
    details?: Partial<Omit<AuditLogEntry, 'timestamp' | 'level' | 'stage' | 'event' | 'document_id'>>
  ): void {
    this.log('info', stage, event, documentId, details);
  }

  /**
   * Convenience method for warning logs
   */
  warn(
    stage: ExtractionStage,
    event: string,
    documentId: string,
    details?: Partial<Omit<AuditLogEntry, 'timestamp' | 'level' | 'stage' | 'event' | 'document_id'>>
  ): void {
    this.log('warn', stage, event, documentId, details);
  }

  /**
   * Convenience method for error logs
   */
  error(
    stage: ExtractionStage,
    event: string,
    documentId: string,
    details?: Partial<Omit<AuditLogEntry, 'timestamp' | 'level' | 'stage' | 'event' | 'document_id'>>
  ): void {
    this.log('error', stage, event, documentId, details);
  }

  /**
   * Log stage start
   */
  stageStart(stage: ExtractionStage, documentId: string, inputSize?: number): void {
    this.info(stage, 'Stage started', documentId, { input_size: inputSize });
  }

  /**
   * Log stage completion
   */
  stageComplete(
    stage: ExtractionStage,
    documentId: string,
    durationMs: number,
    outputSize?: number
  ): void {
    this.info(stage, 'Stage completed', documentId, {
      duration_ms: durationMs,
      output_size: outputSize,
    });
  }

  /**
   * Log stage error
   */
  stageError(
    stage: ExtractionStage,
    documentId: string,
    errorMessage: string,
    durationMs?: number
  ): void {
    this.error(stage, 'Stage failed', documentId, {
      error_message: errorMessage,
      duration_ms: durationMs,
    });
  }

  /**
   * Log retry attempt
   */
  retryAttempt(
    stage: ExtractionStage,
    documentId: string,
    retryCount: number,
    errorMessage: string
  ): void {
    this.warn(stage, 'Retry attempt', documentId, {
      retry_count: retryCount,
      error_message: errorMessage,
    });
  }

  /**
   * Log model used
   */
  modelUsed(
    stage: ExtractionStage,
    documentId: string,
    model: string,
    escalated?: boolean
  ): void {
    this.info(stage, escalated ? 'Escalated to model' : 'Using model', documentId, {
      model,
      metadata: escalated ? { escalated: true } : undefined,
    });
  }

  /**
   * Log validation result
   */
  validationResult(
    documentId: string,
    errorCount: number,
    warningCount: number,
    infoCount: number
  ): void {
    const level: LogLevel = errorCount > 0 ? 'error' : warningCount > 0 ? 'warn' : 'info';
    this.log(level, 'validation', 'Validation completed', documentId, {
      metadata: {
        error_count: errorCount,
        warning_count: warningCount,
        info_count: infoCount,
      },
    });
  }

  /**
   * Log confidence score
   */
  confidenceScore(
    documentId: string,
    score: number,
    recommendation: 'ready' | 'opus_escalation' | 'human_review'
  ): void {
    const level: LogLevel = recommendation === 'human_review' ? 'warn' : 'info';
    this.log(level, 'pipeline', 'Confidence calculated', documentId, {
      metadata: {
        score,
        recommendation,
      },
    });
  }

  /**
   * Log pipeline completion
   */
  pipelineComplete(
    documentId: string,
    totalDurationMs: number,
    success: boolean,
    needsClaudeVision?: boolean
  ): void {
    const level: LogLevel = success ? 'info' : 'error';
    this.log(level, 'pipeline', success ? 'Pipeline completed' : 'Pipeline failed', documentId, {
      duration_ms: totalDurationMs,
      metadata: {
        success,
        needs_claude_vision: needsClaudeVision,
      },
    });
  }

  /**
   * Create a child logger with a specific report ID
   */
  withReportId(reportId: string): ExtractionAuditLogger {
    return new ExtractionAuditLogger({
      ...this.config,
      reportId,
    });
  }
}

/**
 * Global logger instance
 */
let globalLogger: ExtractionAuditLogger | null = null;

/**
 * Get global logger instance
 */
export function getAuditLogger(): ExtractionAuditLogger {
  if (!globalLogger) {
    globalLogger = new ExtractionAuditLogger();
  }
  return globalLogger;
}

/**
 * Configure global logger
 */
export function configureAuditLogger(config: LoggerConfig): void {
  globalLogger = new ExtractionAuditLogger(config);
}

/**
 * Convenience function for logging extraction steps
 */
export function logExtractionStep(
  stage: ExtractionStage,
  event: string,
  documentId: string,
  details?: Partial<Omit<AuditLogEntry, 'timestamp' | 'level' | 'stage' | 'event' | 'document_id'>>
): void {
  getAuditLogger().info(stage, event, documentId, details);
}
