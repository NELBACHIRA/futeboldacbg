"use client";

import { TacticalBoard } from "@/components/tactical-board";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type CoachInfo = {
  id: string;
  username: string;
  teamName: string | null;
  createdAt: string;
};

type TeamWithPlayers = {
  id: string;
  name: string;
  players: Array<{
    id: string;
    nickMinecraft: string;
    posicao: "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";
    fotoCabecaDataUrl: string;
  }>;
};

export function AdminPanel({
  coaches,
  teams,
}: {
  coaches: CoachInfo[];
  teams: TeamWithPlayers[];
}) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );

  async function createCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, username, password }),
    });

    const payload = (await response.json()) as { ok: boolean; message?: string };

    if (!payload.ok) {
      setMessage(payload.message ?? "Erro ao criar técnico.");
      setLoading(false);
      return;
    }

    setTeamName("");
    setUsername("");
    setPassword("");
    setMessage("Técnico criado com sucesso.");
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="space-y-8 rounded-3xl border border-cyan-400/20 bg-black/45 p-8">
      <div className="space-y-6">
        <h2 className="text-lg font-bold uppercase tracking-[0.16em] text-cyan-200">Painel do Admin</h2>
        <form onSubmit={createCoach} className="grid gap-3 md:grid-cols-3">
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Nome do Time" className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário do Técnico" className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha do Técnico" className="rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm" />
          <button disabled={loading} className="md:col-span-3 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black">
            {loading ? "Criando..." : "Criar conta de técnico"}
          </button>
        </form>
        {message ? <p className="text-xs text-white/70">{message}</p> : null}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">Técnicos cadastrados</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {coaches.map((coach) => (
              <article key={coach.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                <p className="font-semibold text-cyan-100">{coach.username}</p>
                <p className="text-white/70">Time: {coach.teamName ?? "Sem time"}</p>
              </article>
            ))}
            {coaches.length === 0 ? <p className="text-xs text-white/50">Nenhum técnico cadastrado ainda.</p> : null}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100">Escalação por time (visão admin)</h3>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id} className="bg-zinc-900">
              {team.name}
            </option>
          ))}
          {teams.length === 0 ? <option value="">Sem times cadastrados</option> : null}
        </select>

        {!selectedTeam ? <p className="text-sm text-white/60">Crie um time/técnico para popular a escalação.</p> : null}
        <TacticalBoard players={selectedTeam?.players ?? []} />
      </div>
    </section>
  );
}
