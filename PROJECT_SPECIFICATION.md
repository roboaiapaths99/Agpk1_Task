# 🚀 agpk1-task — Unified Project Specification

This is the master document for the **agpk1-task** Enterprise Platform. It combines the full API index, database schema details, and the "Golden" UI generation prompt.

---

## 🏛️ System Architecture
- **Type**: Modular Monolith (Node.js/Express/MongoDB)
- **Communication**: Event-Driven (Internal `EventBus` singleton)
- **Background Layer**: `node-cron` scheduled jobs for SLA/Overdue/Recurring tasks.
- **Security**: JWT Authentication + RBAC (`admin`, `manager`, `user`).

---

## 🔑 Authentication & Users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | User signup (Public) |
| POST | `/api/auth/login` | Login (Returns JWT + User object) |
| GET | `/api/auth/me` | Current profile & Notification preferences |
| GET | `/api/auth/users` | [Admin/Manager] List all system users |

---

## 📝 Work Item & Task Engine
**Core Schema**: `_id`, `title`, `description`, `status`, `priority`, `assignee`, `project`, `tags`, `dueDate`, `watchers`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create task (Triggers `TASK_CREATED` event) |
| GET | `/api/tasks` | Global task list (Supports complex filters) |
| GET | `/api/tasks/:id` | Full task details with sub-items |
| PATCH | `/api/tasks/:id` | Update any task field |
| POST | `/api/tasks/bulk` | High-performance bulk creation |
| PATCH | `/api/tasks/:id/status`| Single-field status update |
| POST | `/api/tasks/:id/watchers`| Subscribe user to real-time updates |

---

## 👁️ Smart Views (Visualizer Engine)
| Method | Endpoint | Use Case |
|---|---|---|
| GET | `/api/views/kanban` | Grouped columns for DND boards |
| GET | `/api/views/calendar` | Date-based items for monthly/weekly views |
| GET | `/api/views/timeline` | GANTT data (Tasks + Dependency Edges) |
| GET | `/api/views/my-tasks` | Personalized prioritized list |
| GET | `/api/views/overdue` | Critical items past their `dueDate` |
| GET | `/api/views/workload` | Team capacity heatmap data |

---

## 🔄 Workflow, Approvals & SLA
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workflows/transition`| Safe state transition with role checks |
| POST | `/api/approvals/request` | Initiate a multi-step approval chain |
| GET | `/api/approvals/pending` | User's approval inbox |
| POST | `/api/approvals/:id/approve`| Approve/Reject a specific step |
| GET | `/api/reports/sla` | Global SLA compliance tracking |

---

## ⏲️ Time Tracking & Logs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/time/start/:id` | Start real-time server-side timer |
| POST | `/api/time/stop/:id` | Stop timer and commit to `actualHours` |
| POST | `/api/time/log` | Manual timesheet entry |

---

## 🛡️ Governance, Health & AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/logs` | [Admin] Global immutable audit trail |
| GET | `/api/audit/history/:id`| Change history for a specific entity |
| GET | `/api/health/team-score`| Overall team performance score (1-100) |
| GET | `/api/ai/predict-risk/:id` | AI-driven delay risk prediction |
| GET | `/api/plugins` | List external integration webhooks |

---

## 🎨 Frontend Architecture (CRA + Tailwind)
- **Base Framework**: Create React App (CRA)
- **State Management**:
  - **Server State**: TanStack Query (React Query)
  - **Local UI State**: Zustand
- **Design System**:
  - **Colors**: Blue (#2563EB), Purple (#7C3AED), Slate (#0F172A).
  - **UI Library**: Shadcn UI (Radix based).
  - **Animations**: Framer Motion.

### 🧭 Core Layout
1. **Sidebar**: Navigation (Dashboard, Tasks, Projects, Approvals, Automation, Reports).
2. **Topbar**: Search, Global Timer, Notification Bell.
3. **Main Content**: Responsive container with persistent Sidebar.

### 🖥️ Key Screens
- **Dashboard**: KPI metrics + 3D/Gradient charts.
- **Kanban**: Drag-and-drop task lifecycle management.
- **Approvals**: Logic-gate for multi-step tasks.
- **Gantt**: Project dependency visualizer.

---

## 🤖 AI UI Generation Prompt ("The Golden Prompt")

**Copy and paste this into ChatGPT or Claude to build your frontend:**

> "Generate a sophisticated React Dashboard for **agpk1-task**. Use **Next.js 14**, **Tailwind CSS**, **Shadcn UI**, and **React Query**.
> 
> **Integration Checklist:**
> 1. Use `/api/tasks` for the main list with full CRUD.
> 2. Implement `/api/views/kanban` for a Trello-like DND board.
> 3. Implement `/api/time/start` and stop for a floating Global Timer component.
> 4. Use `/api/reports` to build a high-density 'Executive Dashboard' with Charts.
> 5. Design a 'Workflow Transition' modal that hits `/api/workflows/transition`.
> 
> **Design Theme**: Premium Dark Mode, Indigo accents, Glassmorphism cards with subtle 2px borders, Inter fonts. All API calls must include the Bearer Token from auth."
