# 🚀 agpk1-task — Enterprise Operations Engine

Production-grade, event-driven platform for enterprise task management, automation, and analytics.

## 🛠️ Features
- **Project & Task Management**: Kanban, GANTT, and Calendar views.
- **Enterprise Security**: JWT with Refresh Tokens, Granular RBAC, and Zero-Trust Multi-Tenancy.
- **Workflow Engine**: Custom states, role-based transitions, and automated triggers.
- **Audit System**: Automated, immutable logging for all critical platform mutations.
- **Performance**: High-performance distributed caching (Redis) and background job processing.
- **Real-time**: Hardened WebSockets with tenant-based room isolation.

## 📁 Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Caching & Queues**: Redis, BullMQ (for background email and reporting)
- **Security**: Passport (JWT), Helmet, Rate Limiting, Custom Sanitizers
- **Communication**: Socket.io (Authenticated & Isolated)
- **AI/LLM**: OpenAI GPT-4o-mini Integration
- **Infrastructure**: EventBus for decoupled service communication

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file based on the enterprise requirements:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agpk1-task
JWT_SECRET=your_super_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret_key

# Performance & Jobs
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass

# AI (OpenAI)
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_openai_api_key
```

### 2. Installation
```bash
npm install
```

### 3. Database Seeding
Populate initial roles, users, and tasks:
```bash
npm run seed
```

### 4. Running the App
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## 📜 Documentation
Check `PROJECT_SPECIFICATION.md` for the unified API index, database schemas, and AI UI generation prompt. For an architectural deep dive, see `MASTER_DOCUMENTATION.md`.
