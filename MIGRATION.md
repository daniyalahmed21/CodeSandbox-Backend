# Migration Guide - Old to New Architecture

## Overview
This guide explains how the old architecture has been migrated to the new clean architecture.

## File Mapping

### Old Files → New Files

| Old File | New File | Purpose |
|----------|----------|---------|
| `src/index.js` | `src/main.js` | Application entry point |
| `src/handlers/editorHandler.js` | `src/websocket/EditorWebSocketManager.js` | Editor WebSocket handling |
| `src/socketHandlers/editorHandler.js` | `src/websocket/EditorWebSocketManager.js` | Editor WebSocket handling (duplicate removed) |
| `src/containers/handleContainerCreate.js` | `src/services/DockerService.js` | Docker operations |
| `src/containers/handleTerminalCreation.js` | `src/services/TerminalSessionManager.js` | Terminal session management |
| `src/controllers/pingController.js` | `src/controllers/PingController.js` | Health check (refactored) |
| `src/controllers/projectController.js` | `src/controllers/ProjectController.js` | Project management (refactored) |
| `src/service/projectService.js` | `src/services/ProjectService.js` | Project service (refactored) |
| `src/config/serverConfig.js` | `src/core/ConfigManager.js` | Configuration management |
| `src/terminalApp.js` | Integrated into main application | Terminal WebSocket server |

### New Files Added

| New File | Purpose |
|----------|---------|
| `src/core/Application.js` | Main application orchestration |
| `src/core/Container.js` | Dependency injection container |
| `src/core/Logger.js` | Structured logging service |
| `src/services/FileSystemService.js` | File system operations |
| `src/services/FileWatcherService.js` | File watching service |
| `src/websocket/TerminalWebSocketManager.js` | Terminal WebSocket management |
| `src/routes/ApiRouter.js` | API route configuration |
| `src/factories/ServiceFactory.js` | Service creation factory |
| `src/bootstrap/ServiceRegistry.js` | Service registration |
| `src/controllers/ProjectController.js` | Project HTTP endpoints |
| `src/controllers/PingController.js` | Health check endpoints |

## Key Changes

### 1. Application Structure
**Before:**
```javascript
// src/index.js - Everything mixed together
const app = express();
const server = createServer(app);
// WebSocket setup mixed with Express setup
// File watching mixed with server setup
```

**After:**
```javascript
// src/main.js - Clean entry point
const app = new Application();
await app.initialize();
await app.start();
```

### 2. Dependency Management
**Before:**
```javascript
// Direct imports and instantiation
import { handleContainerCreate } from './containers/handleContainerCreate.js';
const container = await handleContainerCreate(projectId);
```

**After:**
```javascript
// Dependency injection
const dockerService = container.get('dockerService');
const container = await dockerService.createContainer(projectId);
```

### 3. Error Handling
**Before:**
```javascript
// Inconsistent error handling
try {
    // operation
} catch(error) {
    console.log("Error", error);
}
```

**After:**
```javascript
// Structured error handling
try {
    // operation
} catch (error) {
    this.logger.error('Operation failed:', error);
    throw new Error(`Operation failed: ${error.message}`);
}
```

### 4. Configuration
**Before:**
```javascript
// Scattered configuration
const PORT = process.env.PORT || 3000;
const cors = { origin: '*' };
```

**After:**
```javascript
// Centralized configuration
const config = container.get('config');
const port = config.get('server.port');
const corsConfig = config.get('cors');
```

### 5. WebSocket Management
**Before:**
```javascript
// Mixed WebSocket handling in main file
webSocketForTerminal.on("connection", async (ws, req) => {
    // All logic mixed together
});
```

**After:**
```javascript
// Dedicated WebSocket managers
const terminalWebSocketManager = container.get('terminalWebSocketManager');
terminalWebSocketManager.initialize(server);
```

## Benefits Achieved

### 1. Single Responsibility Principle
- Each class has one clear responsibility
- Easy to understand and maintain
- Changes are isolated to specific components

### 2. Dependency Injection
- Services are loosely coupled
- Easy to test with mocks
- Configuration is centralized

### 3. Error Handling
- Consistent error handling across the application
- Structured logging for debugging
- Proper error propagation

### 4. Configuration Management
- Environment-based configuration
- Centralized configuration access
- Easy to modify without code changes

### 5. WebSocket Management
- Dedicated managers for different WebSocket types
- Proper connection handling
- Clean separation of concerns

## Migration Steps

1. **Backup old files** (optional, for reference)
2. **Update package.json** to use new entry point
3. **Set environment variables** as needed
4. **Test the new architecture**
5. **Remove old files** once confirmed working

## Testing the Migration

1. Start the server: `npm run dev`
2. Test health endpoint: `GET /ping`
3. Test API endpoints: `GET /api/projects`
4. Test WebSocket connections
5. Verify file operations work
6. Check terminal functionality

## Rollback Plan

If issues arise, you can temporarily rollback by:
1. Reverting `package.json` to use `src/index.js`
2. The old files are still present and functional
3. Fix any issues and re-migrate

## Next Steps

1. Add comprehensive tests
2. Add API documentation
3. Implement authentication
4. Add monitoring and metrics
5. Consider microservices architecture for scaling
