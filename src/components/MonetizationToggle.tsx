"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";

export default function MonetizationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/toggle-monetization", { method: "POST" });
      const data = await res.json();
      if (res.ok) setEnabled(data.monetizationEnabled);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-chalk/10 bg-panel px-5 py-4">
      <div className="flex items-center gap-3">
        <DollarSign size={20} className={enabled ? "text-mustard" : "text-chalk-dim"} />
        <div>
          <p className="font-semibold text-chalk">Monetization</p>
          <p className="text-xs text-chalk-dim">
            {enabled
              ? "ON - pricing and upgrade prompts are visible to students"
              : "OFF - everything is free, no pricing shown anywhere"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-coral" : "bg-chalk/20"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
