import express from 'express';
import { ProjectController } from '../controllers/ProjectController.js';
import { PingController } from '../controllers/PingController.js';

/**
 * API Router following Single Responsibility Principle
 * Responsible only for API route configuration
 */
export class ApiRouter {
    constructor(container) {
        this.container = container;
        this.logger = container.get('logger');
        this.router = express.Router();
        this.setupRoutes();
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Controllers
        const projectController = new ProjectController(this.container);
        const pingController = new PingController(this.container);

        // Health check routes
        this.router.get('/ping', pingController.ping.bind(pingController));
        this.router.get('/health', pingController.health.bind(pingController));

        // V1 API routes (matching frontend expectations)
        this.router.get('/v1/projects', projectController.listProjects.bind(projectController));
        this.router.post('/v1/projects', projectController.createProject.bind(projectController));
        this.router.get('/v1/projects/:id', projectController.getProject.bind(projectController));
        this.router.delete('/v1/projects/:id', projectController.deleteProject.bind(projectController));
        this.router.get('/v1/projects/:id/tree', projectController.getProjectTree.bind(projectController));

        // Legacy routes (for backward compatibility)
        this.router.get('/projects', projectController.listProjects.bind(projectController));
        this.router.post('/projects', projectController.createProject.bind(projectController));
        this.router.get('/projects/:id', projectController.getProject.bind(projectController));
        this.router.delete('/projects/:id', projectController.deleteProject.bind(projectController));

        this.logger.info('API routes configured');
    }

    /**
     * Get Express router instance
     * @returns {Object} Express router
     */
    getRouter() {
        return this.router;
    }
}
