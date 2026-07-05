import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  ensureBootstrapAdmin,
  verifyPassword,
} from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await ensureBootstrapAdmin();
    const body = (await request.json()) as { username?: string; password?: string };

    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return Response.json({ ok: false, message: "Usuário e senha são obrigatórios." }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ ok: false, message: "Credenciais inválidas." }, { status: 401 });
    }

    const session = await createSession(user.id);

    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: session.expiresAt,
    });

    return response;
  } catch {
    return Response.json({ ok: false, message: "Erro interno no login." }, { status: 500 });
  }
}
