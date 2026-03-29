/**
 * Real-Time Service
 * Manages Socket.IO connections and event broadcasting
 */
class RealTimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  /**
   * Initialize Socket.IO
   * @param {Object} io - Socket.IO server instance
   */
  init(io) {
    this.io = io;

    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // Handle user registration
      socket.on('register', (userId) => {
        if (userId) {
          this.connectedUsers.set(userId, socket.id);
          console.log(`👤 User registered: ${userId} (Socket: ${socket.id})`);
          
          // Join role-based rooms if user info is available
          // This could be enhanced with actual role check from DB
        }
      });

      socket.on('disconnect', (reason) => {
        // Remove user from map
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`🔌 User disconnected: ${userId} (Reason: ${reason})`);
            break;
          }
        }
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error.message);
      });

      // Handle reconnection attempts
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber} for ${socket.id}`);
      });
    });

    console.log('✅ Real-Time Service Initialized');
  }

  /**
   * Broadcast an event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event payload
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send an event to a specific user
   * @param {string} userId - Target user ID
   * @param {string} event - Event name
   * @param {Object} data - Event payload
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (this.io && socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Helper methods for common events
   */
  emitBookingUpdate(bookingData) {
    this.broadcast('booking_update', {
      type: 'BOOKING_CREATED',
      data: bookingData
    });
  }

  emitPaymentUpdate(paymentData) {
    this.broadcast('payment_update', {
      type: 'PAYMENT_PROCESSED',
      data: paymentData
    });
  }

  emitBillingUpdate(billingData) {
    this.broadcast('billing_update', {
      type: 'BILL_GENERATED',
      data: billingData
    });
  }
}

module.exports = new RealTimeService();
