const express = require('express');
const router = express.Router();

// Template-i po profesiji (SR + EN)
const templates = {
  "Video editor": {
    cold_dm_sr: "Zdravo {ime klijenta}! Video editor sa 5+ godina iskustva. Pogledaj moj rad: {personalizovan link} — možda mogu da pomognem vašem timu!",
    cold_dm_en: "Hi {ime klijenta}! Video editor with 5+ years of experience. Check out my work: {personalizovan link} — maybe I can help your team!",
    cold_email_sr: "Poštovani {ime klijenta},\n\nPišem vam jer vidim da vam treba kvalitetan video sadržaj. Moja rešenja su pomogla kompanijama da povećaju angažman za 200%.\n\nPogledajte moj portfolio: {personalizovan link}\n\nSrdačno,\n{moja niša}",
    cold_email_en: "Dear {ime klijenta},\n\nI'm reaching out because I see you need quality video content. My solutions have helped companies increase engagement by 200%.\n\nCheck out my portfolio: {personalizovan link}\n\nBest,\n{moja niša}",
    follow_up_sr: "SamO još jednom — da li ste imali vremena da pogledate moj rad? {personalizovan link}",
    follow_up_en: "Just following up — did you get a chance to look at my work? {personalizovan link}"
  },
  "Copywriter": {
    cold_dm_sr: "Zdravo {ime klijenta}! Pisac sa iskustvom u tech i startup sceni. Evo mog rada: {personalizovan link}",
    cold_dm_en: "Hi {ime klijenta}! Copywriter with experience in tech and startup scene. Here's my work: {personalizovan link}",
    cold_email_sr: "Poštovani {ime klijenta},\n\nPomažem brendovima da pričaju jasnije. Od SaaS-a do e-commerce — moji tekstovi prodaju.\n\nPogledajte: {personalizovan link}",
    cold_email_en: "Dear {ime klijenta},\n\nI help brands tell their story more clearly. From SaaS to e-commerce — my copy sells.\n\nCheck it out: {personalizovan link}",
    follow_up_sr: "Samo proveravam — da li je nešto odjeknulo? {personalizovan link}",
    follow_up_en: "Just checking in — did anything resonate? {personalizovan link}"
  },
  "Grafički dizajner": {
    cold_dm_sr: "Zdravo {ime klijenta}! Dizajner koji pravi vizuelne identitete koji se pamte. Pogledaj: {personalizovan link}",
    cold_dm_en: "Hi {ime klijenta}! Designer creating memorable visual identities. Check out: {personalizovan link}",
    cold_email_sr: "Poštovani {ime klijenta},\n\nVaš brend zaslužuje vizuel koji ga odražava. Moji radovi: {personalizovan link}",
    cold_email_en: "Dear {ime klijenta},\n\nYour brand deserves a visual that represents it. My work: {personalizovan link}",
    follow_up_sr: "Da li ste imali vremena da pogledate? {personalizovan link}",
    follow_up_en: "Did you get a chance to look? {personalizovan link}"
  },
  "Web dizajner": {
    cold_dm_sr: "Zdravo {ime klijenta}! Web dizajner fokusiran na konverzije. Moj rad: {personalizovan link}",
    cold_dm_en: "Hi {ime klijenta}! Web designer focused on conversions. My work: {personalizovan link}",
    cold_email_sr: "Poštovani {ime klijenta},\n\nPravim sajtove koji donose rezultate. Pogledajte: {personalizovan link}",
    cold_email_en: "Dear {ime klijenta},\n\nI build websites that deliver results. Check out: {personalizovan link}",
    follow_up_sr: "Samo da proverim — da li vam treba web sajt? {personalizovan link}",
    follow_up_en: "Just checking in — do you need a website? {personalizovan link}"
  },
  "SMM menadžer": {
    cold_dm_sr: "Zdravo {ime klijenta}! SMM sa dokazanim rezultatima. Moji rezultati: {personalizovan link}",
    cold_dm_en: "Hi {ime klijenta}! SMM manager with proven results. My results: {personalizovan link}",
    cold_email_sr: "Poštovani {ime klijenta},\n\nPomažem brendovima da rastu na društvenim mrežama. Rezultati: {personalizovan link}",
    cold_email_en: "Dear {ime klijenta},\n\nI help brands grow on social media. Results: {personalizovan link}",
    follow_up_sr: "Kako ide sa društvenim mrežama? {personalizovan link}",
    follow_up_en: "How's it going with social media? {personalizovan link}"
  },
  "Fotograf": {
    cold_dm_sr: "Zdravo {ime klijenta}! Fotograf sa 8+ godina. Moj portfolio: {personalizovan link}",
    cold_dm_en: "Hi {ime klijenta}! Photographer with 8+ years. My portfolio: {personalizovan link}",
    cold_email_sr: "Poštovani {ime klijenta},\n\nVaš brend zaslužuje profesionalne fotografije. Pogledajte: {personalizovan link}",
    cold_email_en: "Dear {ime klijenta},\n\nYour brand deserves professional photos. Check out: {personalizovan link}",
    follow_up_sr: "Da li vam treba fotograf? {personalizovan link}",
    follow_up_en: "Do you need a photographer? {personalizovan link}"
  }
};

// Get templates by profession
router.get('/:profession', (req, res) => {
  const { profession } = req.params;
  const profTemplates = templates[profession];
  if (!profTemplates) {
    return res.json(templates["Web dizajner"]); // default
  }
  res.json(profTemplates);
});

// Get all professions
router.get('/', (req, res) => {
  res.json(Object.keys(templates));
});

module.exports = router;