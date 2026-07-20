const logger = require('../utils/logger');

/**
 * Set up Socket.IO event handlers for a connected client.
 */
function setupSocketHandlers(io, socket) {
  // Client can subscribe to specific worker rooms for targeted updates
  socket.on('worker:subscribe', (workerId) => {
    socket.join(`worker:${workerId}`);
    logger.info(`Socket ${socket.id} subscribed to worker:${workerId}`);
  });

  socket.on('worker:unsubscribe', (workerId) => {
    socket.leave(`worker:${workerId}`);
  });

  // Ping/pong for connection health
  socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
}

module.exports = { setupSocketHandlers };
