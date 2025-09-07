import { Application } from './core/Application.js';

/**
 * Main application entry point
 * Following Single Responsibility Principle - responsible only for application startup
 */
async function main() {
    try {
        // Create and initialize application
        const app = new Application();
        
        // Initialize the application (includes service registration)
        await app.initialize();
        
        // Start the server
        await app.start();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            await app.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            await app.shutdown();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
main();
