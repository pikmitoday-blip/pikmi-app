const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const profiles = [];

// Get public profile by URL
router.get('/:profileUrl', (req, res) => {
  const { profileUrl } = req.params;
  const profile = profiles.find(p => p.profileUrl === profileUrl);
  if (!profile) return res.status(404).json({ error: 'Profil nije pronađen' });
  res.json(profile);
});

// Update profile (protected, mock)
router.put('/:profileUrl', (req, res) => {
  const { profileUrl } = req.params;
  const idx = profiles.findIndex(p => p.profileUrl === profileUrl);
  if (idx === -1) return res.status(404).json({ error: 'Profil nije pronađen' });
  profiles[idx] = { ...profiles[idx], ...req.body };
  res.json(profiles[idx]);
});

module.exports = router;
