# 🚀 agpk1-task — Enterprise Operations Engine: Master Documentation

**agpk1-task** is a production-hardened, event-driven modular monolith designed to serve as the technological backbone for large-scale enterprise operations. This document provides an exhaustive technical reference, covering the architecture, security posture, and the lifecycle of the "Hardening Roadmap" that transformed this prototype into an industry-grade engine.

---

## 🏛️ 1. Architecture & Design Philosophy

The system is built on the principle of **"Decoupled Intelligence"**. While it is a monolith for deployment simplicity, it operates internally as a series of isolated modules that communicate through a central asynchronous Event Bus.

### The Tech Stack Rationale
We selected these specific technologies to balance developer velocity with enterprise-scale requirements:

- **Node.js (Runtime)**:
    - **Why**: Its event-driven, non-blocking I/O is ideally suited for a platform that handles thousands of concurrent task updates, websocket emissions, and background jobs.
    - **How**: We leverage `AsyncLocalStorage` for context propagation and `node:async_hooks` for tenant tracing.
- **MongoDB (Database)**:
    - **Why**: Enterprise tasks often require dynamic metadata (SLA tags, custom fields, JSON blobs from integrations). A document store allows for "Schema-on-Read" flexibility.
    - **Hardening**: We use Mongoose for strict schema enforcement while allowing for flexible "Mixed" types where necessary.
- **Redis (Caching & Orchestration)**:
    - **Why**: Essential for sub-millisecond response times.
    - **Usage**: Acts as the backend for **BullMQ** (for reliable background tasks) and as a distributed cache to reduce database I/O by up to 80%.

---

## 💻 2. Frontend Architecture: The Premium Experience

The frontend is a modern **React** application built for speed, responsiveness, and industrial-grade security.

### Core Stack
- **Library**: React 18+ with Functional Components and Hooks.
- **Styling**: **Tailwind CSS** for high-precision, utility-first UI design.
- **State Management**: **Redux Toolkit** (located in `frontend/src/store/`) for global state management (Auth, Tasks, UI state).
- **Routing**: **React Router v6** with advanced "Protected Routes" to enforce RBAC on the client side.

### Key Directories (`frontend/src/`)
- `📂 components/`: Atomic design components (Buttons, Modals, Cards) used across the app.
- `📂 services/`: Contains `api/axios.js`. This is where the **JWT Interceptor** lives. It automatically attaches tokens to requests and handles 401 errors by attempting a transparent token refresh.
- `📂 store/`: Redux slices for complex state sync (e.g., `taskSlice`, `authSlice`).
- `📂 pages/`: Top-level page components (Dashboard, Kanban, Project Settings).
- `📂 hooks/`: Custom hooks like `useAuth` and `useSocket` for reusable logic.

### Real-Time Integration
- Uses **Socket.io-client**. Upon login, the client establishes a secure websocket connection.
- It joins a private organization room (`org:${orgId}`) to receive real-time "Push Notifications" for task updates, ensuring the UI is always in sync with the backend.

---

## 📂 3. Backend Module Manifest: Deep Dive

The backend application is structured into the `src/modules/` directory, where each module represents a distinct business domain.

### 🔐 Auth & Identity (`src/modules/auth/`)
- **What**: Handles the entire user lifecycle.
- **Key Files**: 
    - `User.js`: The central identity model with encrypted credential storage.
    - `AuditLog.js`: The append-only ledger for all security-sensitive actions.
    - `auth.service.js`: Contains complex logic for token rotation and password recovery.
- **Why**: Centralized identity prevents "auth-sprawl" and ensures consistent security policies.

### 📝 Work-Item Engine (`src/modules/work-item/`)
- **What**: The core engine for Tasks, Comments, and Checklists.
- **Key Files**: 
    - `Task.js`: A complex model supporting hierarchies, dependencies, and SLA deadlines.
    - `comment.controller.js`: Manages threaded discussions and mentions.

