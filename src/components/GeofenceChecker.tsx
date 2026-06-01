"use client";

import { useState } from "react";
import {
  SAMPLE_POINT_INSIDE,
  SAMPLE_POINT_OUTSIDE,
} from "@/lib/geofence";

type GeofenceResponse = {
  lat: number;
  lng: number;
  inside: boolean;
  polygon?: string;
  error?: string;
};

export function GeofenceChecker() {
  const [lat, setLat] = useState(String(SAMPLE_POINT_INSIDE.lat));
  const [lng, setLng] = useState(String(SAMPLE_POINT_INSIDE.lng));
  const [result, setResult] = useState<GeofenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ lat, lng });
      const response = await fetch(`/api/geofence?${params.toString()}`);
      const data = (await response.json()) as GeofenceResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? `Request failed (${response.status})`);
        return;
      }

      setResult(data);
    } catch {
      setError("Network error while calling /api/geofence");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(inside: boolean) {
    const point = inside ? SAMPLE_POINT_INSIDE : SAMPLE_POINT_OUTSIDE;
    setLat(String(point.lat));
    setLng(String(point.lng));
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        2. PostGIS geofence check
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        API route uses Prisma <code className="text-xs">$queryRaw</code> with{" "}
        <code className="text-xs">ST_Contains</code> against a hardcoded polygon.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-zinc-600">Latitude</span>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-zinc-600">Longitude</span>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => loadSample(true)}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Sample inside
        </button>
        <button
          type="button"
          onClick={() => loadSample(false)}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Sample outside
        </button>
        <button
          type="button"
          onClick={check}
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check geofence"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p
          className={`mt-3 text-sm font-medium ${result.inside ? "text-emerald-700" : "text-amber-700"}`}
        >
          Point ({result.lat}, {result.lng}) is{" "}
          {result.inside ? "INSIDE" : "OUTSIDE"} the geofence.
        </p>
      )}
    </section>
  );
}
