import fs from 'fs/promises';
import path from 'path';

/**
 * File System Service following Single Responsibility Principle
 * Responsible only for file system operations
 */
export class FileSystemService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    /**
     * Write content to a file
     * @param {string} filePath - Path to the file
     * @param {string} content - Content to write
     * @returns {Promise<void>}
     */
    async writeFile(filePath, content) {
        try {
            await fs.writeFile(filePath, content, 'utf8');
            this.logger.debug(`File written successfully: ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to write file ${filePath}:`, error);
            throw new Error(`File write failed: ${error.message}`);
        }
    }

    /**
     * Read content from a file
     * @param {string} filePath - Path to the file
     * @returns {Promise<string>} File content
     */
    async readFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            this.logger.debug(`File read successfully: ${filePath}`);
            return content;
        } catch (error) {
            this.logger.error(`Failed to read file ${filePath}:`, error);
            throw new Error(`File read failed: ${error.message}`);
        }
    }

    /**
     * Create a new file
     * @param {string} filePath - Path to the file
     * @returns {Promise<void>}
     */
    async createFile(filePath) {
        try {
            // Check if file already exists
            await this.checkFileExists(filePath);
            
            await fs.writeFile(filePath, '', 'utf8');
            this.logger.debug(`File created successfully: ${filePath}`);
        } catch (error) {
            if (error.code === 'EEXIST') {
                throw new Error('File already exists');
            }
            this.logger.error(`Failed to create file ${filePath}:`, error);
            throw new Error(`File creation failed: ${error.message}`);
        }
    }

    /**
     * Delete a file
     * @param {string} filePath - Path to the file
     * @returns {Promise<void>}
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            this.logger.debug(`File deleted successfully: ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${filePath}:`, error);
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    /**
     * Create a directory
     * @param {string} dirPath - Path to the directory
     * @returns {Promise<void>}
     */
    async createDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            this.logger.debug(`Directory created successfully: ${dirPath}`);
        } catch (error) {
            this.logger.error(`Failed to create directory ${dirPath}:`, error);
            throw new Error(`Directory creation failed: ${error.message}`);
        }
    }

    /**
     * Delete a directory
     * @param {string} dirPath - Path to the directory
     * @returns {Promise<void>}
     */
    async deleteDirectory(dirPath) {
        try {
            await fs.rmdir(dirPath, { recursive: true });
            this.logger.debug(`Directory deleted successfully: ${dirPath}`);
        } catch (error) {
            this.logger.error(`Failed to delete directory ${dirPath}:`, error);
            throw new Error(`Directory deletion failed: ${error.message}`);
        }
    }

    /**
     * Check if a file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>}
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if file exists and throw error if it does
     * @param {string} filePath - Path to the file
     * @throws {Error} If file exists
     */
    async checkFileExists(filePath) {
        const exists = await this.fileExists(filePath);
        if (exists) {
            throw new Error('File already exists');
        }
    }

    /**
     * Get file statistics
     * @param {string} filePath - Path to the file
     * @returns {Promise<Object>} File stats
     */
    async getFileStats(filePath) {
        try {
            return await fs.stat(filePath);
        } catch (error) {
            this.logger.error(`Failed to get file stats for ${filePath}:`, error);
            throw new Error(`File stats failed: ${error.message}`);
        }
    }

    /**
     * Read directory contents
     * @param {string} dirPath - Path to the directory
     * @returns {Promise<Array>} Directory contents
     */
    async readDirectory(dirPath) {
        try {
            return await fs.readdir(dirPath);
        } catch (error) {
            this.logger.error(`Failed to read directory ${dirPath}:`, error);
            throw new Error(`Directory read failed: ${error.message}`);
        }
    }

    /**
     * Get project directory path
     * @param {string} projectId - Project identifier
     * @returns {string} Project directory path
     */
    getProjectPath(projectId) {
        const basePath = this.config.get('projects.basePath');
        return path.join(process.cwd(), basePath, projectId);
    }

    /**
     * Get sandbox directory path within project
     * @param {string} projectId - Project identifier
     * @returns {string} Sandbox directory path
     */
    getSandboxPath(projectId) {
        return path.join(this.getProjectPath(projectId), 'sandbox');
    }
}