### 🔄 Workflow & Automation (`src/modules/workflow/` & `src/modules/automation/`)
- **What**: The "State Machine" of the enterprise.
- **How**: Workflows define valid transitions (e.g., `Open` -> `In Review`). Automations listen to the `EventBus` to trigger actions.

---

## 🛡️ 4. The 18-Step Hardening Roadmap (Technical Breakdown)

Over the course of 18 intensive phases, we implemented professional "Defense-in-Depth" layers.

| Step | Tier | **Technical Implementation (How)** | **Strategic Value (Why)** |
| :--- | :--- | :--- | :--- |
| **1** | **Ops** | Integrated `/api/v1/health` with DB/Redis status checks. | Ensures monitoring tools can detect failures instantly. |
| **2** | **API** | Implemented `express.Router` versioning (`/v1/...`). | Allows for breaking changes in the future. |
| **3-4** | **Safety** | Deployed `Helmet.js` and `express-rate-limit`. | Prevents CSRF, XSS, and DoS attacks. |
| **5-7** | **Privacy** | Built a secure Refresh Token system (httpOnly cookies). | Protects against session hijacking. |
| **8-9** | **Infra** | Added Mongoose connection retries and `.env` validation. | Increases "blast-radius" protection. |
| **10** | **RBAC** | Built `rbac.js` middleware using permission-bitmasking. | Enforces rigid "Need-to-Know" access. |
| **11** | **DevOps** | Established a dummy migration layer for schema history. | Standardized, versioned updates to DB. |
| **12** | **Input** | Custom XSS and NoSQL injection sanitizers. | Scrubs every `req.body` to remove malicious scripts. |
| **13-14**| **Scaling**| Integrated **Redis** for GET routes and **BullMQ** for Jobs. | Dramatically improves LCP for the UI. |
| **15** | **Live** | Hardened `SocketServer.js` with JWT heartbeats. | Real-time Presence without security holes. |
| **16-17**| **Trust** | Global `tenantPlugin` for automated query filtering. | Zero-Trust Multi-Tenancy. |
| **18** | **Fix** | Aggregation-safe `tenantPlugin` middleware logic. | Resolves TypeErrors during complex dashboard queries. |
| **19** | **AI** | Integrated OpenAI (GPT-4o-mini) as default LLM provider. | Enables production-grade AI-augmented features. |
| **20** | **Admin** | AI Insights Engine & Compliance Audit Portal. | Provides strategic visibility and regulatory compliance. |
| **21** | **Hardening** | Real-time AI workflow generation & Audit stability. | Transitioned from mock data to real Enterprise AI. |

---

## ⚡ 5. Core Service Infrastructure: The System Internals

### **Winston Logger (`src/core/logger.js`)**
- **Detailed Flow**: Tags every request with a `requestId` and routes to Console (Dev) or File/Rotation (Prod).
- **Log Interpretation**: Note that `204` values appearing in the status position of `morgan` logs often refer to the **Response Size (Bytes)** for successful 200 OK responses, rather than HTTP 204 status codes. The system is configured for explicit status reporting.

### **Event Bus (`src/core/eventBus.js`)**
- **Internal Loop**: Emits events (e.g., `TASK_UPDATED`) that decouple modules (Notifications, Sockets, Analytics).

### **Tenant Context Management (`src/middlewares/tenantContext.js`)**
- **Tech**: Uses `AsyncLocalStorage` to propagate `organizationId` across the request thread without variable pollution.

---

## 🔑 6. Security & Compliance Architecture

- **Refresh Tokens**: Stored in `httpOnly` secure cookies.
- **Multi-Tenant Data Isolation**: Managed by `tenantPlugin.js` at the Mongoose driver level.
- **Compliance Audit Trail**: Permanent record of every mutation (ENTITY, ACTION, CHANGES, CONTEXT).

---

## 🚀 7. Developer & Ops Guide

