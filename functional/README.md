# ⚡ Functional Node.js Production Boilerplate

Welcome to the **Functional** implementation of the Node.js Production Boilerplate. This directory hosts modern, lightweight, and efficient codebases built using **Functional Programming (FP)** paradigms.

## 🚀 Overview

This implementation is tailored for developers and teams who value:
- **Simplicity**: Pure functions and stateless logic where possible.
- **Composability**: Building complex features by combining simple, reusable functions.
- **Less Boilerplate**: Minimal setup without the overhead of class instantiation.
- **Modern JS Patterns**: Heavy use of closures, higher-order functions, and ES6+ features.

This approach is perfect for microservices, serverless functions, and applications where a lightweight footprint and execution speed are paramount.

## 📂 Project Structure

Choose the database stack that fits your needs:

### ✨ [MongoDB (Mongoose)](./mongo-db)
An optimized setup for **NoSQL** using functional patterns.
- **Features**: Functional schemas, direct model access, middleware functions, and rapid data processing.
- **Best For**: Flexible data models and high-performance APIs.

### ✨ [MySQL (Relational)](./mysql)
A streamlined setup for **Relational** databases without the OOP overhead.
- **Features**: Raw SQL queries or functional ORM wrappers, simplified transaction implementations.
- **Best For**: Systems requiring strict consistency with a minimal code abstraction layer.

## 🛠️ Getting Started

1.  Navigate to the directory of your chosen database:
    ```bash
    cd mongo-db
    # or
    cd mysql
    ```
2.  Refer to the detailed `README.md` within that subdirectory for setup instructions.
3.  Start building with the power of Functional Programming!

---
*Part of the [Node.js Production Boilerplate](../README.md) suite.*
