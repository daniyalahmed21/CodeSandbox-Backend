import dotenv from 'dotenv';

/**
 * Configuration Manager following Single Responsibility Principle
 * Responsible only for configuration management
 */
export class ConfigManager {
    constructor() {
        dotenv.config();
        this.config = this.loadConfiguration();
    }

    /**
     * Load configuration from environment variables and defaults
     * @returns {Object} Configuration object
     */
    loadConfiguration() {
        return {
            server: {
                port: process.env.PORT || 3000,
                host: process.env.HOST || 'localhost'
            },
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                credentials: true
            },
            docker: {
                socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
                defaultImage: process.env.DOCKER_DEFAULT_IMAGE || 'sandbox',
                defaultUser: process.env.DOCKER_DEFAULT_USER || 'sandbox',
                defaultPort: process.env.DOCKER_DEFAULT_PORT || 5173
            },
            projects: {
                basePath: process.env.PROJECTS_BASE_PATH || './projects',
                maxProjects: parseInt(process.env.MAX_PROJECTS) || 100
            },
            websocket: {
                editor: {
                    namespace: '/editor',
                    path: '/editor'
                },
                terminal: {
                    path: '/terminal'
                }
            },
            fileWatcher: {
                ignored: ['node_modules', '.git', 'dist', 'build'],
                stabilityThreshold: parseInt(process.env.FILE_WATCHER_STABILITY_THRESHOLD) || 2000,
                persistent: true,
                ignoreInitial: true
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                format: process.env.LOG_FORMAT || 'json'
            }
        };
    }

    /**
     * Get configuration value by key path
     * @param {string} keyPath - Dot notation path to config value
     * @returns {*} Configuration value
     */
    get(keyPath) {
        return this.getNestedValue(this.config, keyPath);
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set configuration value by key path
     * @param {string} keyPath - Dot notation path to config value
     * @param {*} value - Value to set
     */
    set(keyPath, value) {
        this.setNestedValue(this.config, keyPath, value);
    }

    /**
     * Set nested value in object using dot notation
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Get all configuration
     * @returns {Object} Complete configuration object
     */
    getAll() {
        return { ...this.config };
    }
}
