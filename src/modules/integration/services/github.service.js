const crypto = require('crypto');
const IntegrationConfig = require('../models/IntegrationConfig');
const Task = require('../../work-item/models/Task');

class GitHubService {
    /**
     * Connect GitHub integration by storing the personal access token
     */
    async connect({ organizationId, accessToken, repoOwner, repoName, defaultProjectId, userId }) {
        // Generate a webhook secret for verifying incoming webhooks
        const webhookSecret = crypto.randomBytes(32).toString('hex');

        const config = await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'github' },
            {
                provider: 'github',
                organizationId,
                isActive: true,
                config: {
                    accessToken,
                    webhookSecret,
                    repoOwner: repoOwner || '',
                    repoName: repoName || '',
                    defaultProjectId: defaultProjectId || null,
                },
                connectedBy: userId,
                lastSyncAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return {
            success: true,
            webhookSecret,
            webhookUrl: `/api/integrations/github/webhook`,
            message: 'Add this webhook URL to your GitHub repository settings.',
        };
    }

    /**
     * Disconnect GitHub integration
     */
    async disconnect(organizationId) {
        await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'github' },
            { isActive: false, 'config.accessToken': '' }
        );
        return { success: true };
    }

    /**
     * Get connection status
     */
    async getStatus(organizationId) {
        const config = await IntegrationConfig.findOne({ organizationId, provider: 'github' })
            .populate('connectedBy', 'name email')
            .lean();

        if (!config) return { connected: false };

        return {
            connected: config.isActive,
            repoOwner: config.config?.repoOwner,
            repoName: config.config?.repoName,
            connectedBy: config.connectedBy,
            lastSyncAt: config.lastSyncAt,
        };
    }

    /**
     * Verify GitHub webhook signature
     */
    verifyWebhookSignature(payload, signature, secret) {
        if (!signature || !secret) return false;
        const expectedSig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    }

    /**
     * Handle incoming GitHub webhook event
     */
    async handleWebhook(eventType, payload, organizationId) {
        const results = { linked: [], closed: [] };

        if (eventType === 'push') {
            // Process each commit
            for (const commit of (payload.commits || [])) {
                const taskKeys = this.parseTaskKeys(commit.message);
                for (const key of taskKeys) {
                    const task = await Task.findOne({ key, organizationId });
                    if (!task) continue;

                    // Add commit to linked commits
                    const commitData = {
                        sha: commit.id,
                        message: commit.message,
                        author: commit.author?.name || 'Unknown',
                        url: commit.url,
                        timestamp: commit.timestamp,
                    };

                    if (!task.linkedCommits) task.linkedCommits = [];
                    const exists = task.linkedCommits.some(c => c.sha === commit.id);
                    if (!exists) {
                        task.linkedCommits.push(commitData);
                        results.linked.push({ taskKey: key, commit: commit.id.substring(0, 7) });
                    }

                    // Auto-close if commit message says "Closes" or "Fixes"
                    if (this.shouldAutoClose(commit.message, key)) {
                        task.status = 'completed';
                        results.closed.push(key);
                    }

                    await task.save();
                }
            }
        } else if (eventType === 'pull_request') {
            const pr = payload.pull_request;
            if (!pr) return results;

            const taskKeys = this.parseTaskKeys(pr.title + ' ' + (pr.body || ''));
            for (const key of taskKeys) {
                const task = await Task.findOne({ key, organizationId });
                if (!task) continue;

                const prData = {
                    number: pr.number,
                    title: pr.title,
                    url: pr.html_url,
                    state: pr.state,
                    author: pr.user?.login || 'Unknown',
                    merged: pr.merged || false,
                };

                if (!task.linkedPRs) task.linkedPRs = [];
                const existIdx = task.linkedPRs.findIndex(p => p.number === pr.number);
                if (existIdx >= 0) task.linkedPRs[existIdx] = prData;
                else task.linkedPRs.push(prData);

                // Auto-complete on PR merge
                if (pr.merged && payload.action === 'closed') {
                    task.status = 'completed';
                    results.closed.push(key);
                }

                results.linked.push({ taskKey: key, pr: pr.number });
                await task.save();
            }
        }

        return results;
    }

    /**
     * Extract task keys (e.g., TASK-42) from commit messages
     */
    parseTaskKeys(text) {
        if (!text) return [];
        const regex = /[A-Z]+-\d+/g;
        const matches = text.match(regex) || [];
        return [...new Set(matches)];
    }

    /**
     * Check if commit message indicates auto-close
     */
    shouldAutoClose(message, taskKey) {
        if (!message) return false;
        const patterns = [
            new RegExp(`(?:closes?|fixes?|resolves?)\\s+${taskKey}`, 'i'),
            new RegExp(`(?:closes?|fixes?|resolves?)\\s+#?\\d+`, 'i'),  // numeric refs
        ];
        return patterns.some(p => p.test(message));
    }
}

module.exports = new GitHubService();
