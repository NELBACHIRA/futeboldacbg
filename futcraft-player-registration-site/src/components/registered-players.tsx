"use client";

import { useEffect, useState } from "react";
import {
  REGISTRATIONS_UPDATED_EVENT,
  readLocalRegistrations,
  type LocalRegistration,
} from "@/lib/registrations";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function RegisteredPlayers() {
  const [players, setPlayers] = useState<LocalRegistration[]>([]);

  useEffect(() => {
    const load = () => setPlayers(readLocalRegistrations());

    load();
    window.addEventListener(REGISTRATIONS_UPDATED_EVENT, load);
    window.addEventListener("storage", load);

    return () => {
      window.removeEventListener(REGISTRATIONS_UPDATED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Painel de Atletas</p>
          <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">Jogadores Registrados</h3>
        </div>
        <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          Total: {players.length}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center text-sm text-white/65">
          Nenhum jogador registrado ainda. Os novos cadastros aparecerão aqui automaticamente.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <article
              key={player.id}
              className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-cyan-300/40 hover:bg-black/45"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {player.fotoCabecaDataUrl ? (
                    <img
                      src={player.fotoCabecaDataUrl}
                      alt={`Skin de ${player.nickMinecraft}`}
                      className="h-11 w-11 rounded-lg border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 bg-white/5 text-[10px] text-white/45">
                      N/A
                    </div>
                  )}
                  <p className="font-bold text-white">{player.nickMinecraft}</p>
                </div>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                  {player.posicao}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/75">Discord: {player.discordTag}</p>
              <p className="mt-1 text-xs text-emerald-200">Nacionalidade: {player.nacionalidade}</p>
              <p className="mt-3 text-[11px] text-white/45">Registrado em {formatDate(player.criadoEm)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
