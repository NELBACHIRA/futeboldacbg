"use client";

import { drawRandomNationality } from "@/lib/nationalities";
import { POSITIONS } from "@/lib/validators";
import { FormEvent, useEffect, useState } from "react";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Arquivo inválido")));
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

const REGISTRATION_LOCK_KEY = "futcraft:public-registration-locked";
const NATIONALITY_REROLL_USED_KEY = "futcraft:public-nationality-reroll-used";

export function PublicPlayerRegistration() {
  const [nick, setNick] = useState("");
  const [discord, setDiscord] = useState("");
  const [posicao, setPosicao] = useState<(typeof POSITIONS)[number] | "">("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [foto, setFoto] = useState("");
  const [compromisso, setCompromisso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [rerollUsed, setRerollUsed] = useState(false);

  useEffect(() => {
    setNacionalidade(drawRandomNationality());

    if (typeof window !== "undefined") {
      const locked = window.localStorage.getItem(REGISTRATION_LOCK_KEY) === "true";
      const used = window.localStorage.getItem(NATIONALITY_REROLL_USED_KEY) === "true";
      setIsLocked(locked);
      setRerollUsed(used);
      if (locked) {
        setMessage("Este dispositivo já realizou um registro e está bloqueado.");
      }
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setMessage("Registro bloqueado: este dispositivo já enviou inscrição.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickMinecraft: nick,
        discordTag: discord,
        posicao,
        nacionalidade,
        fotoCabecaDataUrl: foto,
        compromisso,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; message?: string };
    setMessage(payload.message ?? (payload.ok ? "Sucesso" : "Erro"));

    if (payload.ok) {
      setNick("");
      setDiscord("");
      setPosicao("");
      setFoto("");
      setCompromisso(false);
      setNacionalidade(drawRandomNationality());

      if (typeof window !== "undefined") {
        window.localStorage.setItem(REGISTRATION_LOCK_KEY, "true");
      }
      setIsLocked(true);
      setMessage("Registro enviado. Este dispositivo não pode registrar novamente.");
    }

    setLoading(false);
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-black/45 p-6 sm:p-8">
      <h2 className="text-lg font-bold uppercase tracking-[0.16em] text-cyan-200">Registro de Jogador</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Nick Minecraft" className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
        <input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="Discord Tag" className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
        <select value={posicao} onChange={(e) => setPosicao(e.target.value as (typeof POSITIONS)[number] | "")} className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm">
          <option value="">Posição</option>
          {POSITIONS.map((position) => (
            <option key={position} value={position} className="bg-zinc-900">
              {position}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input value={nacionalidade} readOnly className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
          <button
            type="button"
            disabled={rerollUsed || isLocked}
            onClick={() => {
              setNacionalidade(drawRandomNationality());
              setRerollUsed(true);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(NATIONALITY_REROLL_USED_KEY, "true");
              }
            }}
            className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 text-xs disabled:opacity-50"
          >
            {rerollUsed ? "Giro usado" : "Girar"}
          </button>
        </div>
        <input
          type="file"
          accept="image/*"
          required
          className="md:col-span-2 rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-xs"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFoto(await fileToDataUrl(file));
          }}
        />
        <label className="md:col-span-2 flex items-start gap-3 text-xs text-white/70">
          <input type="checkbox" checked={compromisso} onChange={(e) => setCompromisso(e.target.checked)} required className="mt-0.5" />
          Prometo jogar seriamente e cumprir os horários da liga. Inscrições falsas resultarão em banimento por IP.
        </label>
        <button disabled={loading || isLocked} className="md:col-span-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-60">
          {loading ? "Enviando..." : isLocked ? "Registro Bloqueado" : "Enviar Registro"}
        </button>
      </form>
      <p className="mt-3 text-[11px] text-white/55">Regras: 1 registro por dispositivo e apenas 1 giro manual de nacionalidade.</p>
      {message ? <p className="mt-2 text-xs text-white/70">{message}</p> : null}
    </section>
  );
}