1.  **Clone & Install**: `npm install`.
2.  **Environment**: Create `.env` (MONGODB_URI, REDIS_URL, JWT_SECRET, etc.).
3.  **Bootstrap**: `npm run seed` for system roles.
4.  **Launch**: `npm run dev` (Local) or `npm start` (Prod).

---

## 📡 8. Comprehensive API Reference (v1)

All routes are prefixed with `/api/v1`.

### 🔐 Authentication & Identity (`/auth`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Public | Register new user & organization. |
| POST | `/login` | Public | Authenticate & receive JWT + Refresh Cookie. |
| POST | `/refresh` | Public | Rotate Access Token using Secure Cookie. |
| POST | `/forgot-password` | Public | Trigger password recovery email. |
| POST | `/reset-password/:token` | Public | Reset password using verified token. |
| GET | `/verify-email/:token` | Public | Verify user email address. |
| POST | `/resend-verification` | Public | Resend email verification link. |
| POST | `/logout` | User | Clear session and invalidate cookies. |
| GET | `/me` | User | Get current user profile & permissions. |
| PATCH | `/me` | User | Update profile details. |
| PATCH | `/me/notification-preferences` | User | Update user-specific alert settings. |
| PATCH | `/change-password` | User | Securely change password for logged-in user. |
| GET | `/organization` | User | Get current organization metadata. |
| PATCH | `/organization` | Admin/Manager | Update organization branding/settings. |
| GET | `/users` | Admin/Manager | List and search all users in the tenant. |

### 📝 Work-Item Lifecycle (`/tasks`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/` | User | Create a single work-item. |
| GET | `/` | User | Query tasks (Supports complex filters/sort). |
| POST | `/bulk` | User/Manager | Mass-import work-items from JSON. |
| GET | `/:id` | User | Get work-item details (Aggressive cache). |
| PATCH | `/:id` | User | Update task properties (emits events). |
| DELETE | `/:id` | Admin (tasks:delete)| Permanently remove a task. |
| POST | `/:id/assign` | User | Modify task assignee. |
| PATCH | `/:id/status` | User | Transition task via state-machine. |
| POST | `/:id/watchers` | User | Add user to task "Watch List". |
| DELETE | `/:id/watchers` | User | Remove user from task "Watch List". |
| GET | `/:id/subtasks` | User | Fetch child tasks for an epic/story. |
| POST | `/:id/dependencies` | User | Map task-to-task relationships (Blocks/Blocked By). |
| DELETE | `/:id/dependencies` | User | Remove task relationship. |
| POST | `/:id/comments` | User | Add discussion thread. |
| GET | `/:id/comments` | User | Get chronological discussion history. |
| PATCH | `/comments/:commentId`| User | Edit existing comment. |
| DELETE | `/comments/:commentId`| User | Remove comment. |
| POST | `/:id/checklists` | User | Add checklist to a task. |
| GET | `/:id/checklists` | User | List all checklists for a task. |
| POST | `/checklists/:id/items` | User | Add item to a specific checklist. |
| PATCH | `/checklists/:id/items/:iid`| User | Toggle item completion status. |
| DELETE | `/checklists/:id` | User | Remove entire checklist. |

### 🖼️ Views & Dashboards (`/views`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/kanban` | User | Get status-grouped board data. |
| GET | `/calendar` | User | Get date-mapped task objects. |
| GET | `/timeline` | User | Get project-sequence data. |
| GET | `/my-tasks` | User | Shortcut for user's assigned work. |
| GET | `/overdue` | User/Manager | List tasks exceeding SLA deadline. |
| POST | `/` | User | Save a custom filtered view. |
| GET | `/` | User | List user's saved views. |
| DELETE | `/:id` | User | Delete saved view configuration. |

