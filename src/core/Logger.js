/**
 * Logger service following Single Responsibility Principle
 * Responsible only for logging functionality
 */
export class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Log error message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    error(message, data = null) {
        this.log('error', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * Log info message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    info(message, data = null) {
        this.log('info', message, data);
    }

    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }

    /**
     * Internal logging method
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    log(level, message, data = null) {
        if (this.levels[level] <= this.levels[this.logLevel]) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                message,
                ...(data && { data })
            };

            console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
        }
    }
}
