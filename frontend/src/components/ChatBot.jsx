import React, { useState, useRef, useEffect } from 'react';

function ChatBot({ auth, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const suggestedQuestions = [
        "How to control pests in organic farming?",
        "Best fertilizers for vegetable crops",
        "What is crop rotation and its benefits?",
        "How to improve soil health naturally?",
        "Weather-based farming advice for this season",
        "Government schemes for farmers"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        loadChatHistory();
        // Focus input when component mounts
        inputRef.current?.focus();
    }, []);

    const loadChatHistory = async () => {
        if (!auth.token) return;
        try {
            const response = await fetch('http://localhost:3001/api/chat/history', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (response.ok) {
                const history = await response.json();
                setMessages(history);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = async (messageText = inputMessage) => {
        if (!messageText.trim() || isLoading) return;

        const userMessageText = messageText.trim();
        setInputMessage('');
        setIsLoading(true);
        setIsTyping(true);

        const newUserMessage = {
            role: 'user',
            text: userMessageText,
            timestamp: new Date().toISOString(),
            message_id: Date.now() // Temporary ID
        };

        setMessages(prev => [...prev, newUserMessage]);

        try {
            const response = await fetch('http://localhost:3001/api/chat/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessageText })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message.');
            }
            
            // Simulate typing delay for better UX
            setTimeout(() => {
                setIsTyping(false);
                const aiMessage = {
                    role: 'model',
                    text: data.response,
                    timestamp: data.timestamp,
                    message_id: Date.now() + 1
                };
                setMessages(prev => [...prev, aiMessage]);
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
            setIsTyping(false);
            
            setMessages(prev => prev.filter(msg => msg.message_id !== newUserMessage.message_id));

            const errorMessage = {
                role: 'model',
                text: "🌱 I'm currently unavailable. Please contact your local Krishi Vigyan Kendra for immediate assistance.",
                timestamp: new Date().toISOString(),
                isError: true,
                message_id: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const clearChat = async () => {
        if (!window.confirm('Are you sure you want to clear all chat history?')) return;
        
        try {
            const response = await fetch('http://localhost:3001/api/chat/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (response.ok) {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    };

    const handleSuggestionClick = (question) => {
        sendMessage(question);
    };

    // Enhanced styles with better design
    const styles = {
        chatContainer: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '420px',
            height: '650px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '1px solid #e8f5e8',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            overflow: 'hidden'
        },
        chatHeader: {
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            color: 'white',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(46, 125, 50, 0.2)'
        },
        chatTitle: {
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        closeButton: {
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'all 0.2s ease',
            fontWeight: 'bold'
        },
        messagesContainer: {
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #f8fff8 0%, #ffffff 100%)',
            display: 'flex',
            flexDirection: 'column'
        },
        welcomeMessage: {
            textAlign: 'center',
            color: '#666',
            padding: '2rem 1rem',
            fontStyle: 'italic',
            background: 'rgba(76, 175, 80, 0.05)',
            borderRadius: '12px',
            marginBottom: '1rem',
            border: '1px dashed #c8e6c9'
        },
        message: {
            marginBottom: '1rem',
            padding: '0.875rem 1.125rem',
            borderRadius: '18px',
            maxWidth: '85%',
            wordWrap: 'break-word',
            lineHeight: '1.5',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            animation: 'messageSlide 0.3s ease-out'
        },
        userMessage: {
            backgroundColor: '#2E7D32',
            color: 'white',
            marginLeft: 'auto',
            borderBottomRightRadius: '6px',
            alignSelf: 'flex-end'
        },
        botMessage: {
            backgroundColor: 'white',
            color: '#2d3748',
            marginRight: 'auto',
            border: '1px solid #e2e8f0',
            borderBottomLeftRadius: '6px',
            alignSelf: 'flex-start'
        },
        errorMessage: {
            backgroundColor: '#fff5f5',
            color: '#c53030',
            border: '1px solid #fed7d7'
        },
        typingIndicator: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.125rem',
            backgroundColor: 'white',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            alignSelf: 'flex-start',
            marginBottom: '1rem',
            color: '#666',
            fontSize: '14px'
        },
        typingDots: {
            display: 'flex',
            gap: '4px'
        },
        typingDot: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            animation: 'typingBounce 1.4s ease-in-out infinite both'
        },
        suggestionsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1rem'
        },
        suggestionChip: {
            padding: '0.75rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #c8e6c9',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#2E7D32',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        },
        inputContainer: {
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
        },
        inputForm: {
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
        },
        messageInput: {
            flex: 1,
            padding: '0.875rem 1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
            backgroundColor: '#fafafa',
            transition: 'all 0.2s ease'
        },
        sendButton: {
            padding: '0.875rem 1.25rem',
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
        },
        sendButtonDisabled: {
            opacity: 0.6,
            cursor: 'not-allowed',
            transform: 'none !important'
        },
        clearButton: {
            width: '100%',
            marginTop: '0.75rem',
            padding: '0.625rem',
            backgroundColor: 'transparent',
            color: '#718096',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            fontWeight: '500'
        }
    };

    // Add CSS animations
    const animationStyles = `
        @keyframes messageSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;

    return (
        <>
            <style>{animationStyles}</style>
            <div style={styles.chatContainer}>
                <div style={styles.chatHeader}>
                    <h3 style={styles.chatTitle}>
                        🌿 Krushi Sathi
                    </h3>
                    <button 
                        style={styles.closeButton} 
                        onClick={onClose}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                        title="Close chat"
                    >
                        ×
                    </button>
                </div>
                
                <div style={styles.messagesContainer}>
                    {messages.length === 0 ? (
                        <>
                            <div style={styles.welcomeMessage}>
                                Namaste! I'm your farming assistant. Ask me about crops, weather, 
                                prices, or any farming concerns. 🌾
                            </div>
                            <div style={styles.suggestionsContainer}>
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        style={styles.suggestionChip}
                                        onClick={() => handleSuggestionClick(question)}
                                        onMouseOver={(e) => {
                                            e.target.style.backgroundColor = '#f1f8e9';
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.backgroundColor = 'white';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                        }}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.message_id || message.timestamp}
                                style={{
                                    ...styles.message,
                                    ...(message.role === 'user' ? styles.userMessage : styles.botMessage),
                                    ...(message.isError && styles.errorMessage)
                                }}
                            >
                                {message.text}
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div style={styles.typingIndicator}>
                            <span>Krushi Sathi is typing</span>
                            <div style={styles.typingDots}>
                                <div style={{...styles.typingDot, animationDelay: '0s'}}></div>
                                <div style={{...styles.typingDot, animationDelay: '0.2s'}}></div>
                                <div style={{...styles.typingDot, animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
                
                <div style={styles.inputContainer}>
                    <form onSubmit={handleSubmit} style={styles.inputForm}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask about crops, weather, prices, government schemes..."
                            style={styles.messageInput}
                            disabled={isLoading}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#4CAF50';
                            }}
                            onBlur={(e) => {
                                e.target.style.backgroundColor = '#fafafa';
                                e.target.style.borderColor = '#e2e8f0';
                            }}
                        />
                        <button 
                            type="submit" 
                            style={{
                                ...styles.sendButton,
                                ...((isLoading || !inputMessage.trim()) && styles.sendButtonDisabled)
                            }}
                            disabled={isLoading || !inputMessage.trim()}
                            onMouseOver={(e) => {
                                if (!isLoading && inputMessage.trim()) {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(46, 125, 50, 0.4)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.3)';
                            }}
                        >
                            Send
                        </button>
                    </form>
                    <button 
                        style={styles.clearButton}
                        onClick={clearChat}
                        disabled={isLoading || messages.length === 0}
                        onMouseOver={(e) => {
                            if (!isLoading && messages.length > 0) {
                                e.target.style.backgroundColor = '#fff5f5';
                                e.target.style.color = '#e53e3e';
                                e.target.style.borderColor = '#fed7d7';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#718096';
                            e.target.style.borderColor = '#e2e8f0';
                        }}
                    >
                        🗑️ Clear Chat History
                    </button>
                </div>
            </div>
        </>
    );
}

export default ChatBot;