import { SESSION_COOKIE_NAME, clearSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    await clearSession(token);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return Response.json({ ok: false, message: "Erro ao encerrar sessão." }, { status: 500 });
  }
}
