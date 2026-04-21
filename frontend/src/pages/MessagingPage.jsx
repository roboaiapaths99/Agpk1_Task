import React from 'react';
import {
    Hash, Send, Search, Users, MoreVertical, Paperclip,
    Smile, Plus, AtSign, MessageSquare
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api/axios';
import useAuthStore from '../store/useAuth';
import { getIO } from '../services/socket'; // Assuming a socket service exists or we create one
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const MessagingPage = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedChannel, setSelectedChannel] = React.useState(null);
    const [messageInput, setMessageInput] = React.useState('');
    const scrollRef = React.useRef(null);

    // Fetch Channels
    const { data: channelsRaw, isLoading: channelsLoading } = useQuery({
        queryKey: ['channels'],
        queryFn: async () => {
            const res = await api.get('/messaging/channels');
            return res;
        }
    });

    const channels = Array.isArray(channelsRaw) ? channelsRaw : (channelsRaw?.data || []);

    // Fetch Messages
    const { data: messagesRaw, isLoading: messagesLoading } = useQuery({
        queryKey: ['messages', selectedChannel?._id],
        queryFn: async () => {
            if (!selectedChannel) return [];
            const res = await api.get(`/messaging/channels/${selectedChannel._id}/messages`);
            return res;
        },
        enabled: !!selectedChannel
    });

    const messages = Array.isArray(messagesRaw) ? messagesRaw : (messagesRaw?.data || []);

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post(`/messaging/channels/${selectedChannel._id}/messages`, payload);
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries(['messages', selectedChannel?._id]);
        }
    });

    // Socket Logic
    React.useEffect(() => {
        const socket = getIO();
        if (selectedChannel && socket) {
            socket.emit('JOIN_CHANNEL', selectedChannel._id);

            const handleNewMessage = (msg) => {
                if (msg.channelId === selectedChannel._id) {
                    queryClient.setQueryData(['messages', selectedChannel._id], (old) => [msg, ...old]);
                }
            };

            socket.on('NEW_MESSAGE', handleNewMessage);
            return () => {
                socket.emit('LEAVE_CHANNEL', selectedChannel._id);
                socket.off('NEW_MESSAGE', handleNewMessage);
            };
        }
    }, [selectedChannel, queryClient]);

    // Auto-scroll
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessageMutation.mutate({ content: messageInput });
    };

    return (
        <div className="h-[calc(100vh-140px)] flex bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            {/* Sidebar */}
            <div className="w-80 border-right bg-slate-50/50 flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black italic tracking-tight">Collaboration</h2>
                        <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <Plus className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find channels..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 ring-primary/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-4 block">Channels</span>
                        <div className="space-y-1">
                            {channels.filter(c => c.type !== 'direct').map(channel => (
                                <button
                                    key={channel._id}
                                    onClick={() => setSelectedChannel(channel)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm",
                                        selectedChannel?._id === channel._id ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-slate-100 text-slate-600"
                                    )}
                                >
                                    <Hash className={cn("w-4 h-4", selectedChannel?._id === channel._id ? "text-white/70" : "text-slate-400")} />
                                    {channel.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-4 block">Direct Messages</span>
                        <div className="space-y-1 text-center py-4">
                            <p className="text-xs text-slate-400 font-medium italic">No active DM sessions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChannel ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    <Hash className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black italic">{selectedChannel.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Now</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"><Users className="w-5 h-5" /></button>
                                <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col-reverse"
                        >
                            {messages.map((msg, idx) => {
                                const isOwn = msg.senderId?._id === user?.id || msg.senderId === user?.id;
                                return (
                                    <div key={msg._id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[70%] p-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed",
                                            isOwn ? "bg-primary text-white shadow-primary/10" : "bg-slate-100 text-slate-800"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 px-1">
                                            {!isOwn && (
                                                <span className="text-[10px] font-black text-slate-900 border-b border-primary/30 pb-0.5">
                                                    {msg.senderId?.name || 'User'}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {format(new Date(msg.createdAt), 'hh:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-slate-50/50">
                            <form
                                onSubmit={handleSend}
                                className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl flex items-center gap-2 focus-within:ring-2 ring-primary/20 transition-all"
                            >
                                <button type="button" className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all">
                                    <Plus className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Message ${selectedChannel.name}...`}
                                    className="flex-1 px-4 py-2 border-none focus:ring-0 text-sm font-bold placeholder:text-slate-300"
                                />
                                <div className="flex items-center gap-1">
                                    <button type="button" className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"><Smile className="w-5 h-5" /></button>
                                    <button type="button" className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"><Paperclip className="w-5 h-5" /></button>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="p-3 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-8 animate-bounce">
                            <MessageSquare className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tight text-slate-900 mb-4">Enterprise Messenger</h2>
                        <p className="max-w-md text-slate-500 font-medium leading-relaxed">
                            Welcome to the high-security collaboration hub. Select a channel from the left sidebar to start real-time communications.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingPage;
