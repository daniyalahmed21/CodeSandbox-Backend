import { Server } from 'socket.io';
import chokidar from 'chokidar';
import { FileWatcherService } from '../services/FileWatcherService.js';

/**
 * Editor WebSocket Manager following Single Responsibility Principle
 * Responsible only for editor WebSocket connections and file watching
 */
export class EditorWebSocketManager {
    constructor(container) {
        this.container = container;
        this.logger = container.get('logger');
        this.config = container.get('config');
        this.fileSystemService = container.get('fileSystemService');
        this.fileWatcherService = new FileWatcherService(this.config, this.logger);
        this.io = null;
        this.namespace = null;
    }

    /**
     * Initialize the editor WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        this.io = new Server(server, {
            cors: this.config.get('cors')
        });

        this.namespace = this.io.of(this.config.get('websocket.editor.namespace'));
        this.namespace.on('connection', this.handleConnection.bind(this));

        this.logger.info('Editor WebSocket server initialized');
    }

    /**
     * Handle new editor WebSocket connection
     * @param {Object} socket - Socket.IO socket instance
     */
    handleConnection(socket) {
        this.logger.info('Editor WebSocket connection established');

        const projectId = socket.handshake.query.projectId;
        
        if (!projectId) {
            this.logger.warn('Editor connection without project ID');
            socket.emit('error', { message: 'Project ID required' });
            socket.disconnect();
            return;
        }

        this.logger.info(`Editor connected for project: ${projectId}`);

        // Setup file watcher for the project
        this.setupFileWatcher(projectId, socket);

        // Register socket event handlers
        this.registerEventHandlers(socket, projectId);

        // Handle disconnection
        socket.on('disconnect', () => {
            this.logger.info(`Editor disconnected for project: ${projectId}`);
            this.fileWatcherService.stopWatching(projectId);
        });
    }

    /**
     * Setup file watcher for a project
     * @param {string} projectId - Project identifier
     * @param {Object} socket - Socket instance
     */
    setupFileWatcher(projectId, socket) {
        const projectPath = this.fileSystemService.getSandboxPath(projectId);
        
        this.fileWatcherService.startWatching(projectId, projectPath, (event, filePath) => {
            this.logger.debug(`File change detected: ${event} - ${filePath}`);
            socket.emit('fileChange', { event, path: filePath });
        });
    }

    /**
     * Register event handlers for socket events
     * @param {Object} socket - Socket instance
     * @param {string} projectId - Project identifier
     */
    registerEventHandlers(socket, projectId) {
        // File operations
        socket.on('writeFile', this.handleWriteFile.bind(this, socket, projectId));
        socket.on('readFile', this.handleReadFile.bind(this, socket, projectId));
        socket.on('createFile', this.handleCreateFile.bind(this, socket, projectId));
        socket.on('deleteFile', this.handleDeleteFile.bind(this, socket, projectId));
        socket.on('createFolder', this.handleCreateFolder.bind(this, socket, projectId));
        socket.on('deleteFolder', this.handleDeleteFolder.bind(this, socket, projectId));
        
        // Container operations
        socket.on('getPort', this.handleGetPort.bind(this, socket, projectId));
    }

    /**
     * Handle write file request
     */
    async handleWriteFile(socket, projectId, { data, pathToFileOrFolder }) {
        try {
            await this.fileSystemService.writeFile(pathToFileOrFolder, data);
            socket.emit('writeFileSuccess', {
                message: 'File written successfully',
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Write file error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle read file request
     */
    async handleReadFile(socket, projectId, { pathToFileOrFolder }) {
        try {
            const content = await this.fileSystemService.readFile(pathToFileOrFolder);
            socket.emit('readFileSuccess', {
                content,
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Read file error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle create file request
     */
    async handleCreateFile(socket, projectId, { pathToFileOrFolder }) {
        try {
            await this.fileSystemService.createFile(pathToFileOrFolder);
            socket.emit('createFileSuccess', {
                message: 'File created successfully',
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Create file error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle delete file request
     */
    async handleDeleteFile(socket, projectId, { pathToFileOrFolder }) {
        try {
            await this.fileSystemService.deleteFile(pathToFileOrFolder);
            socket.emit('deleteFileSuccess', {
                message: 'File deleted successfully',
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Delete file error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle create folder request
     */
    async handleCreateFolder(socket, projectId, { pathToFileOrFolder }) {
        try {
            await this.fileSystemService.createDirectory(pathToFileOrFolder);
            socket.emit('createFolderSuccess', {
                message: 'Folder created successfully',
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Create folder error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle delete folder request
     */
    async handleDeleteFolder(socket, projectId, { pathToFileOrFolder }) {
        try {
            await this.fileSystemService.deleteDirectory(pathToFileOrFolder);
            socket.emit('deleteFolderSuccess', {
                message: 'Folder deleted successfully',
                path: pathToFileOrFolder
            });
        } catch (error) {
            this.logger.error('Delete folder error:', error);
            socket.emit('error', { message: error.message });
        }
    }

    /**
     * Handle get port request
     */
    async handleGetPort(socket, projectId, { containerName }) {
        try {
            const dockerService = this.container.get('dockerService');
            const port = await dockerService.getContainerPort(containerName);
            
            socket.emit('getPortSuccess', {
                port,
                containerName
            });
        } catch (error) {
            this.logger.error('Get port error:', error);
            socket.emit('error', { message: error.message });
        }
    }
}
