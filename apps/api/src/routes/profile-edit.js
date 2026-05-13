const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const profiles = [];

// Get profile by user (mock, by profileUrl)
router.get('/:profileUrl', (req, res) => {
  const { profileUrl } = req.params;
  const profile = profiles.find(p => p.profileUrl === profileUrl);
  if (!profile) return res.status(404).json({ error: 'Profil nije pronađen' });
  res.json(profile);
});

// Update profile (mock)
router.put('/:profileUrl', (req, res) => {
  const { profileUrl } = req.params;
  const idx = profiles.findIndex(p => p.profileUrl === profileUrl);
  if (idx === -1) return res.status(404).json({ error: 'Profil nije pronađen' });
  profiles[idx] = { ...profiles[idx], ...req.body };
  res.json(profiles[idx]);
});

// Create profile (mock)
router.post('/', (req, res) => {
  const profile = req.body;
  if (profiles.find(p => p.profileUrl === profile.profileUrl)) {
    return res.status(400).json({ error: 'Profil već postoji' });
  }
  profiles.push(profile);
  res.status(201).json(profile);
});

module.exports = router;