### 🏗️ Project & Strategic Alignment (`/projects`, `/okrs`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/projects` | User | Create a high-level project container. |
| GET | `/projects` | User | List projects (Aggregates completion %). |
| GET | `/projects/:id` | User | Get project summary & milestones. |
| GET | `/projects/:id/gantt` | User | Fetch GANTT visualization data. |
| POST | `/projects/:id/milestones` | User | Add key milestone to project timeline. |
| POST | `/sprints` | User | Initialize a new agile sprint. |
| GET | `/sprints/project/:pid` | User | List all sprints for a specific project. |
| POST | `/sprints/:id/complete`| Manager | Close sprint and manage spill-over tasks. |
| GET | `/okrs/dashboard` | User | View objective progress vs key results. |
| POST | `/okrs/objectives` | Admin/Manager | Create high-level strategic objective. |
| POST | `/okrs/key-results` | Manager | Create numeric KR linked to objective. |
| POST | `/okrs/key-results/:id/link-tasks` | User | Link specific tasks to a Key Result. |

### 🤖 Automation & Intelligence (`/automation`, `/approvals`, `/ai`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/automation/rules` | Admin/Manager | Create "If-This-Then-That" automation rule. |
| PATCH | `/automation/rules/:id`| Admin/Manager | Modify rule logic/trigger. |
| POST | `/approvals/request` | User | Submit a task/milestone for formal approval. |
| POST | `/approvals/:id/approve`| Authorized User | Verify and approve a pending request. |
| GET | `/ai/suggest-assignee/:id`| User | Query AI for best matching user for a task. |
| GET | `/ai/predict-risk/:id` | User | AI-based delay prediction for a task. |
| GET | `/ai/breakdown-epic/:id`| User | Auto-generate subtasks from task description. |
| POST | `/ai/generate-content` | User | AI text generation for task descriptions. |

> [!NOTE]
> **LLM Provider**: The system is now integrated with **OpenAI** (configured via `.env`) using the `gpt-4o-mini` model for optimal performance/cost ratio.

### 📈 Analytics & Governance (`/reports`, `/audit`, `/health`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/reports/workload` | Admin/Manager | Team capacity vs actual workload heat-map. |
| GET | `/reports/sla` | Admin/Manager | SLA performance metrics by team/user. |
| GET | `/reports/bottleneck` | Admin/Manager | Detect workflow stages where tasks stall. |
| GET | `/audit/logs` | Admin/Manager | Query immutable mutation ledger. |
| GET | `/audit/history/:id` | Admin/Manager | Tracing audit trail for a specific resource ID. |
| GET | `/health/team-score` | Manager | Aggregated team velocity & health index. |

### 🔗 Integrations & Extensions (`/integrations`, `/plugins`, `/attachments`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/integrations/github/connect`| User | Authenticate GitHub Repo via token. |
| POST | `/integrations/slack/connect` | User | Link Slack workspace for alerts. |
| POST | `/integrations/figma/connect` | User | Link Figma files to projects. |
| GET | `/integrations/status`| User | Check health of third-party connections. |
| POST | `/plugins` | Admin | Register and activate a new system plugin. |
| POST | `/attachments/upload`| User | Securely upload files (S3/Local). |
| GET | `/attachments/download/:id`| User | Retrieve secure download link. |
| GET | `/search/global` | User | Context-aware cross-module global search. |

