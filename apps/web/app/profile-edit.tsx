"use client";
import { useState } from "react";

export default function ProfileEdit() {
  const [form, setForm] = useState({
    profileUrl: "",
    content: "",
    appearance: "",
    published: false
  });
  const [status, setStatus] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveProfile() {
    const res = await fetch(`/api/profile-edit/${form.profileUrl}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) setStatus("Sačuvano!");
    else setStatus("Greška pri čuvanju");
  }

  return (
    <main className="max-w-md mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Uredi profil</h2>
      <input name="profileUrl" value={form.profileUrl} onChange={handleChange} className="input mb-4" placeholder="Tvoj Pitchly URL" />
      <textarea name="content" value={form.content} onChange={handleChange} className="input mb-4" placeholder="Sadržaj profila" />
      <input name="appearance" value={form.appearance} onChange={handleChange} className="input mb-4" placeholder="Izgled (JSON ili opis)" />
      <label className="block mb-2">
        <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} /> Objavi profil
      </label>
      <button className="btn" onClick={saveProfile}>Sačuvaj</button>
      {status && <div className="mt-2 text-green-600">{status}</div>}
    </main>
  );
}
