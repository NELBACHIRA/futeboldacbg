"use client";

import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";

type PlayerDto = {
  id: string;
  nickMinecraft: string;
  posicao: "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";
  fotoCabecaDataUrl: string;
};

type TacticalSlot = {
  id: string;
  x: number;
  y: number;
};

type Formation = {
  id: string;
  name: string;
  slots: TacticalSlot[];
};

type XY = { x: number; y: number };

const FORMATIONS: Formation[] = [
  {
    id: "2-2-1",
    name: "2-2-1",
    slots: [
      { id: "gk", x: 50, y: 90 },
      { id: "def1", x: 35, y: 68 },
      { id: "def2", x: 65, y: 68 },
      { id: "mid1", x: 35, y: 46 },
      { id: "mid2", x: 65, y: 46 },
      { id: "atk", x: 50, y: 24 },
    ],
  },
  {
    id: "3-1-1",
    name: "3-1-1",
    slots: [
      { id: "gk", x: 50, y: 90 },
      { id: "def1", x: 25, y: 67 },
      { id: "def2", x: 50, y: 69 },
      { id: "def3", x: 75, y: 67 },
      { id: "mid", x: 50, y: 45 },
      { id: "atk", x: 50, y: 23 },
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getRoleByZone(position: XY): string {
  if (position.y >= 84) return "GOL";
  if (position.y >= 64) return position.x < 40 ? "LE" : position.x > 60 ? "LD" : "ZAG";
  if (position.y >= 40) return position.x < 40 ? "ME" : position.x > 60 ? "MD" : "MC";
  return position.x < 40 ? "PE" : position.x > 60 ? "PD" : "ATA";
}

function summary(
  formation: Formation,
  players: PlayerDto[],
  selected: Record<string, string>,
  positions: Record<string, XY>,
): string {
  const lines = formation.slots.map((slot) => {
    const p = players.find((item) => item.id === selected[slot.id]);
    const role = getRoleByZone(positions[slot.id] ?? { x: slot.x, y: slot.y });
    return `${role}: ${p ? p.nickMinecraft : "---"}`;
  });

  return [`⚽ Escalação ${formation.name} • FutCraft 6v6`, ...lines].join("\n");
}

export function TacticalBoard({ players }: { players: PlayerDto[] }) {
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [selectedBySlot, setSelectedBySlot] = useState<Record<string, string>>({});
  const [slotPositions, setSlotPositions] = useState<Record<string, XY>>({});
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const formation = useMemo(() => FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0], [formationId]);

  useEffect(() => {
    setSelectedBySlot((prev) => {
      const next: Record<string, string> = {};
      for (const slot of formation.slots) {
        next[slot.id] = prev[slot.id] ?? "";
      }
      return next;
    });

    const nextPos: Record<string, XY> = {};
    for (const slot of formation.slots) {
      nextPos[slot.id] = { x: slot.x, y: slot.y };
    }
    setSlotPositions(nextPos);
  }, [formation]);

  function updateDragged(clientX: number, clientY: number) {
    if (!draggingSlotId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 8, 92);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 8, 92);
    setSlotPositions((prev) => ({ ...prev, [draggingSlotId]: { x, y } }));
  }

  async function exportImage() {
    if (!boardRef.current) return;
    setIsExporting(true);
    setStatus("");
    try {
      const dataUrl = await toPng(boardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `futcraft-6v6-${formation.name}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("Imagem pronta para Discord.");
    } catch {
      setStatus("Falha ao gerar imagem.");
    } finally {
      setIsExporting(false);
    }
  }

  async function copyDiscord() {
    try {
      await navigator.clipboard.writeText(summary(formation, players, selectedBySlot, slotPositions));
      setStatus("Texto copiado para Discord.");
    } catch {
      setStatus("Falha ao copiar texto.");
    }
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-black/45 p-6 sm:p-8">
      <h3 className="text-lg font-bold uppercase tracking-[0.16em] text-cyan-200">Área Tática do Técnico (6v6)</h3>
      <p className="mt-2 text-xs text-white/60">Somente jogadores contratados do seu time aparecem aqui.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <select
            value={formationId}
            onChange={(e) => setFormationId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm"
          >
            {FORMATIONS.map((f) => (
              <option key={f.id} value={f.id} className="bg-zinc-900">
                {f.name}
              </option>
            ))}
          </select>

          {formation.slots.map((slot) => {
            const role = getRoleByZone(slotPositions[slot.id] ?? { x: slot.x, y: slot.y });
            return (
              <div key={slot.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[11px] font-semibold uppercase text-cyan-100">{role}</p>
                <select
                  value={selectedBySlot[slot.id] ?? ""}
                  onChange={(e) => setSelectedBySlot((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-zinc-900/80 px-3 py-2 text-xs"
                >
                  <option value="">Sem jogador</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickMinecraft} • {p.posicao}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={exportImage} disabled={isExporting} className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-black">
              {isExporting ? "Gerando..." : "Baixar imagem"}
            </button>
            <button onClick={copyDiscord} className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-3 text-xs font-semibold">
              Copiar texto
            </button>
          </div>
          {status ? <p className="text-xs text-white/70">{status}</p> : null}
        </div>

        <div>
          <div
            ref={boardRef}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,#166534_0%,#14532d_100%)]"
            onPointerMove={(e) => updateDragged(e.clientX, e.clientY)}
            onPointerUp={() => setDraggingSlotId(null)}
            onPointerLeave={() => setDraggingSlotId(null)}
          >
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/40" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50" />
            <div className="absolute left-1/2 top-2 h-14 w-28 -translate-x-1/2 border border-white/50" />
            <div className="absolute bottom-2 left-1/2 h-14 w-28 -translate-x-1/2 border border-white/50" />

            {formation.slots.map((slot) => {
              const player = players.find((p) => p.id === selectedBySlot[slot.id]);
              const pos = slotPositions[slot.id] ?? { x: slot.x, y: slot.y };
              const role = getRoleByZone(pos);

              return (
                <button
                  key={slot.id}
                  type="button"
                  className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDraggingSlotId(slot.id);
                    updateDragged(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (draggingSlotId === slot.id) updateDragged(e.clientX, e.clientY);
                  }}
                  onPointerUp={() => setDraggingSlotId(null)}
                >
                  {player ? (
                    <img src={player.fotoCabecaDataUrl} alt={player.nickMinecraft} className="h-10 w-10 rounded-md border border-white/50 object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-md border border-white/50 bg-black/35 text-[10px]">{role}</div>
                  )}
                  <p className="mt-1 rounded bg-black/55 px-1.5 py-0.5 text-center text-[10px] font-semibold">{player ? `${player.nickMinecraft} • ${role}` : role}</p>
                </button>
              );
            })}
          </div>

          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/70">
            {summary(formation, players, selectedBySlot, slotPositions)}
          </pre>
        </div>
      </div>
    </section>
  );
}
