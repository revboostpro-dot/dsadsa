const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { setupSocketHandlers } = require('../socket/handlers');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);
    setupSocketHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Client disconnected: ${socket.id} - ${reason}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
