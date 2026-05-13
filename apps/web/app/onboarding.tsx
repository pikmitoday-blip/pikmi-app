"use client";
import { useState } from "react";

async function checkUrl(profileUrl: string) {
  const res = await fetch(`/api/onboarding/check-url/${profileUrl}`);
  return res.json();
}

async function submitOnboarding(form: any) {
  const res = await fetch(`/api/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });
  return res.json();
}

const professions = [
  "Video editor",
  "Copywriter",
  "Grafički dizajner",
  "Web dizajner",
  "SMM menadžer",
  "Fotograf",
  "Drugo / kombinacija"
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    city: "",
    avatar: "",
    profession: "",
    profileUrl: "",
    language: "SR"
  });
  const [checking, setChecking] = useState(false);
  const [urlStatus, setUrlStatus] = useState<{available: boolean, suggestions?: string[]} | null>(null);
  const [done, setDone] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function next() {
    if (step === 3 && form.profileUrl) {
      setChecking(true);
      const status = await checkUrl(form.profileUrl);
      setUrlStatus(status);
      setChecking(false);
      if (!status.available) return;
    }
    setStep(step + 1);
  }
  function prev() { setStep(step - 1); }


  async function finish() {
    setChecking(true);
    const res = await submitOnboarding(form);
    setChecking(false);
    if (res.user) setDone(true);
  }

  return (
    <main className="max-w-md mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Onboarding</h2>
      {done ? (
        <div className="text-green-600 font-semibold">Onboarding uspešan! Možete nastaviti dalje.</div>
      ) : (
        <>
          {step === 1 && (
            <div>
              <label className="block mb-2">Ime i prezime</label>
              <input name="name" value={form.name} onChange={handleChange} className="input mb-4" />
              <label className="block mb-2">Grad</label>
              <input name="city" value={form.city} onChange={handleChange} className="input mb-4" />
              <button onClick={next} className="btn">Dalje</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block mb-2">Izaberi profesiju</label>
              <select name="profession" value={form.profession} onChange={handleChange} className="input mb-4">
                <option value="">-- Izaberi --</option>
                {professions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={prev} className="btn mr-2">Nazad</button>
              <button onClick={next} className="btn">Dalje</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="block mb-2">Tvoj Pitchly URL</label>
              <input name="profileUrl" value={form.profileUrl} onChange={handleChange} className="input mb-4" />
              {checking && <div>Provera dostupnosti...</div>}
              {urlStatus && !urlStatus.available && (
                <div className="text-red-600 mb-2">URL nije dostupan. Predlozi: {urlStatus.suggestions?.join(', ')}</div>
              )}
              <label className="block mb-2">Jezik profila</label>
              <select name="language" value={form.language} onChange={handleChange} className="input mb-4">
                <option value="SR">Srpski</option>
                <option value="EN">Engleski</option>
              </select>
              <button onClick={prev} className="btn mr-2">Nazad</button>
              <button className="btn" onClick={finish} disabled={checking || !!(urlStatus && !urlStatus.available)}>Završi</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