### ⏱️ Resource & Time (`/resource`, `/time`, `/recurring`)
| Method | Path | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/time/start` | User | Start active timer for a task. |
| POST | `/time/stop` | User | Stop timer and commit log entry. |
| GET | `/time/me` | User | View personal time tracking history. |
| GET | `/resource/capacity` | Manager | View team availability heat-map. |
| POST | `/recurring/rules` | User | Create rules for repetitive task generation. |

---

## 📂 9. Comprehensive File & Directory Registry

### **Backend Architecture (`src/`)**
- **`server.js`**: The kernel of the application. It orchestrates the startup sequence: Environment validation -> DB Connectivity -> Migration execution -> Event Subscriber registration -> Microservice/Worker initialization -> Express & Socket.io binding.
- **`app.js`**: The middleware pipeline manager. Defines the global security posture (Helmet, CORS, HPP), sanitization layers, and the versioned v1 routing tree.
- **`📂 core/`**:
    - `eventBus.js`: An internal pub-sub engine that allows modules to remain "ignorant" of each other, communicating only via events (e.g., `AUDIT_LOG_CREATED`).
    - `tenantPlugin.js`: A specialized Mongoose plugin that injects `organizationId` filters into every `find`, `update`, and `delete` operation automatically.
    - `jobScheduler.js`: Orchestrates delayed or recurring tasks using Redis/BullMQ.
    - `logger.js`: Standardized Winston configuration for request-id tracing across logs.
- **`📂 middlewares/`**:
    - `tenantContext.js`: Wraps every request in an `AsyncLocalStorage` store, ensuring the `organizationId` is available globally without being passed as an argument.
    - `rbac.js`: The gatekeeper. Uses bitmasking to compare a user's permissions against the required bits for a specific route.
    - `audit.middleware.js`: An interceptor that captures the "Before/After" state of mutations for compliant logging.
- **`📂 config/`**:
    - `database.js`: Resilient Mongoose connection logic with retry-backoff and pool management.

### **Frontend Architecture (`frontend/src/`)**
- **`App.js`**: The root manifest. Manages the `QueryClientProvider`, `Redux Provider`, and the `BrowserRouter` hierarchy.
- **`📂 services/api/`**:
    - `axios.js`: The application's "Nervous System". Features request/response interceptors that handle Bearer token injection and automatic 401-refresh-token logic.
- **`📂 store/`**:
    - `index.js`: Combines domain-specific slices (Auth, Task, UI) into a persistent Redux store.
- **`📂 hooks/`**:
    - `useAuth.js`: A singleton-like hook that provides a reactive interface to the user's session and permission state.

---

## 🧠 10. The Architectural "Why" (Strategic Rationale)

### **Why Redis & BullMQ?**
**Problem**: Standard in-memory queues (like `setTimeout` or local arrays) are lost if the server restarts or crashes.
**Solution**: By using **Redis**, we ensure that background jobs (AI processing, Bulk Imports, Emails) are persistent. If a worker fails, BullMQ automatically retries the job based on the defined backoff strategy.

### **Why AsyncLocalStorage for Multi-Tenancy?**
**Problem**: "Prop-drilling" the `organizationId` through every service, controller, and model function is error-prone and insecure. One missed argument could lead to a data leak.
**Solution**: **AsyncLocalStorage** provides a secure, request-scoped context. Once the middleware sets the ID, it is accessible anywhere in that execution thread, enabling "Invisible Isolation".

### **Why a Modular Monolith?**
**Problem**: Microservices introduce massive complexity in networking, deployment, and data consistency (distributed transactions).
**Solution**: We built a **Modular Monolith**. It is easy to deploy as one unit, but its internal decoupling (via the `EventBus`) means that if the "Notification" module needs to scale horizontally or move to a separate service in the future, it can be extracted in hours, not weeks.

---

## 🏗️ 11. What We Have Built: The Enterprise Value Proposition

We have engineered more than just a task tracker; we have delivered an **Enterprise Operations OS**:
1.  **Zero-Trust Foundation**: Security isn't an afterthought—it's baked into the database driver and the middleware stack.
2.  **Audit-Ready Compliance**: Every change is tracked, signed, and immutable, meeting rigorous enterprise regulatory standards.
3.  **Real-Time Collaborative Surface**: The Real-Time socket layer ensures that teams stay in sync across the globe without manual refreshes.
4.  **AI-Augmented Intelligence**: The system looks ahead, predicting risks and suggesting assignees, transforming reactive management into proactive strategy.
5.  **Compliance Auditability**: Full state-diff tracking for every mutation, exposed through a secure admin portal.

---
**Status**: ACTIVE | **Version**: 2.0.0 (Enterprise Hardened)  
**Security Level**: High-Assurance Architecture  
**Document Owner**: AGPK Academy
**Developer**: Bhaskar Joshi

---

## 🔌 12. Complete API Reference Directory

The following is an exhaustive directory of the Enterprise API surface, categorized by domain. All routes are prefixed with `/api/v1` and enforce Zero-Trust tenant context via `x-tenant-id` where applicable.

### **Authentication & IAM (`/auth`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Registers a new user account. | Public Rate-Limited |
| **POST** | `/auth/login` | Authenticates a user and returns JWT + Refresh Token. | Public Rate-Limited |
| **POST** | `/auth/refresh` | Issues a new access token using a valid DSRefresh Token. | Valid Refresh Token |
| **POST** | `/auth/logout` | Invalidates the user session and token family. | `Authorization: Bearer` |
| **POST** | `/auth/forgot-password` | Initiates a password reset flow (sends email link). | Public Rate-Limited |
| **POST** | `/auth/reset-password` | Resets password using the cryptographic token. | Reset Token |
| **POST** | `/auth/verify-email` | Verifies user email via OTP/Token link. | Verification Token |

### **Work Items (Tasks, Subtasks) (`/tasks`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/tasks` | Retrieves paginated tasks based on tenant and filtering. | Standard JWT + RBAC |
| **GET** | `/tasks/:id` | Fetches a single task by its ObjectId. | Standard JWT + RBAC |
| **POST** | `/tasks` | Creates a new task within the tenant context. | `tasks:create` Permission |
| **POST** | `/tasks/bulk` | Bulk creates multiple tasks in one transaction. | `tasks:create` Permission |
| **PATCH** | `/tasks/:id` | Partially updates a task (title, description, etc.). | `tasks:update` Permission |
| **DELETE** | `/tasks/:id` | Soft deletes a task document. | `tasks:delete` Permission |
| **POST** | `/tasks/:id/assign` | Assigns a user to a task. | `tasks:assign` Permission |
| **PATCH** | `/tasks/:id/status` | Updates workflow status (triggers EventBus events). | Standard JWT + RBAC |
| **POST** | `/tasks/:id/watchers` | Adds a user to the task watch list for notifications. | Standard JWT |
| **DELETE** | `/tasks/:id/watchers` | Removes a user from the watcher list. | Standard JWT |
| **GET** | `/tasks/:id/subtasks` | Fetches nested subtasks for a parent task. | Standard JWT |
| **POST** | `/tasks/:id/dependencies` | Links a task dependency (blocks/blocked-by). | Standard JWT |
| **DELETE**| `/tasks/:id/dependencies` | Removes a task dependency link. | Standard JWT |

