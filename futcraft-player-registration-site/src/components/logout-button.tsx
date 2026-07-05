"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        router.refresh();
      }}
      className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/80"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
