import React, { useState, useEffect, useRef } from 'react';
import { API_URL, WS_URL, getUser, apiCall } from '../utils/api';
import { MessageSquare, Bot, Send, X, Users, Sparkles, HelpCircle, Shield, ChevronDown } from 'lucide-react';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'live'
    
    // AI Assistant State
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState([
        {
            sender: 'bot',
            text: '👋 Assalam-o-Alaikum! Main Aapka **PCL Auction AI Assistant** hun. Aap team budget, player stats, unsold players ya RTM rules ke baray me pooch sakte hain!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [aiLoading, setAiLoading] = useState(false);

    // Live Chatroom State
    const [liveInput, setLiveInput] = useState('');
    const [liveMessages, setLiveMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const chatEndRef = useRef(null);
    const user = getUser();

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [isOpen, aiMessages, liveMessages, activeTab]);

    // Initial Load of Live Chat Messages & WebSocket connection
    useEffect(() => {
        fetchLiveMessages();

        let ws;
        try {
            ws = new WebSocket(WS_URL);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat_message') {
                        setLiveMessages((prev) => [...prev, data.data]);
                        if (!isOpen) {
                            setUnreadCount((c) => c + 1);
                        }
                    }
                } catch (e) {
                    console.error('WS Message error:', e);
                }
            };
        } catch (e) {
            console.error('WS Connection error:', e);
        }

        return () => {
            if (ws) ws.close();
        };
    }, [isOpen]);

    const fetchLiveMessages = async () => {
        try {
            const data = await apiCall('/chat/messages');
            setLiveMessages(data || []);
        } catch (err) {
            console.error('Failed to fetch live chat:', err);
        }
    };

    // Handle AI Query
    const handleAiSubmit = async (e, customMsg = null) => {
        if (e) e.preventDefault();
        const text = customMsg || aiInput.trim();
        if (!text || aiLoading) return;

        const userMsg = {
            sender: 'user',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setAiMessages((prev) => [...prev, userMsg]);
        if (!customMsg) setAiInput('');
        setAiLoading(true);

        try {
            const res = await apiCall('/chatbot/ask', {
                method: 'POST',
                body: JSON.stringify({ message: text })
            });

            const botMsg = {
                sender: 'bot',
                text: res.reply || 'Mujhe samajh nahi aya, baraye meharbani dubara koshish karein.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setAiMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setAiMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: '⚠️ Server connect nahi ho saka. Subah server running check karein.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setAiLoading(false);
        }
    };

    // Handle Live Chat Submit
    const handleLiveSubmit = async (e) => {
        e.preventDefault();
        if (!liveInput.trim()) return;

        const userName = user?.sub || 'Guest Spectator';
        const userRole = user?.role || 'viewer';
        const teamName = user?.team_name || (userRole === 'admin' ? 'Admin Panel' : 'Spectator');

        const payload = {
            user_name: userName,
            role: userRole,
            message: liveInput.trim(),
            team_name: teamName
        };

        try {
            setLiveInput('');
            await apiCall('/chat/message', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error('Error sending chat message:', err);
        }
    };

    const renderFormattedText = (text) => {
        // Simple Markdown formatter for bold & lists
        return text.split('\n').map((line, idx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={idx} style={{ marginBottom: line.startsWith('•') ? '4px' : '6px' }}>
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </div>
            );
        });
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50px',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.45)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                    }}
                    className="animate-float"
                >
                    <Sparkles size={20} className="animate-spin-slow" />
                    <span>Auction Assistant</span>
                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                borderRadius: '50%',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #0f172a'
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Modal */}
            {isOpen && (
                <div
                    style={{
                        width: '380px',
                        height: '540px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.25s ease-out'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '14px 18px',
                            background: 'rgba(30, 41, 59, 0.8)',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.05rem' }}>
                                PCL Assistant
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(15, 23, 42, 0.6)',
                            borderBottom: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >
                        <button
                            onClick={() => setActiveTab('ai')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                background: activeTab === 'ai' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: activeTab === 'ai' ? '#60a5fa' : '#94a3b8',
                                borderBottom: activeTab === 'ai' ? '2px solid #3b82f6' : '2px solid transparent',
                                fontWeight: '600',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Bot size={16} />
                            <span>AI Assistant</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('live')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                background: activeTab === 'live' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: activeTab === 'live' ? '#60a5fa' : '#94a3b8',
                                borderBottom: activeTab === 'live' ? '2px solid #3b82f6' : '2px solid transparent',
                                fontWeight: '600',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Users size={16} />
                            <span>Live Chatroom</span>
                        </button>
                    </div>

                    {/* TAB 1: AI Assistant */}
                    {activeTab === 'ai' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Preset Suggestion Chips */}
                            <div
                                style={{
                                    padding: '10px 14px',
                                    display: 'flex',
                                    gap: '6px',
                                    overflowX: 'auto',
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {[
                                    { label: '💰 Team Budgets', query: 'Teams ka budget kitna hai?' },
                                    { label: '🔥 Highest Bid', query: 'Sab se mehnga player konsa hai?' },
                                    { label: '❌ Unsold List', query: 'Unsold players list' },
                                    { label: '📜 RTM Rules', query: 'RTM rules kya hain?' }
                                ].map((chip, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAiSubmit(null, chip.query)}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            padding: '4px 10px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '12px',
                                            color: '#cbd5e1',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Messages List */}
                            <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
                                {aiMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: '85%',
                                                padding: '10px 14px',
                                                borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                background: msg.sender === 'user' ? '#2563eb' : 'rgba(30, 41, 59, 0.9)',
                                                color: '#f8fafc',
                                                fontSize: '0.88rem',
                                                lineHeight: '1.45',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.08)' : 'none'
                                            }}
                                        >
                                            {renderFormattedText(msg.text)}
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', padding: '0 4px' }}>
                                            {msg.time}
                                        </span>
                                    </div>
                                ))}

                                {aiLoading && (
                                    <div style={{ display: 'flex', gap: '4px', padding: '8px', color: '#60a5fa', fontSize: '0.85rem' }}>
                                        <Sparkles size={16} className="animate-spin" /> Thinking...
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* AI Input Form */}
                            <form
                                onSubmit={handleAiSubmit}
                                style={{
                                    padding: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    gap: '8px',
                                    background: 'rgba(15, 23, 42, 0.8)'
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Sawal poochiye (e.g. MI budget)..."
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        background: 'rgba(30, 41, 59, 0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '0.88rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={aiLoading}
                                    style={{
                                        padding: '10px 14px',
                                        background: '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: Live Chatroom */}
                    {activeTab === 'live' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
                                {liveMessages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '0.88rem' }}>
                                        💬 Bidding dauran aapas me chat karein!
                                    </div>
                                ) : (
                                    liveMessages.map((msg, idx) => (
                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: '#60a5fa' }}>
                                                    {msg.user_name}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        padding: '1px 6px',
                                                        borderRadius: '8px',
                                                        background: msg.role === 'admin' ? '#ef4444' : '#3b82f6',
                                                        color: '#fff'
                                                    }}
                                                >
                                                    {msg.role === 'admin' ? 'Admin' : msg.team_name || 'Owner'}
                                                </span>
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 'auto' }}>
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'rgba(30, 41, 59, 0.7)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '10px',
                                                    color: '#cbd5e1',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Live Chat Input */}
                            <form
                                onSubmit={handleLiveSubmit}
                                style={{
                                    padding: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    gap: '8px',
                                    background: 'rgba(15, 23, 42, 0.8)'
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder={user ? "Live chat message type karein..." : "Login to chat..."}
                                    value={liveInput}
                                    onChange={(e) => setLiveInput(e.target.value)}
                                    disabled={!user}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        background: 'rgba(30, 41, 59, 0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '0.88rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!user}
                                    style={{
                                        padding: '10px 14px',
                                        background: '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: user ? 1 : 0.5
                                    }}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
