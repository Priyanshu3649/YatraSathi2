import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const RealTimeContext = createContext();

export const useRealTime = () => {
    const context = useContext(RealTimeContext);
    if (!context) {
        throw new Error('useRealTime must be used within a RealTimeProvider');
    }
    return context;
};

export const RealTimeProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Initialize socket connection using the same origin to leverage Vite's proxy
        const newSocket = io({
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
        });

        newSocket.on('connect', () => {
            console.log('🔌 Connected to real-time server');
            setIsConnected(true);
            
            // Register user
            newSocket.emit('register', user.us_usid);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Disconnected from real-time server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ Connection error:', error);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [{ id, message, type, timestamp: new Date() }, ...prev].slice(0, 10));
        setLastUpdate(new Date());
    }, []);

    const value = {
        socket,
        isConnected,
        lastUpdate,
        notifications,
        addNotification
    };

    return (
        <RealTimeContext.Provider value={value}>
            {children}
        </RealTimeContext.Provider>
    );
};