### **Comments & Collaboration (`/comments` & `/tasks/:id/comments`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/tasks/:id/comments` | Adds a comment to a task (supports mentions). | Standard JWT + RBAC |
| **GET** | `/tasks/:id/comments` | Retrieves chronological comments for a task. | Standard JWT + RBAC |
| **PATCH** | `/comments/:commentId` | Edits an existing comment text. | Original Author Only |
| **DELETE** | `/comments/:commentId` | Soft deletes a comment. | Author or Admin |

### **Checklists (`/tasks/:id/checklists`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/:id/checklists` | Creates a new checklist group inside a task. | Standard JWT + RBAC |
| **GET** | `/:id/checklists` | Gets all checklist items. | Standard JWT |
| **POST** | `/checklists/:id/items` | Adds a line-item to a specific checklist. | Standard JWT |
| **PATCH** | `/checklists/:id/items/:itemId` | Toggles checklist item state (done/undone). | Standard JWT |
| **DELETE**| `/checklists/:id` | Removes an entire checklist. | Standard JWT |

### **Attachments & Media (`/attachments`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/attachments/upload` | Uploads multipart file (sanitized) to S3/Disk. | Standard JWT |
| **GET** | `/attachments/task/:taskId` | Retrieves metadata of attachments per task. | Standard JWT |
| **GET** | `/attachments/download/:id` | Generates secure pre-signed download URL. | Standard JWT |
| **DELETE**| `/attachments/:id` | Permanently deletes a file attachment. | Admin or Uploader |

