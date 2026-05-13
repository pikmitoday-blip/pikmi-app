"use client";
import { useState, useEffect } from "react";

export default function Billing() {
  const [sub, setSub] = useState<any>(null);
  const userId = "1";

  useEffect(() => {
    fetch(`/api/billing/${userId}`)
      .then(res => res.json())
      .then(data => setSub(data));
  }, []);

  async function subscribe(plan: string) {
    const res = await fetch(`/api/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan, provider: "stripe" })
    });
    const data = await res.json();
    setSub(data);
  }

  async function cancel() {
    await fetch(`/api/billing/${userId}`, { method: "DELETE" });
    setSub({ ...sub, status: "cancelled" });
  }

  return (
    <main className="max-w-md mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Naplata</h2>
      
      {sub?.status === "free" && (
        <div>
          <p className="mb-4">Trenutno koristiš besplatni plan.</p>
          <div className="border p-4 rounded mb-4">
            <h3 className="font-bold">Pro plan - 8€/mes</h3>
            <ul className="text-sm mt-2">
              <li>✓ Sve sekcije profila</li>
              <li>✓ Neograničeno pitch linkova</li>
              <li>✓ Tracking i notifikacije</li>
              <li>✓ Outreach kit</li>
              <li>✓ Custom boje i fontovi</li>
            </ul>
            <button className="btn mt-4" onClick={() => subscribe("pro")}>Pretplati se</button>
          </div>
        </div>
      )}
      
      {sub?.status === "active" && (
        <div>
          <p className="text-green-600 font-semibold">Aktivna pretplata: {sub.plan}</p>
          <p className="text-sm text-gray-500">Važi do: {new Date(sub.endsAt).toLocaleDateString()}</p>
          <button className="btn mt-4 bg-red-500" onClick={cancel}>Otkazi pretplatu</button>
        </div>
      )}
      
      {sub?.status === "cancelled" && (
        <div>
          <p className="text-orange-600">Pretplata otkazana.</p>
        </div>
      )}
    </main>
  );
}