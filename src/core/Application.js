import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import { Container } from './Container.js';
import { Logger } from './Logger.js';
import { ConfigManager } from './ConfigManager.js';
import { ServiceFactory } from '../factories/ServiceFactory.js';

/**
 * Main Application class following Single Responsibility Principle
 * Responsible only for application initialization and orchestration
 */
export class Application {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.container = new Container();
        this.logger = new Logger();
        this.config = new ConfigManager();
    }

    /**
     * Initialize the application with proper dependency injection
     */
    async initialize() {
        try {
            // Register core services first
            this.registerCoreServices();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Register business services
            this.registerBusinessServices();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup WebSocket servers
            this.setupWebSocketServers();
            
            this.logger.info('Application initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors(this.config.get('cors')));
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        const apiRouter = this.container.get('apiRouter');
        this.app.use('/api', apiRouter.getRouter());
        
        // Health check endpoint
        this.app.get('/ping', (req, res) => {
            res.json({ message: 'pong', timestamp: new Date().toISOString() });
        });
    }

    /**
     * Setup WebSocket servers with proper abstraction
     */
    setupWebSocketServers() {
        // Editor WebSocket (Socket.IO)
        const editorWebSocketManager = this.container.get('editorWebSocketManager');
        editorWebSocketManager.initialize(this.server);

        // Terminal WebSocket (Native WebSocket)
        const terminalWebSocketManager = this.container.get('terminalWebSocketManager');
        terminalWebSocketManager.initialize(this.server);
    }

    /**
     * Register core services in the dependency injection container
     */
    registerCoreServices() {
        // Core services - register instances directly
        this.container.register('logger', this.logger);
        this.container.register('config', this.config);
    }

    /**
     * Register business services in the dependency injection container
     */
    registerBusinessServices() {
        // Register service factories
        this.container.registerFactory('dockerService', (container) => 
            ServiceFactory.createDockerService(container)
        );

        this.container.registerFactory('fileSystemService', (container) => 
            ServiceFactory.createFileSystemService(container)
        );

        this.container.registerFactory('projectService', (container) => 
            ServiceFactory.createProjectService(container)
        );

        this.container.registerFactory('editorWebSocketManager', (container) => 
            ServiceFactory.createEditorWebSocketManager(container)
        );

        this.container.registerFactory('terminalWebSocketManager', (container) => 
            ServiceFactory.createTerminalWebSocketManager(container)
        );

        this.container.registerFactory('apiRouter', (container) => 
            ServiceFactory.createApiRouter(container)
        );
    }

    /**
     * Start the server
     */
    async start() {
        const port = this.config.get('server.port');
        
        return new Promise((resolve, reject) => {
            this.server.listen(port, (error) => {
                if (error) {
                    this.logger.error('Failed to start server:', error);
                    reject(error);
                } else {
                    this.logger.info(`Server is running on port ${port}`);
                    this.logger.info(`Working directory: ${process.cwd()}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info('Shutting down application...');
        
        return new Promise((resolve) => {
            this.server.close(() => {
                this.logger.info('Server closed');
                resolve();
            });
        });
    }
}
