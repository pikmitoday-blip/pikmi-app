const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const onboarded = [];

// Onboarding - create user profile (mock)
router.post('/', (req, res) => {
  const { name, city, avatar, profession, profileUrl, language } = req.body;
  if (onboarded.find(u => u.profileUrl === profileUrl)) {
    return res.status(400).json({ error: 'URL već postoji' });
  }
  const user = { id: onboarded.length + 1, name, city, avatar, profession, profileUrl, language };
  onboarded.push(user);
  res.status(201).json({ message: 'Onboarding uspešan', user });
});

// Provera dostupnosti URL-a
router.get('/check-url/:profileUrl', (req, res) => {
  const { profileUrl } = req.params;
  const exists = onboarded.some(u => u.profileUrl === profileUrl);
  if (exists) {
    // predlozi alternative
    return res.json({ available: false, suggestions: [profileUrl + '1', profileUrl + '2', profileUrl + '3'] });
  }
  res.json({ available: true });
});

module.exports = router;
