import { Send, User as UserIcon, Shield, Sparkles, Video, Trash2, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import { generateSmartReplyAI, analyzeResponseQuality } from '../lib/ai';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';
import ResponseQualityIndicator from './common/ResponseQualityIndicator';
import VideoRecorder from './common/VideoRecorder';
import { Ticket } from '../types';
import './TicketChat.css';

interface Message {
    id: string;
    content: string;
    sender_role: string;
    created_at: string;
    attachment_url?: string;
}

interface TicketChatProps {
    ticketId: string;
    role?: string;
    ticketData?: Ticket;
}

const TicketChat: React.FC<TicketChatProps> = ({ ticketId, role = 'student', ticketData }) => {
    const { user, profile } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [qualityAnalysis, setQualityAnalysis] = useState<any>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const socketRef = useRef<any>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const cannedResponses = [
        "Hello, we are looking into your issue.",
        "Please provide your Student ID and Receipt Number.",
        "Your issue has been resolved. Please check your portal.",
        "Could you please upload a screenshot of the error?",
        "This is a known issue we are fixing."
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const isStaff = role === 'admin' || role === 'agent' || role === 'super_admin';
        if (!isStaff || !newMessage || newMessage.length < 10) {
            setQualityAnalysis(null);
            return;
        }

        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);

        analysisTimeoutRef.current = setTimeout(async () => {
            setIsAnalyzingQuality(true);
            const context = ticketData || { subject: 'Support Ticket', description: 'User inquiry' };
            const analysis = await analyzeResponseQuality(newMessage, context);
            setQualityAnalysis(analysis);
            setIsAnalyzingQuality(false);
        }, 1500);

        return () => {
            if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        };
    }, [newMessage, role, ticketData]);

    useEffect(() => {
        // Initialize Socket
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        socketRef.current = io(socketUrl);

        socketRef.current.emit('join-ticket', ticketId);

        socketRef.current.on('user-typing', ({ user: typingName }: { user: string }) => {
            if (typingName !== (profile?.full_name || user?.email)) {
                setTypingUser(typingName);
            }
        });

        socketRef.current.on('user-stop-typing', () => {
            setTypingUser(null);
        });

        socketRef.current.on('new-message', (data: Message) => {
            setMessages(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
            scrollToBottom();
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [ticketId, profile, user]);

    useEffect(() => {
        fetchMessages();

        const pollInterval = setInterval(async () => {
            try {
                const refreshedMessages = await api.messages.list(ticketId);
                if (refreshedMessages.length > messages.length) {
                    const newMsgs = refreshedMessages.slice(messages.length);
                    setMessages(refreshedMessages);

                    const latestNewMsg = newMsgs[newMsgs.length - 1];
                    if (latestNewMsg.sender_role !== role && document.hidden) {
                        sendNotification(`New message from ${latestNewMsg.sender_role === 'admin' ? 'Support' : 'Student'}`, {
                            body: latestNewMsg.content,
                            tag: `ticket-${ticketId}`
                        });
                    }
                    scrollToBottom();
                }
            } catch (err) {
                console.error('Polling for messages failed:', err);
            }
        }, 5000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [ticketId, role, messages.length]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const data = await api.messages.list(ticketId);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !videoBlob) return;

        try {
            let attachment: File | null = null;
            if (videoBlob) {
                attachment = new File([videoBlob], "response-video.webm", { type: 'video/webm' });
            }

            const data = await api.messages.create(ticketId, newMessage, role, attachment as any);

            if (data) {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            }

            setNewMessage('');
            setVideoBlob(null);
            setQualityAnalysis(null);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message');
        }
    };

    const handleTemplateClick = (text: string) => {
        setNewMessage(text);
        setShowTemplates(false);
    };

    const handleGenerateAiReply = async () => {
        setIsGenerating(true);
        const ticketContext = ticketData || { full_name: 'Student', subject: 'Inquiry', description: 'Please help.' };

        try {
            const reply = await generateSmartReplyAI(ticketContext as any, messages);
            if (reply) {
                setNewMessage(reply);
                showSuccess('AI reply generated');
            } else {
                showWarning("AI Reply failed. This usually means the API Key is invalid or has reached its quota.");
            }
        } catch (error: any) {
            showError(`AI Error: ${error.message || "An unexpected error occurred"}`);
        }
        setIsGenerating(false);
    };

    const isStaff = (role: string) => ['admin', 'agent', 'super_admin'].includes(role);

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Conversation</h3>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <p className="chat-loading">Loading chat...</p>
                ) : messages.length === 0 ? (
                    <p className="chat-empty">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message ${msg.sender_role === role ? 'message-own' : 'message-other'}`}
                        >
                            <div className="message-bubble">
                                <div className="message-info">
                                    <span className="message-sender">
                                        {isStaff(msg.sender_role) ? (
                                            <><Shield size={12} /> Staff</>
                                        ) : (
                                            <><UserIcon size={12} /> Student</>
                                        )}
                                    </span>
                                    <span className="message-time">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {typingUser && (
                    <div className="typing-indicator">
                        <Loader2 size={12} className="animate-spin" />
                        <span>{typingUser} is typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                {isStaff(role) && (
                    <div className="admin-tools mb-2">
                        <ResponseQualityIndicator
                            loading={isAnalyzingQuality}
                            analysis={qualityAnalysis}
                            draftText={newMessage}
                        />

                        <div className="template-wrapper">
                            <button
                                type="button"
                                className="template-btn"
                                onClick={() => setShowTemplates(!showTemplates)}
                                title="Quick Replies"
                            >
                                ⚡
                            </button>
                            <button
                                type="button"
                                className="template-btn ai-btn"
                                onClick={handleGenerateAiReply}
                                title="Generate AI Reply"
                                disabled={isGenerating}
                            >
                                {isGenerating ? '...' : <Sparkles size={16} />}
                            </button>

                            <button
                                type="button"
                                className="template-btn video-btn"
                                onClick={() => setShowRecorder(true)}
                                title="Record Video Response"
                            >
                                <Video size={16} />
                            </button>

                            {showTemplates && (
                                <div className="template-menu">
                                    {cannedResponses.map((res, i) => (
                                        <div key={i} className="template-item" onClick={() => handleTemplateClick(res)}>
                                            {res}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {videoBlob && (
                    <div className="video-attachment-preview mb-3">
                        <div className="bg-gray-100 border rounded-lg overflow-hidden max-w-xs shadow-sm">
                            <video
                                src={URL.createObjectURL(videoBlob)}
                                controls
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-2 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Video size={14} className="text-red-500" />
                                    <span>Video/Screen Ready</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVideoBlob(null)}
                                    className="h-6 w-6 p-0 text-red-500"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="chat-form">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);

                            // Emit typing
                            if (socketRef.current) {
                                socketRef.current.emit('typing', {
                                    ticketId,
                                    user: profile?.full_name || user?.full_name || 'Anonymous'
                                });

                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = setTimeout(() => {
                                    socketRef.current.emit('stop-typing', { ticketId });
                                }, 3000);
                            }
                        }}
                        placeholder="Type your message..."
                        className="chat-input"
                        maxLength={1000}
                    />
                    <Button type="submit" size="sm" className="chat-send-btn">
                        <Send size={18} />
                    </Button>
                </form>
            </div>

            {showRecorder && (
                <VideoRecorder
                    onRecordingComplete={(blob) => {
                        setVideoBlob(blob);
                        setShowRecorder(false);
                    }}
                    onCancel={() => setShowRecorder(false)}
                />
            )}
        </div>
    );
};

export default TicketChat;
