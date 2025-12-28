import React, { useState, useEffect } from 'react';
import '../styles/message-display.css';

let messageIdCounter = 0;
let addMessageCallback = null;

// Export function to show messages from anywhere
export const showMessage = (type, title, description, duration) => {
  if (addMessageCallback) {
    addMessageCallback(type, title, description, duration);
  }
};

const MessageDisplay = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Register callback for external message additions
    addMessageCallback = (type, title, description, duration) => {
      const id = ++messageIdCounter;
      const newMessage = {
        id,
        type,
        title,
        description,
        duration: duration || (type === 'error' ? 8000 : 5000)
      };

      setMessages(prev => [...prev, newMessage]);

      // Auto-dismiss
      setTimeout(() => {
        removeMessage(id);
      }, newMessage.duration);
    };

    return () => {
      addMessageCallback = null;
    };
  }, []);

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className="message-container">
      {messages.map(msg => (
        <div key={msg.id} className={`message message-${msg.type}`}>
          <div className="message-icon">{getIcon(msg.type)}</div>
          <div className="message-content">
            <div className="message-title">{msg.title}</div>
            {msg.description && (
              <div className="message-description">{msg.description}</div>
            )}
          </div>
          <button 
            className="message-close" 
            onClick={() => removeMessage(msg.id)}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageDisplay;
