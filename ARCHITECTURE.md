# CodeSandbox Backend - Clean Architecture

## Overview

This project has been refactored to follow clean code principles, design patterns, and the Single Responsibility Principle. The architecture is organized into distinct layers with clear separation of concerns.

## Architecture Principles

### 1. Single Responsibility Principle (SRP)
Each class and module has only one reason to change:
- `Application` - Only handles application initialization
- `DockerService` - Only handles Docker operations
- `FileSystemService` - Only handles file system operations
- `Logger` - Only handles logging
- `ConfigManager` - Only handles configuration

### 2. Dependency Injection
Uses a custom DI container to manage dependencies and enable testability.

### 3. Design Patterns
- **Factory Pattern**: `ServiceFactory` creates service instances
- **Service Locator**: `Container` manages service instances
- **Observer Pattern**: WebSocket managers handle events
- **Strategy Pattern**: Different services for different operations

## Directory Structure

```
src/
├── core/                    # Core application components
│   ├── Application.js      # Main application class
│   ├── Container.js        # Dependency injection container
│   ├── Logger.js           # Logging service
│   └── ConfigManager.js    # Configuration management
├── services/               # Business logic services
│   ├── DockerService.js    # Docker container operations
│   ├── FileSystemService.js # File system operations
│   ├── ProjectService.js   # Project management
│   ├── FileWatcherService.js # File watching
│   └── TerminalSessionManager.js # Terminal session management
├── websocket/              # WebSocket managers
│   ├── EditorWebSocketManager.js # Editor WebSocket handling
│   └── TerminalWebSocketManager.js # Terminal WebSocket handling
├── controllers/            # HTTP request handlers
│   ├── ProjectController.js # Project HTTP endpoints
│   └── PingController.js   # Health check endpoints
├── routes/                 # Route configuration
│   └── ApiRouter.js        # API route setup
├── factories/              # Service factories
│   └── ServiceFactory.js   # Service creation
├── bootstrap/              # Application bootstrap
│   └── ServiceRegistry.js  # Service registration
└── main.js                 # Application entry point
```

## Key Components

### Core Layer
- **Application**: Orchestrates application startup and shutdown
- **Container**: Manages dependency injection
- **Logger**: Provides structured logging
- **ConfigManager**: Handles configuration management

### Service Layer
- **DockerService**: Manages Docker containers and operations
- **FileSystemService**: Handles all file system operations
- **ProjectService**: Manages project lifecycle
- **FileWatcherService**: Monitors file system changes
- **TerminalSessionManager**: Manages terminal sessions

### WebSocket Layer
- **EditorWebSocketManager**: Handles editor WebSocket connections
- **TerminalWebSocketManager**: Handles terminal WebSocket connections

### Controller Layer
- **ProjectController**: Handles project-related HTTP requests
- **PingController**: Handles health check requests

## Benefits of This Architecture

### 1. Maintainability
- Clear separation of concerns
- Easy to locate and modify specific functionality
- Reduced coupling between components

### 2. Testability
- Dependency injection enables easy mocking
- Each service can be tested in isolation
- Clear interfaces between layers

### 3. Scalability
- Services can be easily extended or replaced
- New features can be added without affecting existing code
- Clear boundaries make it easy to split into microservices

### 4. Error Handling
- Centralized error handling in services
- Proper error propagation through layers
- Structured logging for debugging

### 5. Configuration Management
- Environment-based configuration
- Centralized configuration management
- Easy to modify settings without code changes

## Usage

### Starting the Application
```bash
npm run dev    # Development mode with nodemon
npm start      # Production mode
```

### Environment Variables
```env
PORT=3000
LOG_LEVEL=info
DOCKER_SOCKET_PATH=/var/run/docker.sock
PROJECTS_BASE_PATH=./projects
CORS_ORIGIN=*
```

### API Endpoints
- `GET /ping` - Simple health check
- `GET /api/health` - Detailed health information
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project

### WebSocket Endpoints
- `ws://localhost:3000/editor` - Editor WebSocket (Socket.IO)
- `ws://localhost:3000/terminal` - Terminal WebSocket (Native WebSocket)

## Migration from Old Architecture

The old architecture had several issues:
1. Mixed responsibilities in `index.js`
2. Duplicate handlers
3. No proper abstraction
4. Business logic mixed with infrastructure
5. Poor error handling
6. Scattered configuration

The new architecture addresses all these issues by:
1. Separating concerns into distinct layers
2. Using dependency injection
3. Implementing proper abstractions
4. Centralizing configuration
5. Adding comprehensive error handling
6. Following SOLID principles

## Future Improvements

1. **Database Integration**: Add proper database layer
2. **Authentication**: Implement user authentication
3. **Rate Limiting**: Add API rate limiting
4. **Caching**: Implement caching layer
5. **Monitoring**: Add application monitoring
6. **Testing**: Add comprehensive test suite
7. **Documentation**: Add API documentation
8. **Validation**: Add request validation middleware
