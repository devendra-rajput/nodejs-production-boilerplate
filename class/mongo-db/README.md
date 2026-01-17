# Node JS Production Boilerplate

A production-ready Node.js boilerplate for building secure, scalable, and maintainable backend applications.

## 🚀 Features

- **Scalability**: Designed for clustering with PM2.
- **Performance**: Redis-based caching and distributed rate limiting.
- **Global Timezone Support**: Dynamic timezone handling via `x-timezone` header.
- **Security**: Helmet, strict CORS (origin-based), Rate Limiting, and JWT Authentication.
- **Reliability**: Global error handling and Redis-based caching.
- **Documentation**: Full OpenAPI 3.0 (Swagger) documentation.
- **Real-time**: Socket.IO with authenticated connections.
- **Logging Control**: Disable console logs in production via environment variable.
- **AWS Integration**: S3 file uploads and Presigned URL generation.

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose ODM)
-   **Caching**: Redis
-   **Process Manager**: PM2
-   **Architecture**: Object-Oriented Programming (OOP) with SOLID Principles

## 🏗️ Architecture

This boilerplate follows **Object-Oriented Programming (OOP)** architecture with:

- **Inheritance**: Base classes for Controllers, Models, Services, Middleware, and Utilities
- **Encapsulation**: Private and protected methods for internal logic
- **Polymorphism**: Method overriding for specialized behavior
- **Abstraction**: Abstract base classes with common interfaces
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Injection

**For detailed architecture documentation, see [OOP_ARCHITECTURE.md](./OOP_ARCHITECTURE.md)**

## � Project Structure

```
class/mongo-db/
├── index.js                    # Application entry point
├── bootstrap/                  # Application bootstrap components
│   ├── serverManager.js        # HTTP/HTTPS server lifecycle
│   ├── processManager.js       # Process signal handling
│   ├── setup.js                # Express app configuration
│   └── routes.js               # Dynamic route loader
├── core/                       # Base classes (OOP foundation)
│   ├── BaseController.js
│   ├── BaseModel.js
│   ├── BaseService.js
│   ├── BaseValidation.js
│   └── BaseRoute.js
├── resources/v1/               # API resources (versioned)
│   └── users/
│       ├── users.controller.js # User controller
│       ├── users.model.js      # User model
│       ├── users.validation.js # User validation
│       ├── users.swagger.js    # Swagger documentation
│       └── user.schema.js      # Mongoose schema
├── routes/                     # Route definitions
│   └── users.js                # User routes
├── services/                   # External services
│   ├── redis.js
│   ├── aws.js
│   ├── nodemailer.js
│   └── socket.js
├── middleware/                 # Express middleware
│   ├── error.js                # Global error handler
│   ├── rateLimiter.js          # Rate limiting
│   ├── timezone.js             # Timezone handling
│   └── v1/authorize.js         # JWT authentication
├── helpers/                    # Helper classes
│   └── v1/
│       ├── response.helpers.js
│       └── data.helpers.js
├── utils/                      # Utility classes
│   ├── logger.js
│   ├── upload.js
│   └── envValidator.js
├── config/                     # Configuration files
│   ├── i18n.js                 # Internationalization
│   ├── cors.js                 # CORS configuration
│   └── v1/
│       ├── mongodb.js          # MongoDB connection
│       └── redis.js            # Redis connection
├── seeders/                    # Database seeders
│   ├── index.js                # Seeder runner
│   └── v1/users.js             # User seeder
├── views/                      # EJS templates
│   ├── layout.ejs              # Base layout
│   ├── privacy.ejs             # Privacy policy
│   └── terms.ejs               # Terms of service
├── public/                     # Static assets
│   └── css/static-pages.css
├── locales/                    # i18n translations
│   ├── en.json
│   └── hi.json
├── tests/                      # Test scripts
│   ├── test-rate-limiter.js
│   └── test-multi-ip.js
├── logs/                       # Application logs
├── uploads/                    # Temporary file uploads
└── emailTemplates/             # Email templates
    └── v1
        ├── forgotPassword.js
        └── verification.js
```

## 🛠️ Setup


