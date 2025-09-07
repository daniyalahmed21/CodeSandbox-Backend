/**
 * Ping Controller following Single Responsibility Principle
 * Responsible only for handling health check requests
 */
export class PingController {
    constructor(container) {
        this.container = container;
        this.logger = container.get('logger');
    }

    /**
     * Simple ping endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    ping(req, res) {
        res.json({
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }

    /**
     * Health check endpoint with system information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    health(req, res) {
        const healthInfo = {
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            platform: process.platform,
            arch: process.arch
        };

        res.json(healthInfo);
    }
}