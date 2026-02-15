import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Loader, Zap, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Ticket } from '../../types';
import Button from '../common/Button';
import './LiveChat.css';

interface Message {
    id: string;
    sender_name: string;
    sender_role: string;
    message: string;
    created_at: string;
    is_system?: boolean;
}

interface LiveChatProps {
    ticket: Ticket;
}

const LiveChat: React.FC<LiveChatProps> = ({ ticket }) => {
    const { user, profile } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [agentOnline, setAgentOnline] = useState(false);
    const [typingIndicator, setTypingIndicator] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const displayUser = profile || user;
    const isAgent = displayUser?.role === 'agent' || displayUser?.role === 'super_admin';

    useEffect(() => {
        // Connect to WebSocket server
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const newSocket = io(API_URL, {
            auth: {
                userId: displayUser?.id,
                ticketId: ticket.id,
                userName: displayUser?.full_name || displayUser?.email,
                role: displayUser?.role
            }
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to live chat');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from live chat');
            setIsConnected(false);
        });

        newSocket.on('chat_history', (history: Message[]) => {
            setMessages(history);
        });

        newSocket.on('new_message', (msg: Message) => {
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on('agent_status', (status: { online: boolean }) => {
            setAgentOnline(status.online);
        });

        newSocket.on('typing', (data: { userName: string }) => {
            setTypingIndicator(data.userName);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingIndicator(''), 3000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [ticket.id, displayUser?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        socket.emit('send_message', {
            ticketId: ticket.id,
            message: message.trim(),
            senderName: displayUser?.full_name || displayUser?.email,
            senderRole: displayUser?.role
        });

        setMessage('');
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', {
                ticketId: ticket.id,
                userName: displayUser?.full_name || displayUser?.email
            });
        }
    };

    return (
        <div className="live-chat-container">
            <div className="live-chat-header">
                <div className="header-title">
                    <Zap size={18} className="live-icon pulsing" />
                    <h3>Live Chat</h3>
                    <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                </div>
                {!isAgent && (
                    <div className={`agent-status ${agentOnline ? 'online' : 'offline'}`}>
                        {agentOnline ? '🟢 Agent Available' : '🔴 No Agent Online'}
                    </div>
                )}
            </div>

            <div className="live-chat-messages">
                {messages.length === 0 && (
                    <div className="empty-chat">
                        <Zap size={48} className="empty-icon" />
                        <p>Live chat started! Messages appear instantly.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-message ${msg.sender_role === displayUser?.role ? 'sent' : 'received'} ${msg.is_system ? 'system' : ''}`}
                    >
                        <div className="message-header">
                            {msg.sender_role === 'agent' || msg.sender_role === 'super_admin' ? (
                                <Shield size={14} className="role-icon agent" />
                            ) : (
                                <User size={14} className="role-icon student" />
                            )}
                            <span className="sender-name">{msg.sender_name}</span>
                            <span className="message-time">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="message-content">{msg.message}</div>
                    </div>
                ))}
                {typingIndicator && (
                    <div className="typing-indicator">
                        <Loader size={14} className="spin" />
                        <span>{typingIndicator} is typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="live-chat-input-form">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                    }}
                    className="chat-input"
                />
                <Button type="submit" disabled={!message.trim() || !isConnected} className="send-btn-live">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    );
};

export default LiveChat;
