const express = require('express');
const bcrypt  = require('bcryptjs');
const { prisma } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate, createUserSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// ─── POST /api/admin/users ─────────────────────────────────────────────────────
router.post('/users', validate(createUserSchema), async (req, res) => {
  try {
    const { phone, password, name, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { phone, password: hash, name, role: role || 'SUPERVISOR' },
      select: { id: true, name: true, phone: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId:  req.user.id,
        action:  'create_user',
        target:  user.id,
        details: JSON.stringify({ name, role }),
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, error: 'Phone number already exists' });
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate user' });
  }
});

// ─── POST /api/admin/workers/reset-cooldown ────────────────────────────────────
router.post('/workers/reset-cooldown', async (req, res) => {
  try {
    const { workerId } = req.body;
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data:  { status: 'AVAILABLE', cooldownUntil: null },
      include: {
        supervisor: { select: { id: true, name: true } },
        lockedBy:   { select: { id: true, name: true } },
      },
    });

    await prisma.history.create({
      data: {
        workerId,
        action:  'cooldown_reset',
        details: JSON.stringify({ adminName: req.user.name }),
      },
    });

    const io = req.app.get('io');
    io?.emit('worker:updated', worker);
    io?.emit('activity:new', {
      id:        Date.now().toString(),
      action:    'cooldown_reset',
      details:   { message: `Cooldown reset for ${worker.workerId} by ${req.user.name}` },
      workerId,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset cooldown' });
  }
});

// ─── POST /api/admin/workers/force-unlock ─────────────────────────────────────
router.post('/workers/force-unlock', async (req, res) => {
  try {
    const { workerId } = req.body;

    await prisma.batch.updateMany({
      where: { workerId, status: 'ACTIVE' },
      data:  { status: 'CANCELLED', finishedAt: new Date() },
    });

    const worker = await prisma.worker.update({
      where: { id: workerId },
      data:  { status: 'AVAILABLE', lockedById: null, lockExpiresAt: null },
      include: {
        supervisor: { select: { id: true, name: true } },
        lockedBy:   { select: { id: true, name: true } },
      },
    });

    await prisma.history.create({
      data: {
        workerId,
        action:  'force_unlocked',
        details: JSON.stringify({ adminName: req.user.name }),
      },
    });

    const io = req.app.get('io');
    io?.emit('worker:updated', worker);
    io?.emit('activity:new', {
      id:        Date.now().toString(),
      action:    'force_unlocked',
      details:   { message: `${worker.workerId} force-unlocked by ${req.user.name}` },
      workerId,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to force unlock' });
  }
});

// ─── GET /api/admin/audit-logs ─────────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
