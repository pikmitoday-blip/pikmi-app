"use client";
import { useState } from "react";

export default function PitchLinkCreator() {
  const [form, setForm] = useState({
    userId: "1", // mock user
    clientName: "",
    slug: "",
    message: "",
    filters: ""
  });
  const [status, setStatus] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createLink() {
    const res = await fetch(`/api/pitch-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) setStatus("Link kreiran!");
    else setStatus("Greška pri kreiranju");
  }

  return (
    <main className="max-w-md mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Kreiraj Pitch Link</h2>
      <input name="clientName" value={form.clientName} onChange={handleChange} className="input mb-4" placeholder="Ime klijenta" />
      <input name="slug" value={form.slug} onChange={handleChange} className="input mb-4" placeholder="Slug (npr. coca-cola)" />
      <textarea name="message" value={form.message} onChange={handleChange} className="input mb-4" placeholder="Poruka za klijenta" />
      <input name="filters" value={form.filters} onChange={handleChange} className="input mb-4" placeholder="Filter projekata (opciono)" />
      <button className="btn" onClick={createLink}>Kreiraj link</button>
      {status && <div className="mt-2 text-green-600">{status}</div>}
    </main>
  );
}
