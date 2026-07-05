import { db } from "@/db";
import { players } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

const minecraftNickRegex = /^[A-Za-z0-9_]{3,16}$/;
const discordModernRegex = /^[A-Za-z0-9._]{2,32}$/;
const discordLegacyRegex = /^.{2,32}#\d{4}$/;

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json({ ok: false, message: "Não autenticado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const teamIdQuery = url.searchParams.get("teamId");

    const whereCondition =
      currentUser.role === "admin"
        ? teamIdQuery
          ? eq(players.teamId, teamIdQuery)
          : undefined
        : currentUser.teamId
          ? eq(players.teamId, currentUser.teamId)
          : undefined;

    const data = await db.query.players.findMany({
      where: whereCondition,
      orderBy: [desc(players.createdAt)],
    });

    return Response.json({ ok: true, players: data });
  } catch {
    return Response.json({ ok: false, message: "Erro ao buscar jogadores." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "coach" || !currentUser.teamId) {
      return Response.json({ ok: false, message: "Apenas técnicos podem registrar atletas." }, { status: 403 });
    }

    const body = (await request.json()) as {
      nickMinecraft?: string;
      discordTag?: string;
      posicao?: "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";
      nacionalidade?: string;
      fotoCabecaDataUrl?: string;
    };

    const nickMinecraft = body.nickMinecraft?.trim() ?? "";
    const discordTag = body.discordTag?.trim() ?? "";
    const posicao = body.posicao;
    const nacionalidade = body.nacionalidade?.trim() ?? "";
    const fotoCabecaDataUrl = body.fotoCabecaDataUrl?.trim() ?? "";

    if (!minecraftNickRegex.test(nickMinecraft)) {
      return Response.json({ ok: false, message: "Nick do Minecraft inválido." }, { status: 400 });
    }

    if (!(discordModernRegex.test(discordTag) || discordLegacyRegex.test(discordTag))) {
      return Response.json({ ok: false, message: "Discord Tag inválida." }, { status: 400 });
    }

    if (!posicao || !["Goleiro", "Zagueiro", "Meio-Campo", "Atacante"].includes(posicao)) {
      return Response.json({ ok: false, message: "Posição inválida." }, { status: 400 });
    }

    if (!nacionalidade) {
      return Response.json({ ok: false, message: "Nacionalidade é obrigatória." }, { status: 400 });
    }

    if (!fotoCabecaDataUrl.startsWith("data:image/")) {
      return Response.json({ ok: false, message: "Foto da cabeça inválida." }, { status: 400 });
    }

    await db.insert(players).values({
      nickMinecraft,
      discordTag,
      posicao,
      nacionalidade,
      fotoCabecaDataUrl,
      teamId: currentUser.teamId,
      createdByUserId: currentUser.id,
    });

    return Response.json({ ok: true, message: "Jogador contratado com sucesso." });
  } catch {
    return Response.json({ ok: false, message: "Erro ao registrar jogador." }, { status: 500 });
  }
}
