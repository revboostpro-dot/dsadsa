const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, loginSchema } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ─── POST /api/auth/change-password ───────────────────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

module.exports = router;