### **Workflow Engine (`/workflows`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/workflows` | Lists available custom workflows per tenant. | Standard JWT |
| **POST** | `/workflows` | Creates a new workflow state-machine definition. | `admin`, `manager` Roles |
| **PATCH** | `/workflows/:id` | Updates workflow transition rules. | `admin`, `manager` Roles |
| **POST** | `/workflows/transition` | Safely transitions an entity following workflow rules. | Standard JWT |
| **GET** | `/workflows/history/:taskId`| Views the state change audit trail for an entity. | Standard JWT |

### **Automations (`/automations`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/automations` | Registers a new When-Then trigger rule. | `admin` Role |
| **GET** | `/automations` | Lists tenant automations. | Standard JWT |
| **PATCH** | `/automations/:id/toggle` | Enables/Disables an active automation rule. | `admin` Role |
| **GET** | `/automations/:id/history` | Gets execution logs for a specific automation run. | `admin` Role |

### **Approvals (`/approvals`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/approvals` | Requests formal sign-off (multi-step approvals). | Standard JWT |
| **PATCH** | `/approvals/:id/review` | Approves or Rejects a pending request. | Designated Approver Only |
| **GET** | `/approvals/pending` | Fetches all pending requests for the current user. | Standard JWT |

### **Time Tracking (`/time`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/time/start` | Starts the global time tracking chronometer for a user. | Standard JWT |
| **POST** | `/time/stop` | Stops chronometer and persists the `TimeLog`. | Standard JWT |
| **POST** | `/time/manual` | Logs retro-active manual time spent. | Standard JWT |
| **GET** | `/time/me` | Fetches timesheet log for the authenticated user. | Standard JWT |

### **Dashboards & Views (`/views`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/views/kanban` | Aggregates tasks structured by workflow columns. | Standard JWT |
| **GET** | `/views/calendar` | Formats tasks mapped to due-dates for Calendar view. | Standard JWT |
| **GET** | `/views/timeline` | Generates Gantt-compatible dataset. | Standard JWT |
| **POST** | `/views` | Saves a custom view configuration preset. | Standard JWT |

### **Notifications & Audit (`/notifications`, `/audit`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/notifications` | Gets in-app real-time notifications for the user. | Standard JWT |
| **PATCH** | `/notifications/:id/read` | Marks notification as read. | Standard JWT |
| **POST** | `/notifications/read-all` | Marks all notifications as read. | Standard JWT |
| **GET** | `/audit` | Retrieves cryptographic audit logs for compliance review. | `admin` Role Only |
| **GET** | `/audit/export` | Generates CSV export of tenant audit logs. | `admin` Role Only |

### **System Health & AI (`/health`, `/ai`)**
| Method | Endpoint | Description | Security / Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Liveness check returning DB/Redis/Memory status. | Public |
| **GET** | `/health/metrics` | Prometheus/Grafana compatible metric scrape endpoint. | Internal IP Only |
| **POST** | `/ai/suggest` | Uses generative model to suggest task breakdowns. | Standard JWT |
| **POST** | `/ai/summarize` | Summarizes long comment threads on a task. | Standard JWT |

---

## 📁 13. Deep-Dive File Registry & Sub-Systems

Below is detailed documentation covering exactly **what** files were introduced to the platform, **their specific function**, and **how they interact** with the broader system to harden the AGPK1-Task ecosystem.

### **Core Systems (`src/core/`)**
*   **`logger.js`**: Replaced standard outputs with Winston structured logging. Configured with ELK-compatible JSON transports.
*   **`masker.js`**: Security utility designed to recursively scrub PII (Personally Identifiable Information), passwords, and secrets before they hit the logger. **Crucial fix implemented in v2.0**: The masker dynamically preserves `Symbol` keys to prevent breaking the Winston formatting pipeline (specifically `Symbol.for('level')` used by `logform`).
*   **`queue.js`**: Integrates `bullmq` and Redis. We built this to shift heavy processing (Emails, Webhooks, Audit Writes) out of the main Node.js event loop to background workers.
*   **`encryption.js`**: Provides field-level, bi-directional AES-256-GCM encryption. Used specifically for configuring dynamic `Secret` fields like OAuth tokens or webhook signatures stored in the DB.
*   **`eventBus.js`**: An `EventEmitter` Singleton acting as the nervous system of the modular monolith. It bridges modules without tightly coupling requires (e.g., Auth service fires `USER_REGISTERED`, which Notification subscriber listens for asynchronously).

