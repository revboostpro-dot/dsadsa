const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    throw err;
  }
}

module.exports = { prisma, connectDB };
