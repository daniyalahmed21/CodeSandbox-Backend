import chokidar from 'chokidar';

/**
 * File Watcher Service following Single Responsibility Principle
 * Responsible only for file system watching
 */
export class FileWatcherService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.watchers = new Map();
    }

    /**
     * Start watching a directory for changes
     * @param {string} projectId - Project identifier
     * @param {string} watchPath - Path to watch
     * @param {Function} onChange - Callback function for changes
     */
    startWatching(projectId, watchPath, onChange) {
        // Stop existing watcher if any
        this.stopWatching(projectId);

        const watcherConfig = this.config.get('fileWatcher');
        
        const watcher = chokidar.watch(watchPath, {
            ignored: (path) => {
                return watcherConfig.ignored.some(pattern => path.includes(pattern));
            },
            persistent: watcherConfig.persistent,
            awaitWriteFinish: {
                stabilityThreshold: watcherConfig.stabilityThreshold
            },
            ignoreInitial: watcherConfig.ignoreInitial
        });

        watcher.on('all', (event, path) => {
            this.logger.debug(`File change detected: ${event} - ${path}`);
            onChange(event, path);
        });

        watcher.on('error', (error) => {
            this.logger.error(`File watcher error for project ${projectId}:`, error);
        });

        this.watchers.set(projectId, watcher);
        this.logger.info(`Started file watching for project: ${projectId}`);
    }

    /**
     * Stop watching a project
     * @param {string} projectId - Project identifier
     */
    stopWatching(projectId) {
        const watcher = this.watchers.get(projectId);
        if (watcher) {
            watcher.close();
            this.watchers.delete(projectId);
            this.logger.info(`Stopped file watching for project: ${projectId}`);
        }
    }

    /**
     * Stop all watchers
     */
    stopAllWatchers() {
        for (const [projectId, watcher] of this.watchers) {
            watcher.close();
            this.logger.info(`Stopped file watching for project: ${projectId}`);
        }
        this.watchers.clear();
    }

    /**
     * Get list of watched projects
     * @returns {Array<string>} List of project IDs being watched
     */
    getWatchedProjects() {
        return Array.from(this.watchers.keys());
    }
}