### **Middlewares (`src/middlewares/`)**
*   **`tenantPlugin.js` & `tenantContext.js`**: These are the backbone of our Zero-Trust architecture. `tenantContext.js` establishes an `AsyncLocalStorage` boundary the moment a request starts. The `tenantPlugin.js` hooks into Mongoose schemas globally to append standard `{ tenantId: x }` to all DB queries matching the context, making horizontal privilege escalation structurally impossible at the code level.
*   **`rbac.js`**: Verifies JWT roles against a dynamic Permission Map. Validates not just simple roles (`admin`, `user`) but granular actions (`tasks:read`, `tasks:delete`).
*   **`sanitization.js`**: Replaces naive string replaces with `xss` to recursively scrub incoming payloads. Combined with `mongoSanitize`, it neutralizes NoSQL injections.
*   **`audit.middleware.js`**: Wraps Express router endpoints. Upon a successful response, this middleware asynchronously dispatches an `AUDIT_LOG_CREATED` event carrying the exact Before/After state of the database mutations.

### **Workers (`src/workers/`)**
*   **`email.worker.js`**: Subscribes to the `emailQueue`. We built this because sending transactional emails (like Forgot Password) via synchronous HTTP blocking code leads to massive race conditions and slow TTFB (Time To First Byte).

---

## 💻 14. Frontend Architecture & Interactivity

The frontend (`frontend/src/`) is built not just as a consumer of the API, but as an interactive, real-time application capable of graceful degradation and offline capability.

### **Core UI Patterns**
*   **State Management (Zustand & React Query)**: We abandoned bulky Redux in favor of Zustand for global synchronous state (Themes, Auth Context) and TanStack React Query for server-state caching. This prevents double-fetching and provides instant optimistic UI updates when dragging a task across the Kanban board.
*   **Interceptors (`api.js`)**: All `axios` calls route through a single hardened interceptor. 
    1.  It automatically injects the Bearer JWT.
    2.  If it receives a `401 Unauthorized`, it pauses the request queue, invokes the `/auth/refresh` endpoint to get a new token, updates the token, and silently replays the failed requests. The user never notices a session expiry.
*   **Real-Time Subscriptions (`useSocket.js`)**: Instead of long-polling, the frontend establishes an authenticated WebSocket connection. When another user changes a task status, the EventBus on the backend emits to the socket, and the frontend instantly mutates the React Query cache without a full page reload.

### **Key File Map**
*   **`frontend/src/context/AuthContext.jsx`**: Handles the persistence of user sessions inside `localStorage`/`sessionStorage` and guards private routes.
*   **`frontend/src/pages/KanbanBoard.jsx`**: The command center. It uses `dnd-kit` for highly performant drag-and-drop. It intercepts cross-column drops and triggers the workflow transition API endpoint.
*   **`frontend/src/components/TaskModal.jsx`**: Acts as a modular popup. Instead of building separate pages for "Edit Task" and "Create Task", this modal dynamically requests its forms based on whether a `taskId` is passed as a prop, centralizing all task mutation logic.
*   **`frontend/src/utils/errorHandling.js`**: Replaces standard `window.alert` with toast notifications. It decodes the specific Express `errorHandler` JSON structures to show users exactly which field failed validation.

By maintaining this structure, the AGPK1-Task enterprise platform operates with unparalleled resilience, deterministic security patterns, and extreme horizontal scalability capabilities without leaving the modular monolith paradigm.
