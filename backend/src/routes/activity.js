const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// In-memory activity feed (last 100 events, cleared on restart)
// For production, you'd persist this to Redis or DB
const activityFeed = [];
const MAX_FEED = 100;

function addActivity(event) {
  activityFeed.unshift(event);
  if (activityFeed.length > MAX_FEED) activityFeed.pop();
}

// Export for use by socket handler
module.exports.addActivity = addActivity;

// ─── GET /api/activity ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Combine in-memory feed with recent history from DB
    const history = await prisma.history.findMany({
      include: { worker: { select: { workerId: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const dbEvents = history.map((h) => ({
      id:        h.id,
      action:    h.action,
      details:   h.details,
      workerId:  h.workerId,
      timestamp: h.createdAt.toISOString(),
      workerLabel: `${h.worker?.workerId} - ${h.worker?.name}`,
    }));

    res.json({ success: true, data: [...activityFeed, ...dbEvents].slice(0, MAX_FEED) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

module.exports = router;
