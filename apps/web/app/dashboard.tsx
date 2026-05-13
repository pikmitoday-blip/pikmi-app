"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const userId = "1";

  useEffect(() => {
    fetch(`/api/dashboard/${userId}`)
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <main className="p-6">Učitavanje...</main>;

  return (
    <main className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <div className="text-2xl font-bold">{stats.totalLinks}</div>
          <div className="text-sm">Ukupno linkova</div>
        </div>
        <div className="p-4 bg-green-100 rounded">
          <div className="text-2xl font-bold">{stats.totalOpens}</div>
          <div className="text-sm">Otvaranja</div>
        </div>
        <div className="p-4 bg-orange-100 rounded">
          <div className="text-2xl font-bold">{stats.hotLeads}</div>
          <div className="text-sm">Hot lead-ovi</div>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Poslednji pregledi</h3>
      {stats.recentViews.length === 0 ? (
        <p className="text-gray-500">Još nema pregleda.</p>
      ) : (
        <ul className="space-y-2">
          {stats.recentViews.map((v: any, i: number) => (
            <li key={i} className="p-2 border rounded">
              <strong>{v.clientName}</strong> - {v.duration}s - {v.sections?.join(', ') || 'Nema podataka'}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}