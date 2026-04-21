const Task = require('../../work-item/models/Task');
const logger = require('../../../core/logger');

class IntegrationService {
    async handleExternalEvent(source, eventType, payload) {
        logger.info(`External Integration: ${source} triggered ${eventType}`);

        switch (eventType) {
            case 'GITHUB_PUSH':
            case 'GITLAB_PUSH':
                return this.handleGitPush(payload);
            case 'GITHUB_PR':
            case 'GITLAB_PR':
                return this.handleGitPR(payload);
            case 'CRM_DEAL_CLOSED':
                return Task.create({
                    title: `Onboard Client: ${payload.clientName}`,
                    description: `Deal closed in CRM for ${payload.amount}. Auto-created task.`,
                    sourceModule: 'CRM',
                    sourceId: payload.dealId,
                    priority: 'high',
                });
            default:
                logger.warn(`Unhandled external event: ${eventType} from ${source}`);
        }
    }

    async handleGitPush(payload) {
        const { commits, repository } = payload;
        for (const commit of commits) {
            // Regex to find task key like T-123 or ABC-123
            const taskKeyMatch = commit.message.match(/([A-Z]+-\d+)/);
            if (taskKeyMatch) {
                const taskKey = taskKeyMatch[1];
                const task = await Task.findOne({ key: taskKey });
                if (task) {
                    task.linkedCommits.push({
                        hash: commit.id || commit.hash,
                        message: commit.message,
                        author: commit.author.name || commit.author.username,
                        url: commit.url,
                        timestamp: new Date(commit.timestamp)
                    });
                    await task.save();
                    logger.info(`Linked commit ${commit.id} to task ${taskKey}`);
                }
            }
        }
    }

    async handleGitPR(payload) {
        const { pull_request, action, repository } = payload;
        const taskKeyMatch = pull_request.title.match(/([A-Z]+-\d+)/);
        if (taskKeyMatch) {
            const taskKey = taskKeyMatch[1];
            const task = await Task.findOne({ key: taskKey });
            if (task) {
                task.linkedPRs.push({
                    id: pull_request.number.toString(),
                    title: pull_request.title,
                    status: pull_request.state,
                    url: pull_request.html_url,
                    author: pull_request.user.login
                });

                // Auto-move to "In Review" if PR is opened
                if (action === 'opened' && task.status === 'in_progress') {
                    task.status = 'in_review';
                }

                await task.save();
                logger.info(`Linked PR #${pull_request.number} to task ${taskKey}`);
            }
        }
    }
}

module.exports = new IntegrationService();
