"use client";
import { useState, useEffect } from "react";

const professions = ["Video editor", "Copywriter", "Grafički dizajner", "Web dizajner", "SMM menadžer", "Fotograf"];

export default function Outreach() {
  const [profession, setProfession] = useState("Web dizajner");
  const [templates, setTemplates] = useState<any>(null);
  const [language, setLanguage] = useState("SR");
  const [form, setForm] = useState({ imeKlijenta: "", kompanija: "", mojaNisa: "" });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/outreach/${profession}`)
      .then(res => res.json())
      .then(data => setTemplates(data));
  }, [profession]);

  function fillTemplate(text: string): string {
    return text
      .replace(/{ime klijenta}/g, form.imeKlijenta || "[ime klijenta]")
      .replace(/{kompanija}/g, form.kompanija || "[kompanija]")
      .replace(/{moja niša}/g, form.mojaNisa || profession)
      .replace(/{personalizovan link}/g, "https://pitchly.rs/vas-link");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!templates) return <main className="p-6">Učitavanje...</main>;

  return (
    <main className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Outreach Kit</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Profesija</label>
        <select value={profession} onChange={e => setProfession(e.target.value)} className="input">
          {professions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Jezik</label>
        <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
          <option value="SR">Srpski</option>
          <option value="EN">Engleski</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <input placeholder="Ime klijenta" value={form.imeKlijenta} onChange={e => setForm({...form, imeKlijenta: e.target.value})} className="input" />
        <input placeholder="Kompanija" value={form.kompanija} onChange={e => setForm({...form, kompanija: e.target.value})} className="input" />
        <input placeholder="Moja niša" value={form.mojaNisa} onChange={e => setForm({...form, mojaNisa: e.target.value})} className="input" />
      </div>

      <h3 className="font-semibold mb-2">Cold DM</h3>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <pre className="whitespace-pre-wrap text-sm">{fillTemplate(language === "SR" ? templates.cold_dm_sr : templates.cold_dm_en)}</pre>
        <button className="btn mt-2 text-sm" onClick={() => copy(fillTemplate(language === "SR" ? templates.cold_dm_sr : templates.cold_dm_en), "dm")}>
          {copied === "dm" ? "Kopirano!" : "Kopiraj"}
        </button>
      </div>

      <h3 className="font-semibold mb-2">Cold Email</h3>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <pre className="whitespace-pre-wrap text-sm">{fillTemplate(language === "SR" ? templates.cold_email_sr : templates.cold_email_en)}</pre>
        <button className="btn mt-2 text-sm" onClick={() => copy(fillTemplate(language === "SR" ? templates.cold_email_sr : templates.cold_email_en), "email")}>
          {copied === "email" ? "Kopirano!" : "Kopiraj"}
        </button>
      </div>

      <h3 className="font-semibold mb-2">Follow-up</h3>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <pre className="whitespace-pre-wrap text-sm">{fillTemplate(language === "SR" ? templates.follow_up_sr : templates.follow_up_en)}</pre>
        <button className="btn mt-2 text-sm" onClick={() => copy(fillTemplate(language === "SR" ? templates.follow_up_sr : templates.follow_up_en), "follow")}>
          {copied === "follow" ? "Kopirano!" : "Kopiraj"}
        </button>
      </div>
    </main>
  );
}