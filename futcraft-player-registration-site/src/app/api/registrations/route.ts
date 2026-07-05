import { db } from "@/db";
import { playerRegistrations } from "@/db/schema";
import { desc } from "drizzle-orm";

const minecraftNickRegex = /^[A-Za-z0-9_]{3,16}$/;
const discordModernRegex = /^[A-Za-z0-9._]{2,32}$/;
const discordLegacyRegex = /^.{2,32}#\d{4}$/;

export async function GET() {
  try {
    const rows = await db.query.playerRegistrations.findMany({
      orderBy: [desc(playerRegistrations.createdAt)],
      limit: 30,
    });

    return Response.json({ ok: true, registrations: rows });
  } catch {
    return Response.json({ ok: false, message: "Erro ao listar registros." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      nickMinecraft?: string;
      discordTag?: string;
      posicao?: "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";
      nacionalidade?: string;
      fotoCabecaDataUrl?: string;
      compromisso?: boolean;
    };

    const nickMinecraft = body.nickMinecraft?.trim() ?? "";
    const discordTag = body.discordTag?.trim() ?? "";
    const posicao = body.posicao;
    const nacionalidade = body.nacionalidade?.trim() ?? "";
    const fotoCabecaDataUrl = body.fotoCabecaDataUrl?.trim() ?? "";

    if (!minecraftNickRegex.test(nickMinecraft)) {
      return Response.json({ ok: false, message: "Nick inválido." }, { status: 400 });
    }

    if (!(discordModernRegex.test(discordTag) || discordLegacyRegex.test(discordTag))) {
      return Response.json({ ok: false, message: "Discord inválido." }, { status: 400 });
    }

    if (!posicao || !["Goleiro", "Zagueiro", "Meio-Campo", "Atacante"].includes(posicao)) {
      return Response.json({ ok: false, message: "Posição inválida." }, { status: 400 });
    }

    if (!nacionalidade) {
      return Response.json({ ok: false, message: "Nacionalidade obrigatória." }, { status: 400 });
    }

    if (!fotoCabecaDataUrl.startsWith("data:image/")) {
      return Response.json({ ok: false, message: "Foto da skin inválida." }, { status: 400 });
    }

    if (!body.compromisso) {
      return Response.json({ ok: false, message: "Aceite o termo de compromisso." }, { status: 400 });
    }

    await db.insert(playerRegistrations).values({
      nickMinecraft,
      discordTag,
      posicao,
      nacionalidade,
      fotoCabecaDataUrl,
    });

    return Response.json({ ok: true, message: "Registro enviado com sucesso." });
  } catch {
    return Response.json({ ok: false, message: "Erro ao registrar jogador." }, { status: 500 });
  }
}
