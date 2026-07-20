const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─── Helper: get setting value ─────────────────────────────────────────────────
async function getSetting(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? Number(s.value) : fallback;
}

// ─── Helper: emit activity + socket update ─────────────────────────────────────
async function emitActivity(io, workerId, action, details, workerData) {
  if (workerData) io?.emit('worker:updated', workerData);
  io?.emit('activity:new', {
    id:        Date.now().toString(),
    action,
    details,
    workerId,
    timestamp: new Date().toISOString(),
  });
}

// ─── POST /api/batches/start ──────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });

    const lockTimeout  = await getSetting('lockTimeout', 15);
    const maxBatchSize = await getSetting('maxBatchSize', 5);
    const lockExpiresAt = new Date(Date.now() + lockTimeout * 60 * 1000);

    const worker = await prisma.$transaction(async (tx) => {
      const w = await tx.worker.findUnique({ where: { id: workerId } });
      if (!w) throw new Error('Worker not found');
      if (w.status !== 'AVAILABLE') {
        throw new Error(`Worker is ${w.status.toLowerCase()}, cannot start batch`);
      }

      await tx.batch.updateMany({
        where: { workerId, status: 'ACTIVE' },
        data:  { status: 'CANCELLED' },
      });

      const updated = await tx.worker.update({
        where: { id: workerId },
        data:  { status: 'LOCKED', lockedById: req.user.id, lockExpiresAt },
        include: {
          supervisor: { select: { id: true, name: true } },
          lockedBy:   { select: { id: true, name: true } },
        },
      });

      await tx.batch.create({
        data: {
          workerId,
          supervisorId: req.user.id,
          progress:     0,
          maxProgress:  maxBatchSize,
          status:       'ACTIVE',
        },
      });

      await tx.history.create({
        data: {
          workerId,
          action:  'batch_started',
          details: JSON.stringify({ supervisorName: req.user.name, supervisorId: req.user.id }),
        },
      });

      return updated;
    });

    const io = req.app.get('io');
    await emitActivity(io, workerId, 'batch_started', {
      message:        `${req.user.name} started ${worker.workerId}`,
      workerName:     worker.name,
      supervisorName: req.user.name,
    }, worker);

    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── POST /api/batches/progress ───────────────────────────────────────────────
router.post('/progress', async (req, res) => {
  try {
    const { workerId, action } = req.body;
    if (!workerId || !['done', 'undo'].includes(action)) {
      return res.status(400).json({ success: false, error: 'workerId and action (done|undo) required' });
    }

    const lockTimeout   = await getSetting('lockTimeout', 15);
    const lockExpiresAt = new Date(Date.now() + lockTimeout * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.worker.findUnique({ where: { id: workerId } });
      if (!w || w.status !== 'LOCKED') throw new Error('Worker is not in an active batch');
      if (w.lockedById !== req.user.id) throw new Error('You are not managing this worker');

      const batch = await tx.batch.findFirst({
        where:   { workerId, status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
      });
      if (!batch) throw new Error('No active batch found');

      let newProgress = batch.progress;
      if (action === 'done') newProgress = Math.min(newProgress + 1, batch.maxProgress);
      if (action === 'undo') newProgress = Math.max(newProgress - 1, 0);

      const updatedBatch = await tx.batch.update({
        where: { id: batch.id },
        data:  { progress: newProgress, updatedAt: new Date() },
      });

      const updatedWorker = await tx.worker.update({
        where: { id: workerId },
        data:  { lockExpiresAt },
        include: {
          supervisor: { select: { id: true, name: true } },
          lockedBy:   { select: { id: true, name: true } },
        },
      });

      return { worker: updatedWorker, batch: updatedBatch };
    });

    const io = req.app.get('io');
    io?.emit('worker:updated', result.worker);
    io?.emit('batch:updated',  result.batch);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── POST /api/batches/finish ─────────────────────────────────────────────────
router.post('/finish', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });

    const [payPerQr, cooldownHours] = await Promise.all([
      getSetting('payPerQr', 5),
      getSetting('cooldownHours', 24),
    ]);

    const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.worker.findUnique({ where: { id: workerId } });
      if (!w || w.status !== 'LOCKED') throw new Error('Worker is not in an active batch');
      if (w.lockedById !== req.user.id) throw new Error('You are not managing this worker');

      const batch = await tx.batch.findFirst({
        where:   { workerId, status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
      });
      if (!batch) throw new Error('No active batch found');

      const passed = batch.progress;
      const failed = batch.maxProgress - batch.progress;
      const earned = passed * payPerQr;

      const finishedBatch = await tx.batch.update({
        where: { id: batch.id },
        data:  { status: 'FINISHED', passed, failed, finishedAt: new Date() },
      });

      const updatedWorker = await tx.worker.update({
        where: { id: workerId },
        data:  {
          status:         'COOLDOWN',
          balance:        { increment: earned },
          lifetimePassed: { increment: passed },
          lifetimeFailed: { increment: failed },
          cooldownUntil,
          lockedById:     null,
          lockExpiresAt:  null,
        },
        include: {
          supervisor: { select: { id: true, name: true } },
          lockedBy:   { select: { id: true, name: true } },
        },
      });

      await tx.history.create({
        data: {
          workerId,
          action:  'batch_finished',
          details: JSON.stringify({ passed, failed, earned, supervisorName: req.user.name }),
        },
      });

      return { worker: updatedWorker, batch: finishedBatch, passed, failed, earned };
    });

    const io = req.app.get('io');
    await emitActivity(io, workerId, 'batch_finished', {
      message: `${req.user.name} finished ${result.worker.workerId} — ${result.passed}/${result.passed + result.failed}`,
      passed:  result.passed,
      failed:  result.failed,
      earned:  result.earned,
    }, result.worker);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── POST /api/batches/cancel ─────────────────────────────────────────────────
router.post('/cancel', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.worker.findUnique({ where: { id: workerId } });
      if (!w) throw new Error('Worker not found');

      if (w.lockedById !== req.user.id && req.user.role !== 'ADMIN') {
        throw new Error('You are not managing this worker');
      }

      await tx.batch.updateMany({
        where: { workerId, status: 'ACTIVE' },
        data:  { status: 'CANCELLED', finishedAt: new Date() },
      });

      const updatedWorker = await tx.worker.update({
        where: { id: workerId },
        data:  { status: 'AVAILABLE', lockedById: null, lockExpiresAt: null },
        include: {
          supervisor: { select: { id: true, name: true } },
          lockedBy:   { select: { id: true, name: true } },
        },
      });

      await tx.history.create({
        data: {
          workerId,
          action:  'batch_cancelled',
          details: JSON.stringify({ supervisorName: req.user.name }),
        },
      });

      return updatedWorker;
    });

    const io = req.app.get('io');
    await emitActivity(io, workerId, 'batch_cancelled', {
      message: `${req.user.name} cancelled batch for ${result.workerId}`,
    }, result);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── GET /api/batches/active ──────────────────────────────────────────────────
router.get('/active', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where:   { status: 'ACTIVE' },
      include: {
        worker:     { select: { workerId: true, name: true } },
        supervisor: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch batches' });
  }
});

module.exports = router;
