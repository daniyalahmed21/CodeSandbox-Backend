import Docker from 'dockerode';

/**
 * Docker Service following Single Responsibility Principle
 * Responsible only for Docker container operations
 */
export class DockerService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.docker = new Docker({
            socketPath: config.get('docker.socketPath')
        });
    }

    /**
     * Create a new container for a project
     * @param {string} projectId - Project identifier
     * @returns {Promise<Object>} Docker container instance
     */
    async createContainer(projectId) {
        try {
            this.logger.info(`Creating container for project: ${projectId}`);

            // Remove existing container if it exists
            await this.removeExistingContainer(projectId);

            const containerConfig = this.buildContainerConfig(projectId);
            const container = await this.docker.createContainer(containerConfig);
            
            await container.start();
            
            this.logger.info(`Container created and started: ${container.id}`);
            return container;
        } catch (error) {
            this.logger.error(`Failed to create container for project ${projectId}:`, error);
            throw new Error(`Container creation failed: ${error.message}`);
        }
    }

    /**
     * Remove existing container with the same name
     * @param {string} projectId - Project identifier
     */
    async removeExistingContainer(projectId) {
        try {
            const existingContainers = await this.docker.listContainers({
                all: true,
                filters: { name: [projectId] }
            });

            if (existingContainers.length > 0) {
                this.logger.info(`Removing existing container: ${projectId}`);
                const container = this.docker.getContainer(existingContainers[0].Id);
                await container.remove({ force: true });
            }
        } catch (error) {
            this.logger.warn(`Error removing existing container ${projectId}:`, error);
        }
    }

    /**
     * Build container configuration
     * @param {string} projectId - Project identifier
     * @returns {Object} Container configuration
     */
    buildContainerConfig(projectId) {
        const projectsPath = this.config.get('projects.basePath');
        const dockerConfig = this.config.get('docker');

        return {
            Image: dockerConfig.defaultImage,
            name: projectId,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/bash'],
            User: dockerConfig.defaultUser,
            WorkingDir: '/home/sandbox/app',
            Env: ['HOST=0.0.0.0'],
            ExposedPorts: {
                [`${dockerConfig.defaultPort}/tcp`]: {}
            },
            Volumes: {
                '/home/sandbox/app': {}
            },
            HostConfig: {
                Binds: [
                    `${process.cwd()}/${projectsPath}/${projectId}:/home/sandbox/app`
                ],
                PortBindings: {
                    [`${dockerConfig.defaultPort}/tcp`]: [
                        { HostPort: '0' } // Random port assignment
                    ]
                }
            }
        };
    }

    /**
     * Get container port mapping
     * @param {string} containerName - Container name
     * @returns {Promise<string|null>} Host port or null if not found
     */
    async getContainerPort(containerName) {
        try {
            const containers = await this.docker.listContainers({
                filters: { name: [containerName] }
            });

            if (containers.length === 0) {
                return null;
            }

            const container = this.docker.getContainer(containers[0].Id);
            const containerInfo = await container.inspect();
            
            const portBindings = containerInfo.NetworkSettings?.Ports;
            const defaultPort = this.config.get('docker.defaultPort');
            
            if (portBindings && portBindings[`${defaultPort}/tcp`]) {
                return portBindings[`${defaultPort}/tcp`][0].HostPort;
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to get container port for ${containerName}:`, error);
            return null;
        }
    }

    /**
     * Create a terminal session in a container
     * @param {Object} container - Docker container instance
     * @returns {Promise<Object>} Exec instance with stream
     */
    async createTerminalSession(container) {
        try {
            const exec = await container.exec({
                Cmd: ['/bin/bash'],
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                User: this.config.get('docker.defaultUser')
            });

            return new Promise((resolve, reject) => {
                exec.start({ hijack: true }, (err, stream) => {
                    if (err) {
                        this.logger.error('Failed to start terminal session:', err);
                        reject(err);
                    } else {
                        this.logger.info('Terminal session started successfully');
                        resolve({ exec, stream });
                    }
                });
            });
        } catch (error) {
            this.logger.error('Failed to create terminal session:', error);
            throw error;
        }
    }

    /**
     * List all containers
     * @returns {Promise<Array>} List of containers
     */
    async listContainers() {
        try {
            return await this.docker.listContainers();
        } catch (error) {
            this.logger.error('Failed to list containers:', error);
            throw error;
        }
    }
}
