import { WebSocketServer } from 'ws';
import { TerminalSessionManager } from '../services/TerminalSessionManager.js';

/**
 * Terminal WebSocket Manager following Single Responsibility Principle
 * Responsible only for terminal WebSocket connections
 */
export class TerminalWebSocketManager {
    constructor(container) {
        this.container = container;
        this.logger = container.get('logger');
        this.config = container.get('config');
        this.dockerService = container.get('dockerService');
        this.terminalSessionManager = new TerminalSessionManager(this.logger);
        this.wss = null;
    }

    /**
     * Initialize the terminal WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        this.wss = new WebSocketServer({
            server,
            path: this.config.get('websocket.terminal.path')
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.logger.info('Terminal WebSocket server initialized');
    }

    /**
     * Handle new terminal WebSocket connection
     * @param {Object} ws - WebSocket instance
     * @param {Object} req - HTTP request
     */
    async handleConnection(ws, req) {
        this.logger.info('Terminal WebSocket connection established');

        try {
            const projectId = this.extractProjectId(req);
            
            if (!projectId) {
                this.logger.warn('Terminal connection without project ID');
                ws.close(1008, 'Project ID required');
                return;
            }

            this.logger.info(`Terminal connected for project: ${projectId}`);

            // Create container for the project
            const container = await this.dockerService.createContainer(projectId);
            
            if (!container) {
                this.logger.error(`Failed to create container for project: ${projectId}`);
                ws.close(1011, 'Failed to create container');
                return;
            }

            // Create terminal session
            await this.terminalSessionManager.createSession(container, ws);

        } catch (error) {
            this.logger.error('Terminal WebSocket connection error:', error);
            ws.close(1011, 'Internal server error');
        }
    }

    /**
     * Extract project ID from request URL
     * @param {Object} req - HTTP request
     * @returns {string|null} Project ID or null
     */
    extractProjectId(req) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            return url.searchParams.get('projectId');
        } catch (error) {
            this.logger.error('Failed to extract project ID from request:', error);
            return null;
        }
    }
}
