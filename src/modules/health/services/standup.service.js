const Standup = require('../models/Standup');

class StandupService {
    async submit(userId, organizationId, data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already submitted today
        const existing = await Standup.findOne({
            user: userId,
            organizationId,
            date: { $gte: today }
        });

        if (existing) {
            return await Standup.findByIdAndUpdate(existing._id, data, { new: true });
        }

        return await Standup.create({
            user: userId,
            organizationId,
            ...data,
            date: today
        });
    }

    async getTeamStandups(organizationId, date) {
        const searchDate = date ? new Date(date) : new Date();
        searchDate.setHours(0, 0, 0, 0);

        return await Standup.find({
            organizationId,
            date: { $gte: searchDate, $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) }
        }).populate('user', 'name email avatar');
    }

    async getMyStandups(userId, organizationId) {
        return await Standup.find({ user: userId, organizationId }).sort({ date: -1 }).limit(30);
    }
}

module.exports = new StandupService();
