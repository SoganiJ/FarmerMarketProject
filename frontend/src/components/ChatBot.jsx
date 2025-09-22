import React, { useState, useRef, useEffect } from 'react';

function ChatBot({ auth, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Load chat history when the component mounts
        loadChatHistory();
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

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessageText = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        // Create an "optimistic" message to display immediately in the UI.
        // The timestamp acts as a temporary, unique key for rendering.
        const newUserMessage = {
            role: 'user',
            text: userMessageText,
            timestamp: new Date().toISOString() 
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

            // If the server responds with an error, throw it to be handled by the catch block
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message.');
            }
            
            // On success, create the AI message and add it to the chat
            const aiMessage = {
                role: 'model',
                text: data.response,
                timestamp: data.timestamp
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Error sending message:', error);
            
            // If an error occurs, first remove the optimistic message that failed to send.
            setMessages(prev => prev.filter(msg => msg !== newUserMessage));

            // Then, display a proper error message in the chat window.
            const errorMessage = {
                role: 'model',
                text: error.message || "Sorry, I'm having trouble responding right now. Please try again.",
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
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

    const styles = {
        chatContainer: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '1px solid #e0e0e0',
            fontFamily: 'sans-serif'
        },
        chatHeader: {
            backgroundColor: '#2E7D32',
            color: 'white',
            padding: '1rem',
            borderRadius: '10px 10px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        chatTitle: {
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '600'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
        },
        messagesContainer: {
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa'
        },
        message: {
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            maxWidth: '85%',
            wordWrap: 'break-word',
            lineHeight: '1.4'
        },
        userMessage: {
            backgroundColor: '#2E7D32',
            color: 'white',
            marginLeft: 'auto',
            borderBottomRightRadius: '2px'
        },
        botMessage: {
            backgroundColor: 'white',
            color: '#333',
            marginRight: 'auto',
            border: '1px solid #e0e0e0',
            borderBottomLeftRadius: '2px'
        },
        errorMessage: {
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #ffcdd2'
        },
        inputContainer: {
            padding: '1rem',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: 'white',
            borderRadius: '0 0 10px 10px'
        },
        inputForm: {
            display: 'flex',
            gap: '0.5rem'
        },
        messageInput: {
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit'
        },
        sendButton: {
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            transition: 'background-color 0.2s'
        },
        sendButtonDisabled: {
            backgroundColor: '#a5d6a7',
            cursor: 'not-allowed'
        },
        clearButton: {
            width: '100%',
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: '#757575',
            border: '1px solid #e0e0e0',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
            transition: 'background-color 0.2s, color 0.2s'
        }
    };

    return (
        <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
                <h3 style={styles.chatTitle}>Krushi Sathi 🌱</h3>
                <button style={styles.closeButton} onClick={onClose} title="Close chat">
                    &times;
                </button>
            </div>
            
            <div style={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '2rem', fontStyle: 'italic' }}>
                        Welcome! How can I help you with your farming questions today?
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.message_id || message.timestamp} // Use DB ID or timestamp for a stable key
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
                {isLoading && (
                    <div style={{...styles.message, ...styles.botMessage}}>
                        <span>...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div style={styles.inputContainer}>
                <form onSubmit={sendMessage} style={styles.inputForm}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about crops, weather, prices..."
                        style={styles.messageInput}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        style={{
                            ...styles.sendButton,
                            ...((isLoading || !inputMessage.trim()) && styles.sendButtonDisabled)
                        }}
                        disabled={isLoading || !inputMessage.trim()}
                    >
                        Send
                    </button>
                </form>
                <button 
                    style={styles.clearButton} 
                    onClick={clearChat}
                    disabled={isLoading || messages.length === 0}
                >
                    Clear Chat
                </button>
            </div>
        </div>
    );
}

export default ChatBot;