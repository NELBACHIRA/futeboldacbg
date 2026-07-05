"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginPanel() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const payload = (await response.json()) as { ok: boolean; message?: string };

    if (!payload.ok) {
      setMessage(payload.message ?? "Falha no login.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-cyan-400/20 bg-black/50 p-8">
      <h2 className="text-xl font-bold uppercase tracking-[0.16em] text-cyan-200">Login Técnico/Admin</h2>
      <p className="mt-2 text-xs text-white/60">Acesso inicial admin padrão: usuário `admin` senha `admin123`.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
        <button disabled={loading} className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      {message ? <p className="mt-3 text-xs text-rose-300">{message}</p> : null}
    </section>
  );
}
