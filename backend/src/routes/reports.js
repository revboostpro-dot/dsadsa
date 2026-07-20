const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─── GET /api/reports/daily ───────────────────────────────────────────────────
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(targetDate); end.setHours(23, 59, 59, 999);

    const [batches, payments, workers] = await Promise.all([
      prisma.batch.findMany({
        where:   { status: 'FINISHED', finishedAt: { gte: start, lte: end } },
        include: {
          worker:     { select: { workerId: true, name: true } },
          supervisor: { select: { name: true } },
        },
        orderBy: { finishedAt: 'asc' },
      }),
      prisma.payment.findMany({
        where:   { paidAt: { gte: start, lte: end } },
        include: {
          worker: { select: { workerId: true, name: true } },
          paidBy: { select: { name: true } },
        },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.worker.findMany({
        where: { isActive: true },
        select: { workerId: true, name: true, balance: true, status: true },
      }),
    ]);

    const totalPassed  = batches.reduce((s, b) => s + (b.passed || 0), 0);
    const totalFailed  = batches.reduce((s, b) => s + (b.failed || 0), 0);
    const totalEarned  = totalPassed * 5; // will be dynamic from settings
    const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        summary: { totalPassed, totalFailed, totalEarned, totalPayments, batchCount: batches.length },
        batches,
        payments,
        workers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate daily report' });
  }
});

// ─── GET /api/reports/weekly ──────────────────────────────────────────────────
router.get('/weekly', async (req, res) => {
  try {
    const { weekStart } = req.query;
    const start = weekStart ? new Date(weekStart) : (() => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
    })();
    const end = new Date(start); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999);

    const [batches, payments] = await Promise.all([
      prisma.batch.findMany({
        where:   { status: 'FINISHED', finishedAt: { gte: start, lte: end } },
        include: {
          worker:     { select: { workerId: true, name: true } },
          supervisor: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where:   { paidAt: { gte: start, lte: end } },
        include: {
          worker: { select: { workerId: true, name: true } },
          paidBy: { select: { name: true } },
        },
      }),
    ]);

    // Group by day
    const days = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      days[key] = { passed: 0, failed: 0, payments: 0, batchCount: 0 };
    }
    batches.forEach((b) => {
      const key = b.finishedAt?.toISOString().split('T')[0];
      if (key && days[key]) {
        days[key].passed     += b.passed || 0;
        days[key].failed     += b.failed || 0;
        days[key].batchCount += 1;
      }
    });
    payments.forEach((p) => {
      const key = p.paidAt.toISOString().split('T')[0];
      if (key && days[key]) days[key].payments += p.amount;
    });

    res.json({
      success: true,
      data: {
        weekStart: start.toISOString().split('T')[0],
        weekEnd:   end.toISOString().split('T')[0],
        days,
        batches,
        payments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate weekly report' });
  }
});

// ─── GET /api/reports/payroll ──────────────────────────────────────────────────
router.get('/payroll', async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      select: {
        id: true, workerId: true, name: true, phone: true, upiId: true,
        paymentMethod: true, balance: true, lifetimePassed: true, lifetimeFailed: true,
        supervisor: { select: { name: true } },
        payments: {
          select: { amount: true },
        },
      },
      orderBy: { workerId: 'asc' },
    });

    const payroll = workers.map((w) => {
      const alreadyPaid = w.payments.reduce((s, p) => s + p.amount, 0);
      return {
        workerId:       w.workerId,
        name:           w.name,
        phone:          w.phone,
        upiId:          w.upiId,
        paymentMethod:  w.paymentMethod,
        supervisor:     w.supervisor?.name,
        balance:        w.balance,
        alreadyPaid,
        lifetimeEarnings: w.balance + alreadyPaid,
        lifetimePassed: w.lifetimePassed,
        lifetimeFailed: w.lifetimeFailed,
      };
    });

    const totalPending = payroll.reduce((s, w) => s + w.balance, 0);
    const totalPaid    = payroll.reduce((s, w) => s + w.alreadyPaid, 0);

    res.json({
      success: true,
      data: { payroll, totalPending, totalPaid, totalLifetime: totalPending + totalPaid },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate payroll report' });
  }
});

module.exports = router;
