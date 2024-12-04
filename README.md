# Files Service

The **Files Service** is a microservice designed to handle file uploads, storage, and retrieval for the Duolingo-inspired sonar training platform.
---

## 🚀 Features
- 🗂️ **File Storage and Management**: Handles the upload, retrieval, and deletion of files.
- ⚡ **Object Storage with Minio**: Uses Minio to store and serve files, offering scalability and durability.
- 🔄 **Microservices Architecture**: Designed to work seamlessly with other microservices in the ecosystem.
- 📦 **Containerization**: Dockerized for easy deployment and scaling.
- 🛠️ **File Validation**: Supports file validation (size, type) before uploading to prevent invalid data from being stored.
- 📊 **Efficient File Retrieval**: Optimized for quick file access and retrieval.

---

## 🛠️ Tech Stack
- **Backend Framework**: [Node.js](https://nodejs.org/)
- **Object Storage**: [Minio](https://min.io/)
- **Containerization**: [Docker](https://www.docker.com/)
- **Language**: TypeScript
- **API Framework**: Express.js
