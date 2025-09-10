import uuid4 from "uuid4";
import fs from 'fs/promises';
import path from 'path';
import directoryTree from "directory-tree";
import { REACT_PROJECT_COMMAND } from '../config/serverConfig.js';
import { exec } from "child_process";
import { fileURLToPath } from 'url';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a fixed projects directory outside src
const PROJECTS_DIR = path.resolve(__dirname, "../../projects");

// Promisified exec with logging
const execPromisified = (command, options = {}) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (err, stdout, stderr) => {
            console.log("STDOUT:", stdout);
            console.error("STDERR:", stderr);
            if (err) return reject(err);
            resolve(stdout);
        });
    });
};

export const createProjectService = async () => {
    try {
        // Ensure projects folder exists
        await fs.mkdir(PROJECTS_DIR, { recursive: true });
        console.log("Projects directory is ready at", PROJECTS_DIR);
        // Create unique project folder
        const projectId = uuid4();
        const projectPath = path.join(PROJECTS_DIR, projectId);
        await fs.mkdir(projectPath);
        console.log("Project directory created at", projectPath);

        // Build non-interactive Vite command
        const command = `${REACT_PROJECT_COMMAND} --yes`;

        // Execute the command in the project folder
        await execPromisified(command, { cwd: projectPath });

        return projectId;
    } catch (error) {
        console.error("Error creating project:", error.message);
        throw new Error("Failed to create project");
    }
};

export const getProjectTreeService = async (projectId) => {
    const projectPath = path.join(PROJECTS_DIR, projectId);
    const tree = directoryTree(projectPath);
    return tree;
};
