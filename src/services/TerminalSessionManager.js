/**
 * Terminal Session Manager following Single Responsibility Principle
 * Responsible only for managing terminal sessions and Docker stream processing
 */
export class TerminalSessionManager {
    constructor(logger) {
        this.logger = logger;
        this.sessions = new Map();
    }

    /**
     * Create a new terminal session
     * @param {Object} container - Docker container instance
     * @param {Object} ws - WebSocket instance
     */
    async createSession(container, ws) {
        try {
            this.logger.info(`Creating terminal session for container: ${container.id}`);

            const { exec, stream } = await this.createTerminalExec(container);
            
            // Store session information
            const sessionId = this.generateSessionId();
            this.sessions.set(sessionId, {
                container,
                exec,
                stream,
                ws,
                sessionId
            });

            // Setup stream processing
            this.setupStreamProcessing(stream, ws);
            
            // Setup WebSocket event handlers
            this.setupWebSocketHandlers(ws, stream, sessionId);

            this.logger.info(`Terminal session created: ${sessionId}`);
        } catch (error) {
            this.logger.error('Failed to create terminal session:', error);
            throw error;
        }
    }

    /**
     * Create terminal exec in container
     * @param {Object} container - Docker container instance
     * @returns {Promise<Object>} Exec instance with stream
     */
    async createTerminalExec(container) {
        return new Promise((resolve, reject) => {
            container.exec({
                Cmd: ['/bin/bash'],
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                User: 'sandbox'
            }, (err, exec) => {
                if (err) {
                    this.logger.error('Failed to create exec:', err);
                    reject(err);
                    return;
                }

                exec.start({ hijack: true }, (err, stream) => {
                    if (err) {
                        this.logger.error('Failed to start exec:', err);
                        reject(err);
                    } else {
                        this.logger.info('Docker exec stream started successfully');
                        resolve({ exec, stream });
                    }
                });
            });
        });
    }

    /**
     * Setup stream processing for Docker output
     * @param {Object} stream - Docker stream
     * @param {Object} ws - WebSocket instance
     */
    setupStreamProcessing(stream, ws) {
        const processor = new DockerStreamProcessor(this.logger);
        processor.processStream(stream, ws);
    }

    /**
     * Setup WebSocket event handlers
     * @param {Object} ws - WebSocket instance
     * @param {Object} stream - Docker stream
     * @param {string} sessionId - Session identifier
     */
    setupWebSocketHandlers(ws, stream, sessionId) {
        // Handle incoming messages from client
        ws.on('message', (data) => {
            try {
                if (data === 'getPort') {
                    this.handleGetPortRequest(ws, sessionId);
                    return;
                }
                stream.write(data);
            } catch (error) {
                this.logger.error('Error handling WebSocket message:', error);
            }
        });

        // Handle WebSocket close
        ws.on('close', () => {
            this.logger.info(`Terminal WebSocket closed for session: ${sessionId}`);
            this.cleanupSession(sessionId);
        });

        // Handle WebSocket errors
        ws.on('error', (error) => {
            this.logger.error(`Terminal WebSocket error for session ${sessionId}:`, error);
            this.cleanupSession(sessionId);
        });
    }

    /**
     * Handle get port request
     * @param {Object} ws - WebSocket instance
     * @param {string} sessionId - Session identifier
     */
    async handleGetPortRequest(ws, sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) {
                this.logger.warn(`Session not found: ${sessionId}`);
                return;
            }

            const containerInfo = await session.container.inspect();
            const portBindings = containerInfo.NetworkSettings?.Ports;
            
            if (portBindings && portBindings['5173/tcp']) {
                const port = portBindings['5173/tcp'][0].HostPort;
                this.logger.info(`Container port info: ${port}`);
            }
        } catch (error) {
            this.logger.error('Error getting container port:', error);
        }
    }

    /**
     * Cleanup session resources
     * @param {string} sessionId - Session identifier
     */
    cleanupSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            if (session.stream) {
                session.stream.end();
            }
            this.sessions.delete(sessionId);
            this.logger.info(`Cleaned up terminal session: ${sessionId}`);
        }
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get active sessions count
     * @returns {number} Number of active sessions
     */
    getActiveSessionsCount() {
        return this.sessions.size;
    }

    /**
     * Get all active session IDs
     * @returns {Array<string>} List of session IDs
     */
    getActiveSessionIds() {
        return Array.from(this.sessions.keys());
    }
}

/**
 * Docker Stream Processor following Single Responsibility Principle
 * Responsible only for processing Docker stream data
 */
class DockerStreamProcessor {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Process Docker stream output
     * @param {Object} stream - Docker stream
     * @param {Object} ws - WebSocket instance
     */
    processStream(stream, ws) {
        let nextDataType = null;
        let nextDataLength = null;
        let buffer = Buffer.from('');

        const processStreamData = (data) => {
            try {
                if (data) {
                    buffer = Buffer.concat([buffer, data]);
                }

                if (!nextDataType) {
                    if (buffer.length >= 8) {
                        const header = this.bufferSlicer(buffer, 8);
                        nextDataType = header.readUInt32BE(0);
                        nextDataLength = header.readUInt32BE(4);
                        processStreamData();
                    }
                } else {
                    if (buffer.length >= nextDataLength) {
                        const content = this.bufferSlicer(buffer, nextDataLength);
                        
                        if (ws.readyState === ws.OPEN) {
                            ws.send(content);
                        }
                        
                        nextDataType = null;
                        nextDataLength = null;
                        processStreamData();
                    }
                }
            } catch (error) {
                this.logger.error('Error processing stream data:', error);
            }
        };

        this.bufferSlicer = (buffer, end) => {
            const output = buffer.slice(0, end);
            buffer = Buffer.from(buffer.slice(end, buffer.length));
            return output;
        };

        stream.on('data', processStreamData);
        
        stream.on('error', (error) => {
            this.logger.error('Docker stream error:', error);
        });
        
        stream.on('end', () => {
            this.logger.info('Docker stream ended');
        });
    }
}
