const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const views = [];

// Get dashboard stats for user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const userViews = views.filter(v => v.userId === userId);
  
  const totalLinks = userViews.length;
  const totalOpens = userViews.length;
  const hotLeads = userViews.filter(v => v.visits >= 2 || v.duration > 120).length;
  
  res.json({
    totalLinks,
    totalOpens,
    hotLeads,
    recentViews: userViews.slice(-10)
  });
});

// Track a view (called when someone opens a pitch link)
router.post('/track', (req, res) => {
  const { userId, pitchSlug, clientName, duration, sections } = req.body;
  const view = { 
    id: views.length + 1, 
    userId, 
    pitchSlug, 
    clientName, 
    duration: duration || 0,
    sections: sections || [],
    timestamp: new Date()
  };
  views.push(view);
  res.status(201).json({ message: 'Praćenje evidentirano' });
});

module.exports = router;