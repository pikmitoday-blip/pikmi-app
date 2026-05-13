require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Pitchly API radi!');
});


const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const onboardingRoutes = require('./routes/onboarding');
const profileEditRoutes = require('./routes/profile-edit');
const pitchLinkRoutes = require('./routes/pitch-link');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billing');
const outreachRoutes = require('./routes/outreach');
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile-edit', profileEditRoutes);
app.use('/api/pitch-link', pitchLinkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/outreach', outreachRoutes);

// TODO: Dodati rute za auth, profile, pitch linkove, billing, notifikacije

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server pokrenut na portu ${PORT}`);
});
