import React, { useEffect, useState } from 'react';
import useSocket from '../../hooks/useSocket';
import useAuthStore from '../../store/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const PresenceAvatars = ({ resourceType, resourceId, maxAvatars = 4 }) => {
    const { user } = useAuthStore();
    const { emitEvent, subscribeToEvent, unsubscribeFromEvent } = useSocket(user?.organizationId);
    const [presentUsers, setPresentUsers] = useState([]);

    useEffect(() => {
        if (!user || !resourceType || !resourceId) return;

        const handlePresenceUpdate = (data) => {
            if (data.resourceType === resourceType && data.resourceId === resourceId) {
                // Filter out the current user so we only show "others viewing"
                const others = data.users.filter(u => u.id !== user._id);
                setPresentUsers(others);
            }
        };

        subscribeToEvent('PRESENCE_UPDATE', handlePresenceUpdate);

        emitEvent('JOIN_RESOURCE', {
            resourceType,
            resourceId,
            userInfo: {
                name: user.name,
                avatar: user.avatar,
                color: stringToColor(user.name)
            }
        });

        return () => {
            unsubscribeFromEvent('PRESENCE_UPDATE', handlePresenceUpdate);
            emitEvent('LEAVE_RESOURCE', { resourceType, resourceId });
        };
    }, [user, resourceType, resourceId]); // eslint-disable-line

    if (presentUsers.length === 0) return null;

    const visibleUsers = presentUsers.slice(0, maxAvatars);
    const hiddenCount = presentUsers.length - maxAvatars;

    return (
        <div className="flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
            <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse absolute -left-1"></span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-3">
                    {presentUsers.length === 1 ? '1 viewing' : `${presentUsers.length} viewing`}
                </span>
            </div>
            <div className="flex -space-x-2 overflow-hidden items-center">
                <AnimatePresence>
                    {visibleUsers.map((u, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            key={u.id}
                            className="relative z-10 inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-gray-900 cursor-help"
                            style={{ backgroundColor: u.color, zIndex: 10 - i }}
                            title={u.name}
                        >
                            {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                    {getInitials(u.name)}
                                </span>
                            )}
                        </motion.div>
                    ))}
                    {hiddenCount > 0 && (
                        <div className="relative z-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-900 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            +{hiddenCount}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Utils
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function stringToColor(str) {
    if (!str) return '#3b82f6';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Modify to generate slightly softer, more pastel colors
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    
    // Mix with white to soften
    const mixR = Math.floor((r + 255) / 2);
    const mixG = Math.floor((g + 255) / 2);
    const mixB = Math.floor((b + 255) / 2);

    const color = '#' + 
        mixR.toString(16).padStart(2, '0') +
        mixG.toString(16).padStart(2, '0') +
        mixB.toString(16).padStart(2, '0');
        
    return color;
}

export default PresenceAvatars;
