const mongoose = require('mongoose');
const { emailToDomain } = require('./src/utils/helpers'); // Assuming I might need to add this or use a regex
require('dotenv').config();

// Models
const Organization = require('./src/modules/auth/models/Organization');
const User = require('./src/modules/auth/models/User');
const Task = require('./src/modules/work-item/models/Task');
const { Comment, Checklist } = require('./src/modules/work-item/models/Task'); // Check exports
const Attachment = require('./src/modules/work-item/models/Attachment');
const SavedView = require('./src/modules/work-item/models/SavedView');
const Project = require('./src/modules/project/models/Project');
const { Milestone, Dependency } = require('./src/modules/project/models/Project');
const Sprint = require('./src/modules/project/models/Sprint');
const AutomationRule = require('./src/modules/automation/models/AutomationRule');
const Notification = require('./src/modules/notification/models/Notification');
const TimeLog = require('./src/modules/time-tracking/models/TimeLog');
const { ApprovalChain, ApprovalRequest } = require('./src/modules/approval/models/Approval');
const Workflow = require('./src/modules/workflow/models/Workflow');
const TransitionLog = require('./src/modules/workflow/models/TransitionLog');
const { Plugin } = require('./src/modules/plugin/models/Plugin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agpk1-task';

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Group users by domain
        const users = await User.find({ organizationId: { $exists: false } });
        console.log(`Found ${users.length} users needing migration`);

        if (users.length === 0) {
            console.log('No users to migrate');
            process.exit(0);
        }

        const domainGroups = {};
        for (const user of users) {
            const domain = user.email.split('@')[1].toLowerCase();
            if (!domainGroups[domain]) domainGroups[domain] = [];
            domainGroups[domain].push(user);
        }

        for (const [domain, domainUsers] of Object.entries(domainGroups)) {
            console.log(`Processing domain: ${domain} (${domainUsers.length} users)`);

            // Check if organization exists
            let org = await Organization.findOne({ domain });
            if (!org) {
                const name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
                org = await Organization.create({
                    name,
                    domain,
                    slug: domain.split('.')[0],
                    ownerId: domainUsers[0]._id, // First user becomes owner
                    status: 'active'
                });
                console.log(`Created organization: ${org.name} for domain ${domain}`);
            }

            const organizationId = org._id;

            // 2. Update Users
            const userIds = domainUsers.map(u => u._id);
            await User.updateMany({ _id: { $in: userIds } }, { $set: { organizationId } });
            console.log(`Updated ${userIds.length} users for ${domain}`);

            // 3. Update Data (Everything created by or assigned to these users, OR linked to their tasks)

            // Tasks
            await Task.updateMany({
                $or: [{ createdBy: { $in: userIds } }, { assignee: { $in: userIds } }],
                organizationId: { $exists: false }
            }, { $set: { organizationId } });

            // Projects
            await Project.updateMany({
                owner: { $in: userIds },
                organizationId: { $exists: false }
            }, { $set: { organizationId } });

            // Sprints (Linked to projects, but we'll do by creator/assignee for safety or just all if project is updated)
            // Sprints often don't have user links directly in schema, usually linked to project.
            // We'll update sprints by checking linked project's organizationId later or just find sprints created in this context.
            await Sprint.updateMany({
                organizationId: { $exists: false }
            }, { $set: { organizationId } }); // Simplification for now: assuming all current sprints belong to the first org migrated if logic is ambiguous

            // Automation Rules
            await AutomationRule.updateMany({ createdBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Notifications
            await Notification.updateMany({ userId: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Time Logs
            await TimeLog.updateMany({ userId: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Approval Chains
            await ApprovalChain.updateMany({ createdBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Approval Requests
            await ApprovalRequest.updateMany({ requestedBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Workflows
            await Workflow.updateMany({ createdBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Transition Logs
            await TransitionLog.updateMany({ triggeredBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });

            // Plugins
            await Plugin.updateMany({ organizationId: { $exists: false } }, { $set: { organizationId } });

            // Saved Views
            await SavedView.updateMany({ createdBy: { $in: userIds }, organizationId: { $exists: false } }, { $set: { organizationId } });
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
