"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Upgrade to Pro"}
      </button>
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
