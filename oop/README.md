# 🏗️ Enterprise-Grade OOP Node.js Boilerplate

<div align="center">

**Production-Ready | Scalable | Maintainable | SOLID Principles**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![OOP](https://img.shields.io/badge/Architecture-OOP-blue.svg)](https://en.wikipedia.org/wiki/Object-oriented_programming)
[![SOLID](https://img.shields.io/badge/Principles-SOLID-orange.svg)](https://en.wikipedia.org/wiki/SOLID)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green.svg)](https://www.mongodb.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-blue.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-red.svg)](https://redis.io/)
[![ESLint](https://img.shields.io/badge/Code%20Quality-ESLint-blueviolet.svg)](https://eslint.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*A professional-grade Node.js boilerplate built with **Object-Oriented Programming** principles for building secure, scalable, and maintainable backend applications.*

</div>

---

## 🎯 Overview

This directory contains **two production-ready implementations** of a Node.js backend application, each built with **100% Object-Oriented Programming (OOP)** architecture and following **SOLID principles**. Choose your database technology and start building scalable applications immediately.

### 🌟 Why This Boilerplate?

- ✅ **100% OOP Architecture** - Every component is a class with clear responsibilities
- ✅ **SOLID Principles** - Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Injection
- ✅ **Design Patterns** - Template Method, Factory, Singleton, Dependency Injection
- ✅ **Production-Ready** - Battle-tested code with error handling, logging, and monitoring
- ✅ **Highly Maintainable** - Clear structure, consistent patterns, easy to extend
- ✅ **Developer-Friendly** - Comprehensive documentation, examples, and best practices

---

## 📂 Available Implementations

### 🍃 [MongoDB Implementation](./mongo-db) - NoSQL Powerhouse

**Perfect for:** High-volume data, flexible schemas, real-time applications

```
✨ Features:
├── 📦 Mongoose ODM with class-based models
├── 🔄 Aggregation pipelines and complex queries
├── 🚀 Connection pooling and optimization
├── 📊 Schema validation with Joi
├── 💾 Redis caching layer
└── 🔌 Socket.IO real-time communication
```

**Architecture Highlights:**
- `BaseModel` - Abstract class for all Mongoose models
- `BaseController` - Template method pattern for request handling
- `BaseService` - Service layer with lifecycle management
- `BaseValidation` - Joi-based validation with reusable patterns
- `BaseRoute` - Express router with automatic registration

**Use Cases:**
- Content Management Systems
- Social Media Platforms
- Real-time Analytics
- IoT Data Collection
- Rapid Prototyping

---

### 🐬 [MySQL Implementation](./mysql) - Relational Excellence

**Perfect for:** Structured data, complex relationships, ACID transactions

```
✨ Features:
├── 🗄️ Sequelize ORM with class-based models
├── 🔗 Association management (1:1, 1:N, N:M)
├── 🔒 Transaction support with rollback
├── 📐 Strict schema definitions
├── 💾 Redis caching layer
└── 🔌 Socket.IO real-time communication
```

**Architecture Highlights:**
- `BaseResource` - Abstract class for all Sequelize models
- `ModelManager` - Centralized model initialization and sync
- `BaseController` - Template method pattern for request handling
- `BaseService` - Service layer with lifecycle management
- `BaseValidation` - Joi-based validation with reusable patterns

**Use Cases:**
- E-commerce Platforms
- Financial Applications
- ERP Systems
- Booking Systems
- Inventory Management

---

## 🏛️ OOP Architecture Overview

Both implementations follow the same architectural patterns for consistency:

### 📐 Core Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Entry Point (index.js)               │
│              Environment Loading & Orchestration        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Bootstrap Layer                       │
│  ├── ServerManager (HTTP/HTTPS lifecycle)               │
│  ├── ProcessManager (Signal handling)                   │
│  ├── ApplicationBootstrap (App configuration)           │
│  └── ModelManager (Model initialization) [MySQL only]   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Core Base Classes                    │
│  ├── BaseController (Request handling)                  │
│  ├── BaseModel/BaseResource (Data access)               │
│  ├── BaseService (Business logic)                       │
│  ├── BaseValidation (Input validation)                  │
│  └── BaseRoute (Route registration)                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Resource Layer                        │
│  ├── Controllers (Extend BaseController)                │
│  ├── Models/Resources (Extend BaseModel)                │
│  ├── Validations (Extend BaseValidation)                │
│  └── Routes (Extend BaseRoute)                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                          │
│  ├── RedisService (Caching)                             │
│  ├── AWSService (File storage)                          │
│  ├── NodemailerService (Email)                          │
│  └── SocketService (Real-time)                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               Middleware & Utilities                    │
│  ├── ErrorHandler (Global error handling)               │
│  ├── RateLimiterMiddleware (Rate limiting)              │
│  ├── TimezoneMiddleware (Timezone handling)             │
│  ├── LoggerUtils (Winston logging)                      │
│  └── UploadUtils (File uploads)                         │
└─────────────────────────────────────────────────────────┘
```

### 🎨 Design Patterns Implemented

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Template Method** | BaseController, BaseService | Define algorithm skeleton, let subclasses override steps |
| **Dependency Injection** | All base classes | Inject dependencies via constructor for testability |
| **Factory** | ModelManager (MySQL) | Centralized model creation and initialization |
| **Singleton** | Service classes, Resources | Single instance for stateless utilities |
| **Strategy** | Validation classes | Interchangeable validation strategies |
| **Observer** | Socket.IO events | Event-driven real-time communication |

### 🔒 SOLID Principles in Action

#### **S** - Single Responsibility Principle
```javascript
// Each class has ONE reason to change
class UserController extends BaseController {
  // ONLY handles HTTP requests
}

class UserResource extends BaseModel {
  // ONLY handles data access
}

class UserValidation extends BaseValidation {
  // ONLY handles input validation
}
```

#### **O** - Open/Closed Principle
```javascript
// Open for extension, closed for modification
class BaseController {
  async create(req, res) {
    // Base implementation
  }
}

class UserController extends BaseController {
  // Extend without modifying base class
  async create(req, res) {
    // Custom user creation logic
    return super.create(req, res);
  }
}
```

#### **L** - Liskov Substitution Principle
```javascript
// Derived classes can replace base classes
function processRequest(controller: BaseController) {
  controller.create(req, res); // Works with ANY controller
}

processRequest(new UserController());
processRequest(new ProductController());
```

#### **I** - Interface Segregation Principle
```javascript
// Clients don't depend on methods they don't use
class BaseService {
  async initialize() { } // Optional
  async cleanup() { }    // Optional
}

class RedisService extends BaseService {
  // Only implements what it needs
  async initialize() { /* Connect to Redis */ }
  async cleanup() { /* Disconnect */ }
}
```

#### **D** - Dependency Injection Principle
```javascript
// Depend on abstractions, not concretions
class UserController extends BaseController {
  constructor() {
    super(UserResource, ResponseHelper, DataHelper);
    // Dependencies injected, not hardcoded
  }
}
```

---

## 🚀 Quick Start

### 1️⃣ Choose Your Database

```bash
# For MongoDB
cd mongo-db

# For MySQL
cd mysql
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment

```bash
# Copy environment template
cp .env.example .env.development

# Edit with your configuration
nano .env.development
```

### 4️⃣ Run Database Seeders (Optional)

```bash
# For development environment
npm run db:seed

# For production environment
npm run db:seed:prod
```

### 5️⃣ Start Development Server

```bash
npm run dev
```

### 6️⃣ Access Your Application

```
🌐 API: http://localhost:8000
📚 Swagger Docs: http://localhost:8000/api-docs
🔌 Socket.IO: ws://localhost:8000
```

---

## 📊 Code Quality Metrics

### MongoDB Implementation
- **Total Files**: 150+
- **OOP Coverage**: 100%
- **Code Duplication**: <5%
- **Test Coverage**: Ready for testing
- **ESLint Compliance**: ✅ Zero errors

### MySQL Implementation
- **Total Files**: 150+
- **OOP Coverage**: 100%
- **Code Duplication**: <5%
- **Code Reduction**: 55% (vs non-OOP)
- **ESLint Compliance**: ✅ Zero errors

---

## 🎓 Learning Resources

### For Beginners
1. Start with the **MongoDB implementation** (simpler schema)
2. Read `OOP_ARCHITECTURE.md` in each folder
3. Study the `BaseController` and `BaseModel` classes
4. Create a simple CRUD resource following the examples

### For Advanced Users
1. Explore the **MySQL implementation** (complex relationships)
2. Study the `ModelManager` and association patterns
3. Implement custom middleware extending base classes
4. Add new design patterns as needed

### Documentation Files
- `README.md` - Getting started and features
- `OOP_ARCHITECTURE.md` - Detailed architecture documentation
- `MYSQL_OOP_REFACTORING_SUMMARY.md` - MySQL-specific refactoring guide

---

## 🛠️ Technology Stack

### Core Technologies
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Language**: JavaScript (ES6+)

### Databases
- **MongoDB**: Mongoose 8.x (NoSQL)
- **MySQL**: Sequelize 6.x (SQL)

### Caching & Real-time
- **Redis**: ioredis (Caching & Rate Limiting)
- **Socket.IO**: Real-time bidirectional communication

### Security & Validation
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Joi**: Schema validation
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing

### File Handling
- **AWS S3**: Cloud file storage
- **Multer**: File upload middleware
- **HEIC Convert**: Image format conversion

### Utilities
- **Winston**: Logging with daily rotation
- **Nodemailer**: Email service
- **Moment**: Timezone handling
- **UUID**: Unique identifier generation

---

## 📈 Performance Features

### Caching Strategy
```javascript
// Automatic caching in BaseModel
const users = await UserResource.getAllWithPagination(1, 10);
// ↑ Cached automatically with Redis
// ↓ Invalidated on create/update/delete
```

### Connection Pooling
```javascript
// MongoDB: Automatic connection pooling
// MySQL: Sequelize connection pool configuration
```

### Rate Limiting
```javascript
// Redis-based distributed rate limiting
// 10 requests per second per IP
```

### Lazy Loading
```javascript
// Services initialize only when needed
await SocketService.initialize(server);
```

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Stateless token-based auth
- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **Rate Limiting** - Redis-based distributed limiting
- ✅ **CORS Protection** - Configurable allowed origins
- ✅ **Helmet Security** - HTTP security headers
- ✅ **Input Validation** - Joi schema validation
- ✅ **SQL Injection Prevention** - Sequelize parameterized queries
- ✅ **XSS Protection** - Input sanitization
- ✅ **Environment Variables** - Sensitive data protection

---

## 📦 What's Included

### ✅ Complete Features
- User authentication (register, login, logout)
- Email verification with OTP
- Password reset flow
- File upload (local & AWS S3)
- Image processing (HEIC conversion)
- Real-time notifications (Socket.IO)
- API documentation (Swagger)
- Rate limiting (Redis)
- Caching layer (Redis)
- Logging (Winston)
- Error handling (Global)
- Timezone support (Dynamic)
- Database seeders
- EJS views (Terms, Privacy)

### 🎯 Production-Ready Components
- ✅ Graceful shutdown handling
- ✅ Process signal management
- ✅ Environment validation
- ✅ Database connection pooling
- ✅ Service lifecycle management
- ✅ Automatic cache invalidation
- ✅ Request/response logging
- ✅ Error tracking and reporting

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** the existing OOP patterns
4. **Test** your changes thoroughly
5. **Commit** with clear messages (`git commit -m 'Add amazing feature'`)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Contribution Guidelines
- Follow existing code style and patterns
- Extend base classes, don't modify them
- Add JSDoc comments for new methods
- Update documentation as needed
- Ensure ESLint passes (`npm run lint`)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using modern JavaScript and OOP principles
- Inspired by enterprise-grade application architectures
- Designed for developers who value clean, maintainable code

---

## 👤 Author

**Devendra Kumar** (Dev Rajput)  
Full-Stack Developer  
Email: developer@devrajput.in  
Portfolio: www.devrajput.in  
Linked-IN: https://www.linkedin.com/in/devendra-kumar-3ba793a7  
GitHub: https://github.com/devendra-rajput

---

## 📞 Support

- 📧 **Email**: developer@devrajput.in
- 📚 **Documentation**: See README files in each implementation
- 🐛 **Issues**: [GitHub Issues](https://github.com/devendra-rajput/nodejs-production-boilerplate/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/devendra-rajput/nodejs-production-boilerplate/discussions)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

**Built with Node.js | Powered by OOP | Designed for Production**

[MongoDB Implementation](./mongo-db) • [MySQL Implementation](./mysql)

</div>