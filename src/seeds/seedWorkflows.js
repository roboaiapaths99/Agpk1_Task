const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const { Workflow } = require('../modules/workflow/models/Workflow');
const { Project } = require('../modules/project/models/Project');
const Organization = require('../modules/auth/models/Organization');
const User = require('../modules/auth/models/User');
const logger = require('../core/logger');

const seedWorkflows = async () => {
    try {
        await connectDB();

        let org = await Organization.findOne();
        if (!org) {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) throw new Error('No admin user found to own organization');

            org = await Organization.create({
                name: 'Default Org',
                domain: 'agpk1.com',
                slug: 'default-org',
                ownerId: admin._id
            });
            logger.info('Created default organization');
        }

        const workflowData = {
            name: 'Standard Software Development',
            description: 'Default Jira-style workflow for software projects',
            organizationId: org._id,
            defaultState: 'todo',
            states: [
                { name: 'todo', type: 'initial', color: '#64748b' },
                { name: 'in_progress', type: 'active', color: '#3b82f6' },
                { name: 'technical_review', type: 'active', color: '#8b5cf6' },
                { name: 'testing', type: 'active', color: '#f59e0b' },
                { name: 'done', type: 'terminal', color: '#10b981' }
            ],
            transitions: [
                { from: 'todo', to: 'in_progress', organizationId: org._id },
                { from: 'in_progress', to: 'technical_review', organizationId: org._id },
                { from: 'technical_review', to: 'testing', organizationId: org._id },
                { from: 'testing', to: 'done', organizationId: org._id },
                { from: 'technical_review', to: 'in_progress', organizationId: org._id, requiresComment: true },
                { from: 'testing', to: 'in_progress', organizationId: org._id, requiresComment: true },
                { from: 'in_progress', to: 'todo', organizationId: org._id }
            ]
        };

        const workflow = await Workflow.findOneAndUpdate(
            { name: workflowData.name, organizationId: org._id },
            workflowData,
            { upsert: true, new: true }
        );
        logger.info(`Workflow '${workflow.name}' ready.`);

        // Link existing projects to this workflow
        await Project.updateMany(
            { organizationId: org._id, defaultWorkflowId: null },
            { defaultWorkflowId: workflow._id }
        );
        logger.info('Updated projects with default workflow.');

        await disconnectDB();
        process.exit(0);
    } catch (error) {
        logger.error('Workflow seeding failed:', error);
        process.exit(1);
    }
};

seedWorkflows();
