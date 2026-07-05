import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return Response.json({ ok: false, message: "Acesso negado." }, { status: 403 });
    }

    const body = (await request.json()) as {
      teamName?: string;
      username?: string;
      password?: string;
    };

    const teamName = body.teamName?.trim();
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!teamName || !username || !password) {
      return Response.json({ ok: false, message: "Time, usuário e senha são obrigatórios." }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (existingUser) {
      return Response.json({ ok: false, message: "Nome de usuário já existe." }, { status: 409 });
    }

    const existingTeam = await db.query.teams.findFirst({ where: eq(teams.name, teamName) });

    let teamId = existingTeam?.id;

    if (!teamId) {
      const createdTeam = await db.insert(teams).values({ name: teamName }).returning({ id: teams.id });
      teamId = createdTeam[0]?.id;
    }

    if (!teamId) {
      return Response.json({ ok: false, message: "Não foi possível criar ou localizar o time." }, { status: 500 });
    }

    await db.insert(users).values({
      username,
      passwordHash: hashPassword(password),
      role: "coach",
      teamId,
    });

    return Response.json({ ok: true, message: "Técnico criado com sucesso." });
  } catch {
    return Response.json({ ok: false, message: "Erro ao criar técnico." }, { status: 500 });
  }
}
