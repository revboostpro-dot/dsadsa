const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate, settingSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// ─── GET /api/settings ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    // Convert to a key-value map for easy consumption
    const map = {};
    for (const s of settings) map[s.key] = { ...s };
    res.json({ success: true, data: map });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// ─── PATCH /api/settings/:key ─────────────────────────────────────────────────
router.patch('/:key', requireAdmin, validate(settingSchema), async (req, res) => {
  try {
    const setting = await prisma.setting.update({
      where: { key: req.params.key },
      data:  { value: req.body.value },
    });
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

module.exports = router;
