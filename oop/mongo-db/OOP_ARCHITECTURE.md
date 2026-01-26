# OOP Architecture

## Overview

This Node.js application follows Object-Oriented Programming (OOP) principles with a clean, maintainable architecture.

## Core Principles

### 1. Encapsulation
- Private methods prefixed with `_` for internal use
- Protected methods accessible within class hierarchy
- Public methods for external API

### 2. Inheritance
- Base classes provide common functionality
- Child classes extend base classes
- Code reuse through inheritance

### 3. Polymorphism
- Child classes can override parent methods
- Same interface, different implementations
- Flexible and extensible design

### 4. Abstraction
- Base classes define common patterns
- Abstract methods implemented by children
- Hide implementation details

### 5. Dependency Injection
- Dependencies injected through constructors
- Easy to test and mock
- Loose coupling between components

## Architecture Layers

### Bootstrap Layer
- Application initialization and lifecycle management
- Modular startup process
- Clean separation of concerns

**Components**:
- **ServerManager**: HTTP/HTTPS server creation and lifecycle
- **ProcessManager**: Signal handling (SIGTERM, SIGINT, uncaughtException)
- **ApplicationBootstrap** (`setup.js`): Express app configuration
- **RouteLoader**: Dynamic route discovery and registration

### Controllers Layer
- Handle HTTP requests and responses
- Extend `BaseController`
- Implement business logic
- Use injected model and helpers

### Models Layer
- Data access and persistence
- Extend `BaseModel`
- Interact with database
- Handle caching

### Services Layer
- External services and utilities
- Extend `BaseService`
- Reusable business logic
- Error handling

### Middleware Layer
- Request/response processing
- Authentication and authorization
- Rate limiting and security
- Error handling

### Helpers & Utilities Layer
- Common helper functions
- Data transformation and validation
- File upload utilities
- Logging and environment validation

## Base Classes

### BaseController
**Purpose**: Common controller functionality

**Features**:
- Dependency injection (model, response, dataHelper)
- Method binding for Express routes
- Logging helper
- Error handling
- Pagination helper

### BaseModel
**Purpose**: Common data access patterns

**Features**:
- Schema and cache injection
- CRUD operations
- Automatic cache invalidation
- Query helpers

### BaseService
**Purpose**: Common service functionality

**Features**:
- Service initialization
- Error handling
- Parameter validation
- Cleanup methods

### BaseValidation
**Purpose**: Common validation functionality

**Features**:
- Schema validation with Joi
- Password validation helpers
- Reusable validation methods
- Consistent error responses

### BaseRoute
**Purpose**: Common routing functionality

**Features**:
- HTTP verb wrappers (GET, POST, PUT, PATCH, DELETE)
- Route organization and grouping
- Clean middleware handling
- Consistent route patterns

## Bootstrap Architecture

The application uses a **modular bootstrap architecture** for clean initialization and lifecycle management.

### Entry Point (`index.js`)

The entry point is minimal and focused on orchestration:

1. **Environment Loading**: Loads `.env` file **before** any imports
2. **Server Creation**: Instantiates `ServerManager`
3. **Process Handling**: Instantiates `ProcessManager` for graceful shutdown
4. **Application Start**: Calls `serverManager.start()`

**Why environment loads first?**
- Ensures all modules have access to `process.env` when they initialize
- Prevents `undefined` configuration errors in services like Redis

### ServerManager

**Responsibilities**:
- Creates HTTP or HTTPS server based on configuration
- Initializes Socket.IO for real-time communication
- Manages server lifecycle (start, stop)
- Handles graceful shutdown of all services

**Key Methods**:
- `start()`: Configures Express app, creates server, starts listening
- `shutdown(signal)`: Gracefully closes server and cleans up resources
- `_cleanupServices()`: Calls `cleanup()` on all services (Redis, AWS, Nodemailer, Socket.IO)

### ProcessManager

**Responsibilities**:
- Handles process signals (`SIGTERM`, `SIGINT`)
- Catches uncaught exceptions and unhandled rejections
- Triggers graceful shutdown via `ServerManager`

**Signals Handled**:
- `SIGTERM`: Graceful shutdown (PM2, Docker, Kubernetes)
- `SIGINT`: Manual shutdown (Ctrl+C)
- `uncaughtException`: Logs error and exits
- `unhandledRejection`: Logs error and exits

### ApplicationBootstrap (`setup.js`)

**Responsibilities**:
- Configures Express application
- Sets up middleware (body parsers, CORS, security)
- Connects to databases (MongoDB, Redis)
- Registers routes dynamically
- Sets up error handling

**Initialization Steps**:
1. Validate environment variables
2. Connect to MongoDB
3. Connect to Redis
4. Setup body parsers (JSON, URL-encoded)
5. Setup CORS and security headers (Helmet)
6. Setup i18n, logging, static files
7. Setup view engine (EJS)
8. Setup Swagger documentation
9. Load routes dynamically
10. Setup global error handler

### RouteLoader (`routes.js`)

**Responsibilities**:
- Discovers route files automatically
- Registers API routes dynamically
- Registers static routes (health check, terms, privacy)
- Registers 404 handler

**Features**:
- Walks `routes/` directory recursively
- Auto-registers routes as `/api/v1/{filename}`
- No manual route registration needed
- Supports nested route structures

## Design Patterns

### Template Method Pattern
Base classes define algorithm skeleton, child classes implement steps.

### Dependency Injection Pattern
Dependencies injected through constructors for loose coupling.

### Factory Pattern
Base classes provide factory methods for common operations.

### Singleton Pattern
Services exported as single instances.

## Benefits

### Code Reusability
- Common functionality in base classes
- No code duplication
- DRY principle

### Maintainability
- Clear structure and organization
- Changes in base classes affect all children
- Easy to understand and modify

### Testability
- Easy to mock dependencies
- Isolated unit tests
- Test base classes independently

### Scalability
- Add new features by extending classes
- Consistent patterns across codebase
- Easy to add new resources

### Consistency
- Same patterns everywhere
- Predictable behavior
- Easier onboarding

## File Structure

For the complete project structure with detailed descriptions, see the **[Project Structure](./README.md#-project-structure)** section in README.md.

**Key architectural folders**:
- `bootstrap/` - Application initialization and lifecycle
- `core/` - Base classes (OOP foundation)
- `resources/` - API resources (controllers, models, validations)
- `services/` - External services (Redis, AWS, Nodemailer, Socket.IO)
- `middleware/` - Express middleware (error handling, rate limiting, auth)
- `helpers/` - Helper classes (response, data)
- `utils/` - Utility classes (logger, upload, env validator)

## Best Practices

1. Always extend base classes for new components
2. Inject dependencies through constructors
3. Use `this.model`, `this.response`, etc. instead of direct imports
4. Call `this._autoBindMethods()` in controller constructors
5. Wrap methods in try-catch blocks
6. Use base class helpers for logging and error handling
7. Follow naming conventions (PascalCase for classes)
8. Keep classes focused (Single Responsibility)

## Summary

This OOP architecture provides:
- ✅ Clean, organized code structure
- ✅ Reusable base classes
- ✅ Consistent patterns
- ✅ Easy to test and maintain
- ✅ Scalable and extensible
- ✅ Industry-standard design patterns

This OOP architecture provides a solid foundation for building scalable, maintainable Node.js applications. By following these patterns and principles, the codebase remains clean, testable, and easy to extend.