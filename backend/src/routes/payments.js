const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { validate, paymentSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// ─── POST /api/payments ───────────────────────────────────────────────────────
router.post('/', validate(paymentSchema), async (req, res) => {
  try {
    const { workerId, amount, note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const worker = await tx.worker.findUnique({ where: { id: workerId } });
      if (!worker) throw new Error('Worker not found');
      if (worker.balance < amount) throw new Error('Insufficient balance');

      const updatedWorker = await tx.worker.update({
        where: { id: workerId },
        data:  { balance: { decrement: amount } },
        include: {
          supervisor: { select: { id: true, name: true } },
          lockedBy:   { select: { id: true, name: true } },
        },
      });

      const payment = await tx.payment.create({
        data: { workerId, amount, note, paidById: req.user.id },
        include: { paidBy: { select: { name: true } } },
      });

      await tx.history.create({
        data: {
          workerId,
          action:  'payment_made',
          details: JSON.stringify({ amount, note, paidBy: req.user.name }),
        },
      });

      return { worker: updatedWorker, payment };
    });

    const io = req.app.get('io');
    io?.emit('worker:updated', result.worker);
    io?.emit('activity:new', {
      id:        Date.now().toString(),
      action:    'payment_made',
      details:   { message: `Payment ₹${amount} to ${result.worker.workerId}`, amount },
      workerId,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── GET /api/payments ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { workerId, page = 1, limit = 50, from, to } = req.query;
    const where = {};
    if (workerId) where.workerId = workerId;
    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = new Date(from);
      if (to)   where.paidAt.lte = new Date(to);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          worker: { select: { workerId: true, name: true } },
          paidBy: { select: { name: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ success: true, data: payments, total });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// ─── GET /api/payments/summary ────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);

    const [totalPaid, todayPaid, pendingWorkers] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfDay } },
        _sum:  { amount: true },
      }),
      prisma.worker.aggregate({
        where: { balance: { gt: 0 }, isActive: true },
        _sum:  { balance: true },
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalPaid:      totalPaid._sum.amount || 0,
        todayPaid:      todayPaid._sum.amount || 0,
        pendingAmount:  pendingWorkers._sum.balance || 0,
        pendingWorkers: pendingWorkers._count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment summary' });
  }
});

module.exports = router;
