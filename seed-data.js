const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
}

// ─── Models ─────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    status: { type: String, default: 'active' },
    phone: { type: String, unique: true, sparse: true }
});

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'active' },
    description: String
});

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    description: String,
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'active' }
});

const SprintSchema = new mongoose.Schema({
    name: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
    goal: String
});

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['open', 'in_progress', 'in_review', 'completed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    issueType: { type: String, enum: ['task', 'bug', 'story', 'epic'], default: 'task' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    key: String,
    storyPoints: Number,
    dueDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Sprint = mongoose.models.Sprint || mongoose.model('Sprint', SprintSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔗 Connected to MongoDB');

        // 1. Organization Setup
        let org = await Organization.findOne({ domain: 'acme.com' });
        if (!org) {
            org = await Organization.create({
                name: 'Acme Corporation',
                domain: 'acme.com',
                slug: 'acme',
                description: 'Global leader in advanced software solutions. We prioritize scalable architecture and beautiful UI design.'
            });
            console.log('🏢 Created Acme Organization');
        } else {
            console.log('🏢 Found Acme Organization');
        }

        // Clean up old seeded data for a fresh start
        console.log('🧹 Purging old task data...');
        await Task.deleteMany({ organizationId: org._id });
        await Sprint.deleteMany({ organizationId: org._id });
        await Project.deleteMany({ organizationId: org._id });
        await Comment.deleteMany({ organizationId: org._id });

        // 2. Comprehensive Users setup
        const password = await bcrypt.hash('password123', 10);

        // Include the actual admin email created by user if possible, or upsert realistic roles
        const usersData = [
            { name: 'Sarah Jenkins', email: 'admin@acme.com', role: 'admin', organizationId: org._id, phone: '555-0100' },
            { name: 'David Chen', email: 'david@acme.com', role: 'manager', organizationId: org._id, phone: '555-0101' },
            { name: 'Marcus Sterling', email: 'marcus@acme.com', role: 'manager', organizationId: org._id, phone: '555-0102' },
            { name: 'Elena Rodriguez', email: 'elena@acme.com', role: 'user', organizationId: org._id, phone: '555-0103' },
            { name: 'James Wilson', email: 'james@acme.com', role: 'user', organizationId: org._id, phone: '555-0104' },
            { name: 'Priya Patel', email: 'priya@acme.com', role: 'user', organizationId: org._id, phone: '555-0105' }
        ];

        const createdUsers = {};
        for (const userData of usersData) {
            const u = await User.findOneAndUpdate(
                { email: userData.email },
                { ...userData, password },
                { upsert: true, new: true }
            );
            createdUsers[u.name.split(' ')[0].toLowerCase()] = u;
        }
        console.log('👥 Upserted Enterprise Users');

        // Update org owner
        if (!org.ownerId || org.ownerId.toString() !== createdUsers['sarah']._id.toString()) {
            org.ownerId = createdUsers['sarah']._id;
            await org.save();
        }

        // 3. Realistic Projects
        const projectsData = [
            {
                name: 'Hyperion - Core Banking API',
                keyPrefix: 'HYP',
                organizationId: org._id,
                ownerId: createdUsers['david']._id,
                description: 'Overhaul of the legacy banking transaction APIs. Target: Sub-50ms latency.'
            },
            {
                name: 'Stratus - Mobile App V3',
                keyPrefix: 'STR',
                organizationId: org._id,
                ownerId: createdUsers['marcus']._id,
                description: 'Rewriting the consumer mobile application in React Native for iOS/Android parity.'
            },
            {
                name: 'Security Ops & Auditing',
                keyPrefix: 'SEC',
                organizationId: org._id,
                ownerId: createdUsers['sarah']._id,
                description: 'Q3 compliance and ISO 27001 certification preparations.'
            }
        ];

        const projects = {};
        for (const pData of projectsData) {
            const p = await Project.create(pData);
            projects[p.keyPrefix] = p;
        }
        console.log('📁 Created Detailed Projects');

        // 4. Time-Anchored Sprints
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
        const nextWeek = new Date(now.getTime() + 7 * 86400000);
        const twoWeeks = new Date(now.getTime() + 14 * 86400000);

        const sprintsData = [
            { name: 'HYP Sprint 42 - Optimization', projectId: projects['HYP']._id, organizationId: org._id, status: 'active', goal: 'Reduce DB query times by 40%', startDate: oneWeekAgo, endDate: nextWeek },
            { name: 'HYP Sprint 43 - Security', projectId: projects['HYP']._id, organizationId: org._id, status: 'planned', goal: 'Implement rate limiting and OAuth2', startDate: nextWeek, endDate: twoWeeks },
            { name: 'STR Sprint 12 - Onboarding', projectId: projects['STR']._id, organizationId: org._id, status: 'active', goal: 'Finish new user signup flow', startDate: oneWeekAgo, endDate: nextWeek },
        ];

        const sprints = {};
        for (const sData of sprintsData) {
            const s = await Sprint.create(sData);
            sprints[s.name.substring(0, 3)] = s; // e.g. sprints['HYP']
        }
        console.log('🏃 Created Active Sprints');

        // 5. Realistic Data For Timeline & Backlog
        const tasksData = [
            // Hyperion Tasks
            {
                title: 'Implement OAuth2 PKCE Flow',
                description: '### Requirement\nAs a security auditor, I want all mobile API requests to use Proof Key for Code Exchange (PKCE) to prevent code interception attacks.\n\n### Acceptance Criteria:\n- [ ] Auth server validates `code_challenge`.\n- [ ] Token exchange verifies `code_verifier`.\n- [ ] Fallback rejected explicitly.',
                status: 'in_progress', priority: 'critical', issueType: 'story',
                assignee: createdUsers['elena']._id, reporter: createdUsers['david']._id,
                project: projects['HYP']._id, sprint: sprints['HYP']._id, organizationId: org._id, key: 'HYP-101', storyPoints: 8, dueDate: nextWeek
            },
            {
                title: 'N+1 Query Issue in Transaction History',
                description: 'We are currently firing 100 queries for 100 transactions in the `/v2/history` endpoint. Need to load merchant metadata via `JOIN` or dataloader.',
                status: 'in_review', priority: 'high', issueType: 'bug',
                assignee: createdUsers['james']._id, reporter: createdUsers['elena']._id,
                project: projects['HYP']._id, sprint: sprints['HYP']._id, organizationId: org._id, key: 'HYP-102', storyPoints: 3, dueDate: now
            },
            {
                title: 'Kubernetes Cluster Auto-scaler Config',
                description: 'During peak trading hours (9 AM - 11 AM), the HPA is triggering too slowly. Adjust CPU threshold from 80% to 65%.',
                status: 'open', priority: 'medium', issueType: 'task',
                assignee: createdUsers['david']._id, reporter: createdUsers['sarah']._id,
                project: projects['HYP']._id, sprint: sprints['HYP']._id, organizationId: org._id, key: 'HYP-103', storyPoints: 2, dueDate: nextWeek
            },
            {
                title: 'Rate Limiting Redis Architecture Migration',
                description: 'Move from single node Redis to Redis Cluster for the API Gateway rate limiters. Current memory usage is hitting 95%.',
                status: 'open', priority: 'high', issueType: 'epic',
                reporter: createdUsers['david']._id, project: projects['HYP']._id, // Unassigned, in backlog
                organizationId: org._id, key: 'HYP-104', storyPoints: 21
            },

            // Stratus Tasks
            {
                title: 'Redesign Login Screen for iOS',
                description: 'Figma link attached. We need to implement the new blur glassmorphism effect on the login form background.',
                status: 'completed', priority: 'medium', issueType: 'story',
                assignee: createdUsers['priya']._id, reporter: createdUsers['marcus']._id,
                project: projects['STR']._id, sprint: sprints['STR']._id, organizationId: org._id, key: 'STR-42', storyPoints: 5, dueDate: oneWeekAgo
            },
            {
                title: 'Biometric Auth Fallback Infinite Loop',
                description: 'If FaceID fails 3 times, the app completely freezes rather than falling back to pin code. **CRITICAL RELEASE BLOCKER.**',
                status: 'in_progress', priority: 'critical', issueType: 'bug',
                assignee: createdUsers['james']._id, reporter: createdUsers['priya']._id,
                project: projects['STR']._id, sprint: sprints['STR']._id, organizationId: org._id, key: 'STR-43', storyPoints: 8, dueDate: nextWeek
            },
            {
                title: 'Implement Apple Pay Tokenization',
                description: 'Integrate the new Stripe SDK for Apple Pay tokenization on the checkout screen.',
                status: 'open', priority: 'high', issueType: 'task',
                assignee: createdUsers['elena']._id, reporter: createdUsers['marcus']._id,
                project: projects['STR']._id, sprint: sprints['STR']._id, organizationId: org._id, key: 'STR-44', storyPoints: 13, dueDate: nextWeek
            },

            // Security Tasks (No sprint, just Kanban tracking)
            {
                title: 'Automated Penetration Testing CI/CD',
                description: 'Integrate OWASP ZAP into the GitLab CI/CD pipeline. Block merge if high severity vulnerabilities are found.',
                status: 'in_progress', priority: 'high', issueType: 'task',
                assignee: createdUsers['sarah']._id, reporter: createdUsers['sarah']._id,
                project: projects['SEC']._id, organizationId: org._id, key: 'SEC-1', storyPoints: 5, dueDate: twoWeeks
            },
            {
                title: 'Encrypt Database Backups At Rest',
                description: 'AWS S3 bucket `acme-prod-db-backups` needs AES-256 enabled and bucket policies locked down to Ops role only.',
                status: 'completed', priority: 'critical', issueType: 'task',
                assignee: createdUsers['david']._id, reporter: createdUsers['sarah']._id,
                project: projects['SEC']._id, organizationId: org._id, key: 'SEC-2', storyPoints: 3, dueDate: oneWeekAgo
            }
        ];

        const createdTasks = {};
        for (const tData of tasksData) {
            const t = await Task.create(tData);
            createdTasks[t.key] = t;
        }
        console.log('📋 Populated Detailed Tasks & Bugs');

        // 6. Simulate Conversations (Comments)
        const commentsData = [
            {
                taskId: createdTasks['HYP-102']._id,
                author: createdUsers['elena']._id,
                organizationId: org._id,
                content: 'I pulled the logs from Datadog. It looks like the ORM is generating individual `SELECT` statements for every merchant struct mapping. We definitely need a dataloader.'
            },
            {
                taskId: createdTasks['HYP-102']._id,
                author: createdUsers['james']._id,
                organizationId: org._id,
                content: 'Working on this now. I will implement Facebook\'s DataLoader pattern for the Go backend. Should have a PR up by end of day.'
            },
            {
                taskId: createdTasks['STR-43']._id,
                author: createdUsers['priya']._id,
                organizationId: org._id,
                content: 'We had multiple customer complaints about this on Twitter today. Raising priority to critical.'
            }
        ];

        for (const cData of commentsData) {
            await Comment.create(cData);
        }
        console.log('💬 Added Activity and Comments');

        console.log('✅ Enterprise Seeding Completed Successfully! You can now demonstrate the platform.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
