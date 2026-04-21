const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { config } = require('./config');
const logger = require('./core/logger');

let io;

// Global presence tracker
// roomKey -> Map<userId, userDetails>
const activeResources = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    // Authenticate Socket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            socket.user = decoded; // Contains id, organizationId, etc.
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    logger.info('--- WEBSOCKETS INITIALIZED WITH SECURE AUTH ---');

    io.on('connection', (socket) => {
        const orgId = socket.user.organizationId;
        const userId = socket.user.id;

        // Automatically join organization room
        socket.join(`org:${orgId}`);
        // Join private user room for direct notifications
        socket.join(`user:${userId}`);

        logger.info(`Socket Protected Connection: ${socket.id} (User: ${userId}, Org: ${orgId})`);

        socket.on('JOIN_CHANNEL', (channelId) => {
            socket.join(`channel:${channelId}`);
            logger.debug(`User ${userId} joined channel room: ${channelId}`);
        });

        socket.on('LEAVE_CHANNEL', (channelId) => {
            socket.leave(`channel:${channelId}`);
            logger.debug(`User ${userId} left channel room: ${channelId}`);
        });

        // --- Presence Tracking Events ---
        socket.on('JOIN_RESOURCE', ({ resourceType, resourceId, userInfo }) => {
            const roomKey = `${resourceType}:${resourceId}`;
            socket.join(roomKey);
            
            if (!activeResources.has(roomKey)) {
                activeResources.set(roomKey, new Map());
            }
            
            const userPresenceData = {
                id: userId,
                name: userInfo?.name || 'Anonymous User',
                avatar: userInfo?.avatar || null,
                color: userInfo?.color || '#3b82f6', 
                joinedAt: new Date()
            };
            
            activeResources.get(roomKey).set(userId, userPresenceData);
            
            socket.activeRooms = socket.activeRooms || new Set();
            socket.activeRooms.add(roomKey);
            
            const usersInRoom = Array.from(activeResources.get(roomKey).values());
            io.to(roomKey).emit('PRESENCE_UPDATE', { resourceType, resourceId, users: usersInRoom });
            logger.debug(`User ${userId} joined resource ${roomKey}`);
        });

        socket.on('LEAVE_RESOURCE', ({ resourceType, resourceId }) => {
            const roomKey = `${resourceType}:${resourceId}`;
            socket.leave(roomKey);
            
            if (activeResources.has(roomKey)) {
                activeResources.get(roomKey).delete(userId);
                const usersInRoom = Array.from(activeResources.get(roomKey).values());
                io.to(roomKey).emit('PRESENCE_UPDATE', { resourceType, resourceId, users: usersInRoom });
                
                if (usersInRoom.length === 0) {
                    activeResources.delete(roomKey);
                }
            }
            if (socket.activeRooms) {
                 socket.activeRooms.delete(roomKey);
            }
            logger.debug(`User ${userId} left resource ${roomKey}`);
        });

        socket.on('disconnect', () => {
            if (socket.activeRooms) {
                for (const roomKey of socket.activeRooms) {
                    if (activeResources.has(roomKey)) {
                        activeResources.get(roomKey).delete(userId);
                        const usersInRoom = Array.from(activeResources.get(roomKey).values());
                        const [resourceType, resourceId] = roomKey.split(':');
                        io.to(roomKey).emit('PRESENCE_UPDATE', { resourceType, resourceId, users: usersInRoom });
                        if (usersInRoom.length === 0) {
                            activeResources.delete(roomKey);
                        }
                    }
                }
            }
            logger.debug(`Socket Disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
