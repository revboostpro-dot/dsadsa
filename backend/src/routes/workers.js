const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate, createWorkerSchema, updateWorkerSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// ─── Helper: get settings ─────────────────────────────────────────────────────
async function getSetting(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? s.value : String(fallback);
}

// ─── GET /api/workers ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status, supervisorId, hasBalance, page = 1, limit = 100 } = req.query;

    const where = { isActive: true };

    if (status)      where.status      = status;
    if (supervisorId) where.supervisorId = supervisorId;
    if (hasBalance === 'true') where.balance = { gt: 0 };

    if (search) {
      where.OR = [
        { name:     { contains: search, mode: 'insensitive' } },
        { workerId: { contains: search, mode: 'insensitive' } },
        { phone:    { contains: search, mode: 'insensitive' } },
        { upiId:    { contains: search, mode: 'insensitive' } },
        { status:   { equals: search.toUpperCase() } },
      ];
    }

    // Auto-expire locks and cooldowns
    const now = new Date();

    // Expire locks
    await prisma.worker.updateMany({
      where: { status: 'LOCKED', lockExpiresAt: { lt: now } },
      data: { status: 'AVAILABLE', lockedById: null, lockExpiresAt: null },
    });

    // Expire cooldowns
    await prisma.worker.updateMany({
      where: { status: 'COOLDOWN', cooldownUntil: { lt: now } },
      data: { status: 'AVAILABLE', cooldownUntil: null },
    });

    const workers = await prisma.worker.findMany({
      where,
      include: {
        supervisor: { select: { id: true, name: true } },
        lockedBy:   { select: { id: true, name: true } },
        batches: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: [{ status: 'asc' }, { workerId: 'asc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.worker.count({ where });

    res.json({ success: true, data: workers, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch workers' });
  }
});

// ─── GET /api/workers/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [available, cooldown, locked, pendingPayments, todayBatches, totalPayroll] = await Promise.all([
      prisma.worker.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.worker.count({ where: { status: 'COOLDOWN', isActive: true } }),
      prisma.worker.count({ where: { status: 'LOCKED',   isActive: true } }),
      prisma.worker.count({ where: { balance: { gt: 0 }, isActive: true } }),
      prisma.batch.findMany({
        where: { status: 'FINISHED', finishedAt: { gte: startOfDay } },
        select: { passed: true, failed: true },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
    ]);

    const activeBatches = await prisma.batch.count({ where: { status: 'ACTIVE' } });

    const todayPassed = todayBatches.reduce((sum, b) => sum + (b.passed || 0), 0);
    const todayFailed = todayBatches.reduce((sum, b) => sum + (b.failed || 0), 0);
    const todayPayroll = totalPayroll._sum.amount || 0;

    res.json({
      success: true,
      data: { available, cooldown, locked, pendingPayments, activeBatches, todayPassed, todayFailed, todayPayroll },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ─── GET /api/workers/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.params.id },
      include: {
        supervisor: { select: { id: true, name: true } },
        lockedBy:   { select: { id: true, name: true } },
        batches: {
          orderBy: { startedAt: 'desc' },
          take: 20,
          include: { supervisor: { select: { name: true } } },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 20,
          include: { paidBy: { select: { name: true } } },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

    const alreadyPaid = await prisma.payment.aggregate({
      where: { workerId: worker.id },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        ...worker,
        alreadyPaid: alreadyPaid._sum.amount || 0,
        lifetimeEarnings: (alreadyPaid._sum.amount || 0) + worker.balance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch worker' });
  }
});

// ─── POST /api/workers ────────────────────────────────────────────────────────
router.post('/', requireAdmin, validate(createWorkerSchema), async (req, res) => {
  try {
    const worker = await prisma.worker.create({ data: req.body });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('worker:created', worker);

    res.status(201).json({ success: true, data: worker });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Worker ID already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create worker' });
  }
});

// ─── PATCH /api/workers/:id ───────────────────────────────────────────────────
router.patch('/:id', requireAdmin, validate(updateWorkerSchema), async (req, res) => {
  try {
    const worker = await prisma.worker.update({
      where: { id: req.params.id },
      data: req.body,
    });

    const io = req.app.get('io');
    io?.emit('worker:updated', worker);

    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update worker' });
  }
});

// ─── DELETE /api/workers/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.worker.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    const io = req.app.get('io');
    io?.emit('worker:deleted', { id: req.params.id });

    res.json({ success: true, message: 'Worker deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete worker' });
  }
});

module.exports = router;