1.  **Clone the repository**:

    ```bash
    git clone https://github.com/devendra-rajput/nodejs-production-boilerplate.git
    cd nodejs-production-boilerplate
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Copy `.env.example` to `.env.development` and `.env.production` and update the values:
    ```bash
    cp .env.example .env.development
    cp .env.example .env.production
    ```


4.  **Database Setup**:
    Ensure MongoDB and Redis are running.
    Run the below command to insert default admin user in DB.
    ```bash
    npm run db:seed
    ```

## 🏃‍♂️ Running the Application

  ### Development
  ```bash
  npm run dev
  ```


  ### Production
  To run in single Instance Mode
  ```bash
  npm run dev:prod
  ```
  
  Use PM2 to run in cluster mode:
  ```bash
  pm2 start ecosystem.config.js --env production
  ```

## 🛡️ Graceful Shutdown

The application implements graceful shutdown to ensure clean termination:

- **Automatic cleanup** of all services (Redis, Nodemailer, AWS, Socket.IO)
- **Proper connection closure** to prevent resource leaks
- **Signal handling** for SIGTERM, SIGINT, and uncaught exceptions
- **Production-ready** for PM2, Docker, and Kubernetes deployments

**Shutdown triggers**:
- `Ctrl+C` (SIGINT) - Manual shutdown
- `kill <pid>` (SIGTERM) - System shutdown
- PM2 restart - Process manager
- Docker/K8s stop - Container orchestration

All services implement `cleanup()` methods that are automatically called during shutdown to close connections and free resources.

## 📚 Documentation

Access the interactive Swagger UI at:
`http://localhost:8000/api-docs` or `http://127.0.0.1:8000/api-docs`

Swagger uses a **relative server URL (`/`)**, so API requests are always sent to the same origin
from which the Swagger UI is opened. This prevents CORS issues between `localhost` and `127.0.0.1`.

## 🔌 Socket.IO

Connect to the socket server at `/socket.io`.
Authentication is required via `Authorization` header or `auth` object.

```javascript
const socket = io('http://localhost:8000', {
  path: '/socket.io',
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### 🌐 CORS Configuration

The API uses **strict, origin-based CORS** to control browser access in a secure and predictable way.

Allowed origins are configured via environment variables.

**Example `.env.example` configuration:**

```env
CORS_ORIGINS = "http://localhost:3000,https://frontend.example.com"
```

## 🌍 Timezone Handling

The API stores all dates in **UTC**. To receive dates in a specific timezone, clients must send the `x-timezone` header.

  **Example Request**:

  ```http
  GET /api/v1/users/1
  x-timezone: America/New_York
  ```

## 📝 Logging Configuration

To disable `console.log` output (useful for production/testing to reduce noise), set:
```env
LOG_DISABLE=true
```

## ☁️ AWS S3 Integration

The boilerplate supports AWS S3 for file storage.
- **Uploads**: Direct uploads via `multer` or Presigned URLs.
- **Presigned URLs**: Securely generate upload URLs for clients.
- **Cleanup**: Auto-deletion of local files after upload (if applicable).

**Required Environment Variables**:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket
```

## 🧪 Load Testing

To verify server performance, use tools like Apache Benchmark (ab) or k6.
**Example with Apache Benchmark**:
```bash
# 10,000 requests, 100 concurrent
ab -n 10000 -c 100 http://localhost:8000/load-test
```

### 📊 Included Test Scripts

The `tests/` directory contains scripts for verifying system behavior.
(Ensure `test-rate-limiter.js` and `test-multi-ip.js` exist in `tests/` for this to work)

**Rate Limiter Test**:
Simulates high-traffic scenarios to verify rate limiting.
```bash
node tests/test-rate-limiter.js --base-url http://localhost:8000 --rps 250 --duration 5
```
**Arguments:**
- `--base-url`: Target URL (default: `http://localhost:8000`)
- `--rps`: Requests per second (default: `250`)
- `--duration`: Test duration in seconds (default: `5`)

**Multi-IP Test**:
Simulates requests from multiple fake IPs to test distributed rate limiting.
```bash
node tests/test-multi-ip.js --base-url http://localhost:8000 --users 10 --requests 25
```
**Arguments:**
- `--base-url`: Target URL (default: `http://localhost:8000`)
- `--users`: Number of simulated users/IPs (default: `10`)
- `--requests`: Requests per user (default: `25`)

## 🧹 Code Quality

This project uses **ESLint** with the **Airbnb Base** style guide and **eslint-plugin-security** to maintain consistent code quality, enforce best practices, and prevent common bugs across the codebase. **ESLint** helps ensure that all contributors follow the same coding standards, improving readability and long-term maintainability.

-   **Airbnb Base**: Enforces best practices for JavaScript (var usage, equality, spacing, etc.).
-   **Security Plugin**: Checks for vulnerabilities like unsafe regex (ReDoS), `eval()` usage, and child process misuse.
-   **Centralized Config**: Configuration is managed centrally in `.eslintrc.js` at the root, ensuring consistency across all services.

**Run Linter**:
```bash
npm run lint
```

**Fix Linting Issues**:
```bash
npm run lint:fix
```

## 🔒 Security

-   **Rate Limiting**: 10 requests per second per IP.
-   **Headers**: Secure HTTP headers via Helmet.
-   **Trusted Proxy**: Only localhost proxies are trusted for client IP resolution, preventing IP spoofing.
-   **CORS**: CORS is enforced by browsers only. Server-to-server requests (Postman, curl, internal services) are not restricted by CORS.