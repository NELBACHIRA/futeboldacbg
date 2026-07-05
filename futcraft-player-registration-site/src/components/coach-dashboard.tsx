"use client";

import { TacticalBoard } from "@/components/tactical-board";
import { drawRandomNationality } from "@/lib/nationalities";
import { POSITIONS } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type PlayerDto = {
  id: string;
  createdAt: string;
  nickMinecraft: string;
  discordTag: string;
  posicao: "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";
  nacionalidade: string;
  fotoCabecaDataUrl: string;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Arquivo inválido")));
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export function CoachDashboard({ teamName, players }: { teamName: string; players: PlayerDto[] }) {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [discord, setDiscord] = useState("");
  const [posicao, setPosicao] = useState<(typeof POSITIONS)[number] | "">("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [foto, setFoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setNacionalidade(drawRandomNationality());
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickMinecraft: nick,
        discordTag: discord,
        posicao,
        nacionalidade,
        fotoCabecaDataUrl: foto,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; message?: string };

    if (!payload.ok) {
      setMessage(payload.message ?? "Falha ao registrar jogador.");
      setLoading(false);
      return;
    }

    setNick("");
    setDiscord("");
    setPosicao("");
    setFoto("");
    setNacionalidade(drawRandomNationality());
    setMessage("Jogador registrado no seu time.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-cyan-400/20 bg-black/45 p-8">
        <h2 className="text-lg font-bold uppercase tracking-[0.16em] text-cyan-200">Painel do Técnico • {teamName}</h2>
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
            <button type="button" onClick={() => setNacionalidade(drawRandomNationality())} className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 text-xs">
              Girar
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            className="md:col-span-2 rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-xs"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFoto(await fileToDataUrl(file));
            }}
          />
          <label className="md:col-span-2 flex items-start gap-3 text-xs text-white/70">
            <input type="checkbox" required className="mt-0.5" />
            Prometo jogar seriamente e cumprir os horários da liga. Inscrições falsas resultarão em banimento por IP.
          </label>
          <button disabled={loading || !foto} className="md:col-span-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black">
            {loading ? "Registrando..." : "Registrar Jogador"}
          </button>
        </form>
        {message ? <p className="mt-3 text-xs text-white/70">{message}</p> : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8">
        <h3 className="text-xl font-bold">Jogadores contratados do {teamName}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <article key={player.id} className="rounded-xl border border-white/10 bg-black/35 p-4 text-xs">
              <div className="flex items-center gap-2">
                <img src={player.fotoCabecaDataUrl} alt={player.nickMinecraft} className="h-10 w-10 rounded-md border border-white/20 object-cover" />
                <p className="font-semibold">{player.nickMinecraft}</p>
              </div>
              <p className="mt-2 text-white/70">{player.posicao} • {player.nacionalidade}</p>
              <p className="text-white/50">{player.discordTag}</p>
            </article>
          ))}
          {players.length === 0 ? <p className="text-sm text-white/60">Nenhum jogador contratado ainda.</p> : null}
        </div>
      </section>

      <TacticalBoard players={players.map((p) => ({ id: p.id, nickMinecraft: p.nickMinecraft, posicao: p.posicao, fotoCabecaDataUrl: p.fotoCabecaDataUrl }))} />
    </div>
  );
}
