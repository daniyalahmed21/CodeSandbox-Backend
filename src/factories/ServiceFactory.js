import { DockerService } from '../services/DockerService.js';
import { FileSystemService } from '../services/FileSystemService.js';
import { ProjectService } from '../services/ProjectService.js';
import { EditorWebSocketManager } from '../websocket/EditorWebSocketManager.js';
import { TerminalWebSocketManager } from '../websocket/TerminalWebSocketManager.js';
import { ApiRouter } from '../routes/ApiRouter.js';

/**
 * Service Factory following Factory Pattern
 * Responsible for creating and configuring service instances
 */
export class ServiceFactory {
    /**
     * Create Docker Service
     * @param {Container} container - Dependency injection container
     * @returns {DockerService} Docker service instance
     */
    static createDockerService(container) {
        const config = container.get('config');
        const logger = container.get('logger');
        return new DockerService(config, logger);
    }

    /**
     * Create File System Service
     * @param {Container} container - Dependency injection container
     * @returns {FileSystemService} File system service instance
     */
    static createFileSystemService(container) {
        const config = container.get('config');
        const logger = container.get('logger');
        return new FileSystemService(config, logger);
    }

    /**
     * Create Project Service
     * @param {Container} container - Dependency injection container
     * @returns {ProjectService} Project service instance
     */
    static createProjectService(container) {
        const config = container.get('config');
        const logger = container.get('logger');
        const fileSystemService = container.get('fileSystemService');
        const dockerService = container.get('dockerService');
        return new ProjectService(config, logger, fileSystemService, dockerService);
    }

    /**
     * Create Editor WebSocket Manager
     * @param {Container} container - Dependency injection container
     * @returns {EditorWebSocketManager} Editor WebSocket manager instance
     */
    static createEditorWebSocketManager(container) {
        return new EditorWebSocketManager(container);
    }

    /**
     * Create Terminal WebSocket Manager
     * @param {Container} container - Dependency injection container
     * @returns {TerminalWebSocketManager} Terminal WebSocket manager instance
     */
    static createTerminalWebSocketManager(container) {
        return new TerminalWebSocketManager(container);
    }

    /**
     * Create API Router
     * @param {Container} container - Dependency injection container
     * @returns {ApiRouter} API router instance
     */
    static createApiRouter(container) {
        return new ApiRouter(container);
    }
}
