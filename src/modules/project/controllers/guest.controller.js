const GuestLink = require('../models/GuestLink');
const Project = require('../models/Project');
const Task = require('../../work-item/models/Task');
const logger = require('../../../core/logger');

exports.getGuestProject = async (req, res) => {
    try {
        const { token } = req.params;
        const guestLink = await GuestLink.findOne({ token, isActive: true });

        if (!guestLink) {
            return res.status(404).json({ message: 'Invalid or expired guest link' });
        }

        if (new Date() > guestLink.expiresAt) {
            guestLink.isActive = false;
            await guestLink.save();
            return res.status(410).json({ message: 'Guest link has expired' });
        }

        // Increment access count
        guestLink.accessCount += 1;
        await guestLink.save();

        const project = await Project.findById(guestLink.projectId);
        const tasks = await Task.find({ projectId: project._id }).select('title status priority dueDate issueType storyPoints');

        res.json({
            status: 'success',
            data: {
                project: {
                    name: project.name,
                    key: project.key,
                    description: project.description
                },
                tasks
            }
        });
    } catch (error) {
        logger.error('Error fetching guest project:', error);
        res.status(500).json({ message: 'Failed to retrieve project data' });
    }
};

exports.createGuestLink = async (req, res) => {
    try {
        const { projectId } = req.body;
        const organizationId = req.user.organizationId;

        // Default expiry 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const guestLink = await GuestLink.create({
            projectId,
            organizationId,
            expiresAt
        });

        res.status(201).json({
            status: 'success',
            data: guestLink
        });
    } catch (error) {
        logger.error('Error creating guest link:', error);
        res.status(500).json({ message: 'Failed to create guest link' });
    }
};
