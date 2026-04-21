const Channel = require('../models/Channel');
const Message = require('../models/Message');
const logger = require('../../../core/logger');

class MessagingService {
    async createChannel(data, userId, organizationId) {
        const channel = await Channel.create({
            ...data,
            organizationId,
            members: data.members || [userId]
        });
        return channel;
    }

    async getChannels(userId, organizationId) {
        return Channel.find({
            organizationId,
            members: userId
        }).populate('lastMessage').sort({ updatedAt: -1 });
    }

    async sendMessage(channelId, senderId, organizationId, payload) {
        const message = await Message.create({
            channelId,
            senderId,
            organizationId,
            content: payload.content,
            attachments: payload.attachments || []
        });

        await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id });

        // Emit to channel room via Socket.io
        try {
            const { getIO } = require('../../../socketServer');
            const socketInstance = getIO();
            if (socketInstance) {
                const populated = await Message.findById(message._id).populate('senderId', 'name avatar');
                socketInstance.to(`channel:${channelId}`).emit('NEW_MESSAGE', populated);
            }
        } catch (err) {
            logger.warn('Socket not available for message broadcast:', err.message);
        }

        return message;
    }

    async getMessages(channelId, organizationId, query = {}) {
        const limit = parseInt(query.limit) || 50;
        const page = parseInt(query.page) || 1;

        return Message.find({ channelId, organizationId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('senderId', 'name avatar');
    }
}

module.exports = new MessagingService();

