# 📖 agpk1-task — Ultimate API Specification (V1.0)

This document provides 100% of the "real and full" detail for every module in the **agpk1-task** ecosystem. Use this to integrate your UI or generate highly accurate frontend prompts.

---

## 🔐 Auth & Identity
| Method | Endpoint | Payload Snippet | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "name": "...", "email": "...", "password": "..." }` | New user signup |
| POST | `/api/auth/login` | `{ "email": "...", "password": "..." }` | Returns `{ token, user }` |
| GET | `/api/auth/me` | N/A | Get profile + preferences |
| GET | `/api/auth/users` | N/A | [Admin] List all users |

---

## 📝 Task Management (The Heart)
### Task Schema Detail
`_id`, `title`, `description`, `status` (OPEN, IN_PROGRESS, COMPLETED, etc.), `priority`, `assignee` (User ID), `project` (Project ID), `tags` (Array), `dueDate`, `watchers` (User IDs).

| Method | Endpoint | Payload Snippet |
|---|---|---|
| POST | `/api/tasks` | `{ "title": "...", "priority": "high", "dueDate": "2026-..." }` |
| GET | `/api/tasks` | Query: `?status=open&assignee=ID&search=...` |
| PATCH | `/api/tasks/:id` | `{ "title": "New Title", "status": "in_progress" }` |
| POST | `/api/tasks/bulk` | `{ "tasks": [{ "title": "A" }, { "title": "B" }] }` |
| PATCH| `/api/tasks/:id/status`| `{ "status": "completed" }` |

---

## 🔄 Workflow & State Engine
| Method | Endpoint | Payload Snippet | Description |
|---|---|---|---|
| POST | `/api/workflows/transition`| `{ "taskId": "...", "toState": "in_review", "reason": "Done" }` | Triggers role-based transition |
| GET | `/api/workflows/history/:id`| N/A | Timeline of all state changes for a task |

---

## 👁️ Advanced Views (Visualizers)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/views/kanban` | Grouped by status: `{ "open": [...], "in_progress": [...] }` |
| GET | `/api/views/timeline` | Nodes & Edges for GANTT charts |
| GET | `/api/views/calendar` | Tasks for specific month/week date ranges |
| GET | `/api/views/workload` | Assignee-based task counts for heatmap rendering |

---

## ✅ Approvals & Governance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/approvals/request` | `{ "taskId": "...", "chainName": "Budget Approval" }` |
| POST | `/api/approvals/:id/approve`| `{ "comment": "Looks good" }` |
| GET | `/api/approvals/pending` | List requests awaiting the current user's decision |

---

## ⚡ Automation & Auto-Tasking
| Method | Endpoint | Payload Snippet | Description |
|---|---|---|---|
| POST | `/api/automation/rules` | `{ "name": "...", "triggerEvent": "TASK_CREATED", "conditions": [...], "actions": [...] }` | Define IF-THEN logic |
| POST | `/api/auto-tasks` | Manual trigger for template-based generation |

---

## 📊 Analytics & Reporting
| Method | Endpoint | Output Detail |
|---|---|---|
| GET | `/api/reports/workload`| Task counts per user |
| GET | `/api/reports/sla` | Breached vs Achieved counts |
| GET | `/api/reports/bottleneck`| Average time spent in each state across tasks |
| GET | `/api/health/team-score`| 1-100 score based on throughput and SLA health |

---

## 🕰️ Time Tracking & Logs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/time/start/:id` | Starts server-side timer (Max 1 active per user) |
| POST | `/api/time/stop/:id` | Stops timer and increments `actualHours` on Task |
| POST | `/api/time/log` | `{ "taskId": "...", "duration": 120, "description": "Manual log" }` |

---

## 🛡️ Audit & Plugins
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/logs` | [Admin] Full immutable log of all system actions |
| GET | `/api/audit/history/:id`| Full audit trail for a specific Entity/Task |
| GET | `/api/plugins` | List registered external marketplace integrations |

---

## 🧠 AI Layer (Powered by OpenAI GPT-4o-mini)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/ai/suggest-assignee/:id`| Returns suggested User ID based on lowest workload & skills |
| GET | `/api/v1/ai/predict-risk/:id` | Risk score (0-100) based on overdue & priority data |
| GET | `/api/v1/ai/breakdown-epic/:id`| Auto-generate subtasks from task description |
| POST | `/api/v1/ai/generate-content` | AI text generation for task descriptions |

> [!IMPORTANT]
> All AI routes require a valid `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in the `.env`. The system defaults to `gpt-4o-mini` for high-throughput enterprise reasoning.

---

## 🤖 UI Developer Prompt (The "Golden" Prompt)
> "Generate a sophisticated React Dashboard for **agpk1-task**. Use **Next.js 14**, **Tailwind CSS**, **Shadcn UI**, and **React Query**.
> 
> **Integration Checklist:**
> 1. Use `/api/tasks` for the main list with full CRUD.
> 2. Implement `/api/views/kanban` for a Trello-like DND board.
> 3. Implement `/api/time/start` and stop for a floating Global Timer component.
> 4. Use `/api/reports` to build a high-density 'Executive Dashboard' with Charts.
> 5. Design a 'Workflow Transition' modal that hits `/api/workflows/transition`.
> 
> Theme: **Premium Dark Mode**, Slate & Indigo accents, Glassmorphism cards with subtle 2px borders, Inter fonts."
