import { PublicPlayerRegistration } from "@/components/public-player-registration";
import { TacticalBoard } from "@/components/tactical-board";
import { db } from "@/db";
import { playerRegistrations } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function HomePage() {
  const registrations = await db.query.playerRegistrations.findMany({
    orderBy: [desc(playerRegistrations.createdAt)],
    limit: 60,
  });

  return (
    <main className="relative min-h-screen bg-[#06090f] px-6 py-14 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(6,182,212,0.18),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.18),transparent_35%)]" />

      <section className="relative mx-auto w-full max-w-6xl space-y-8">
        <article className="rounded-3xl border border-white/10 bg-zinc-900/65 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:p-10">
          <p className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Liga Profissional FutCraft
          </p>
          <h1 className="mt-5 text-[clamp(2rem,6vw,3.75rem)] font-black leading-[0.95] tracking-tight text-white">Registro Oficial de Jogadores</h1>
          <p className="mt-5 max-w-2xl text-sm text-white/70 sm:text-base">Sem login: registro público + elenco registrado + área tática direta.</p>
        </article>

        <PublicPlayerRegistration />

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8">
          <h3 className="text-xl font-bold">Jogadores Registrados</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registrations.map((player) => (
              <article key={player.id} className="rounded-xl border border-white/10 bg-black/35 p-4 text-xs">
                <div className="flex items-center gap-2">
                  <img src={player.fotoCabecaDataUrl} alt={player.nickMinecraft} className="h-10 w-10 rounded-md border border-white/20 object-cover" />
                  <p className="font-semibold">{player.nickMinecraft}</p>
                </div>
                <p className="mt-2 text-white/70">{player.posicao} • {player.nacionalidade}</p>
                <p className="text-white/50">{player.discordTag}</p>
              </article>
            ))}
            {registrations.length === 0 ? <p className="text-sm text-white/60">Nenhum jogador registrado ainda.</p> : null}
          </div>
        </section>

        <TacticalBoard
          players={registrations.map((player) => ({
            id: player.id,
            nickMinecraft: player.nickMinecraft,
            posicao: player.posicao,
            fotoCabecaDataUrl: player.fotoCabecaDataUrl,
          }))}
        />
      </section>
    </main>
  );
}
