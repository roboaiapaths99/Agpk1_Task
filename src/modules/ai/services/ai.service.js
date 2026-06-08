const Task = require('../../work-item/models/Task');
const User = require('../../auth/models/User');

class AIService {
    async suggestAssignee(taskId) {
        const task = await Task.findById(taskId);
        if (!task) throw new Error("Task not found");

        const users = await User.find({ organizationId: task.organizationId }).select('name email');
        const workloads = await Task.aggregate([
            { $match: { organizationId: task.organizationId, status: { $ne: 'completed' } } },
            { $group: { _id: '$assignee', count: { $sum: 1 } } }
        ]);

        const systemPrompt = `You are an Operations Research Specialist.
Based on the task details and team workload, suggest the best assignee.
Return a JSON object: { "suggestedUserId": "ID", "name": "Name", "reason": "Reason for selection" }`;

        const userPrompt = `Task: ${task.title} (${task.description || 'No description'})
Priority: ${task.priority}
Team Workload: ${JSON.stringify(workloads)}
Available Users: ${JSON.stringify(users)}`;

        const generated = await this._callLLM(systemPrompt, userPrompt);
        return generated;
    }

    async predictDelayRisk(taskId) {
        const task = await Task.findById(taskId);
        if (!task) return { risk: 'unknown' };

        const systemPrompt = `You are a Risk Assessment AI.
Analyze the task and predict the risk of delay.
Return a JSON object: { "riskScore": 0-100, "riskLevel": "high|medium|low", "factors": ["reason1", "reason2"] }`;

        const userPrompt = `Task: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Due Date: ${task.dueDate}
Created At: ${task.createdAt}`;

        const generated = await this._callLLM(systemPrompt, userPrompt);
        return generated;
    }

    async breakdownEpic(epicId) {
        const epic = await Task.findById(epicId);
        if (!epic || epic.issueType !== 'epic') {
            throw new Error('Valid Epic ID is required');
        }

        const systemPrompt = `You are a Project Management Consultant. 
Break down the provided Epic into a logical set of child tasks (Stories/Tasks).
Return a JSON object with this exact structure:
{
  "epicTitle": "Original Epic Title",
  "suggestions": [
    { "title": "Task Title", "description": "Detailed task description", "storyPoints": number, "priority": "low|medium|high|critical" }
  ]
}
Each Epic should yield 4-7 meaningful tasks that cover the scope fully.`;

        const userPrompt = `Epic Title: ${epic.title}
Epic Description: ${epic.description || 'No description provided'}`;

        const generated = await this._callLLM(systemPrompt, userPrompt);
        return generated;
    }

    async predictTeamHealth(organizationId) {
        if (!organizationId) return { overallHealth: 'Unknown', indicators: [] };

        const mongoose = require('mongoose');
        const stats = await Task.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    status: { $in: ['in_progress', 'open'] }
                }
            },
            {
                $group: {
                    _id: '$assignee',
                    taskCount: { $sum: 1 },
                    highPriorityCount: {
                        $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] }
                    }
                }
            }
        ]);

        const healthIndicators = stats.map(s => ({
            userId: s._id,
            burnoutRisk: s.taskCount > 8 || s.highPriorityCount > 4 ? 'High' : s.taskCount > 5 ? 'Medium' : 'Low',
            recommendation: s.taskCount > 8 ? 'Critical over-allocation - reassign tasks' : s.taskCount > 5 ? 'Monitor workload closely' : 'Operating within capacity'
        }));

        const isHealthy = healthIndicators.every(h => h.burnoutRisk !== 'High');

        return {
            overallHealth: isHealthy ? 'Healthy' : 'Needs Attention',
            moraleScore: isHealthy ? 88 : 64,
            indicators: healthIndicators,
            recommendation: isHealthy
                ? 'Team is operating efficiently. No immediate action required.'
                : 'High burnout risk detected in specific members. Review resource allocation.'
        };
    }

    async _callLLM(systemPrompt, userPrompt) {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

        if (!apiKey) {
            throw new Error("Gemini API Key is missing in environment configuration.");
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const requestBody = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: userPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            };

            if (systemPrompt) {
                requestBody.systemInstruction = {
                    parts: [
                        { text: systemPrompt }
                    ]
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const rawMessage = errorData.error?.message || response.statusText || 'Unknown error';
                throw new Error(`Gemini AI Service currently unavailable: ${rawMessage}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                throw new Error("Empty response received from Gemini AI model.");
            }

            let text = data.candidates[0].content.parts[0].text;
            if (!text) {
                throw new Error("No text content returned from Gemini model.");
            }

            // Clean markdown code blocks if present
            text = text.trim();
            if (text.startsWith('```json')) {
                text = text.substring(7);
            } else if (text.startsWith('```')) {
                text = text.substring(3);
            }
            if (text.endsWith('```')) {
                text = text.substring(0, text.length - 3);
            }
            text = text.trim();

            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini LLM Call Failed:", error);
            throw error;
        }
    }

    async generateWorkflow(prompt) {
        if (!prompt) throw new Error("Prompt is required for workflow generation");

        const systemPrompt = `You are a professional Workflow Architect. 
Generate a realistic project management state machine based on the user's description.
Return a JSON object with this exact structure:
{
  "name": "Professional Workflow Name",
  "states": [
    { "name": "STATE_NAME", "type": "initial|active|terminal", "color": "HEX_COLOR" }
  ],
  "transitions": [
    { "from": "STATE_NAME", "to": "STATE_NAME", "requiresComment": boolean }
  ]
}
Guidelines:
- "initial": Use exactly one initial state.
- "terminal": At least one terminal (finished) state.
- "color": Use premium Tailwind-style hex colors (e.g., Indigo-500: #6366f1, Emerald-500: #10b981).
- Logic: Transitions should be realistic (e.g., cannot move from 'To Do' directly to 'Done' without 'In Progress').
- JSON ONLY: Do not include any text outside the JSON object.`;

        const generated = await this._callLLM(systemPrompt, `Generate a workflow for: ${prompt}`);

        return {
            name: generated.name || "AI Generated Workflow",
            description: `AI-architected flow for: ${prompt}`,
            states: generated.states,
            transitions: generated.transitions
        };
    }

    async generateContent(prompt, context = "") {
        if (!prompt) throw new Error("Prompt is required");

        const systemPrompt = `You are an Enterprise Documentation Specialist. 
Generate high-quality, professional Markdown content based on the user's request.
Incorporate any provided context naturally.
Return ONLY a JSON object: { "content": "THE_MARKDOWN_CONTENT" }`;

        const userPrompt = `Request: ${prompt}
${context ? `Context: ${context}` : ''}`;

        const generated = await this._callLLM(systemPrompt, userPrompt);
        return generated;
    }
}

module.exports = new AIService();
