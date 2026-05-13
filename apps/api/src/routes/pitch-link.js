const express = require('express');
const router = express.Router();

// TODO: Zameniti mock sa pravom bazom (Prisma)
const pitchLinks = [];

// Kreiraj novi pitch link
router.post('/', (req, res) => {
  const { userId, clientName, slug, message, filters } = req.body;
  if (pitchLinks.find(l => l.slug === slug)) {
    return res.status(400).json({ error: 'Slug već postoji' });
  }
  const link = { id: pitchLinks.length + 1, userId, clientName, slug, message, filters, status: 'active', views: 0 };
  pitchLinks.push(link);
  res.status(201).json(link);
});

// Lista svih pitch linkova za korisnika
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const links = pitchLinks.filter(l => l.userId === userId);
  res.json(links);
});

// Prikaz personalizovanog pitch linka
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const link = pitchLinks.find(l => l.slug === slug);
  if (!link) return res.status(404).json({ error: 'Link nije pronađen' });
  res.json(link);
});

// Arhiviraj ili obriši link
router.delete('/:slug', (req, res) => {
  const { slug } = req.params;
  const idx = pitchLinks.findIndex(l => l.slug === slug);
  if (idx === -1) return res.status(404).json({ error: 'Link nije pronađen' });
  pitchLinks.splice(idx, 1);
  res.json({ message: 'Link obrisan' });
});

module.exports = router;
