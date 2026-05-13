const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const subscriptions = [];

// Get subscription status
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const sub = subscriptions.find(s => s.userId === userId);
  if (!sub) {
    return res.json({ status: 'free', plan: null, trialEnds: null });
  }
  res.json(sub);
});

// Create or update subscription (mock - in real app would call Stripe/AllSecure)
router.post('/', (req, res) => {
  const { userId, plan, provider } = req.body;
  const existing = subscriptions.findIndex(s => s.userId === userId);
  const sub = {
    userId,
    plan,
    provider,
    status: 'active',
    startedAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };
  if (existing >= 0) {
    subscriptions[existing] = sub;
  } else {
    subscriptions.push(sub);
  }
  res.json(sub);
});

// Cancel subscription
router.delete('/:userId', (req, res) => {
  const { userId } = req.params;
  const idx = subscriptions.findIndex(s => s.userId === userId);
  if (idx >= 0) {
    subscriptions[idx].status = 'cancelled';
  }
  res.json({ message: 'Pretplata otkazana' });
});

module.exports = router;