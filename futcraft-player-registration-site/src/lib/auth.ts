import { db } from "@/db";
import { sessions, teams, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "futcraft_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "coach";
  teamId: string | null;
  teamName: string | null;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const hashedBuffer = Buffer.from(hash, "hex");
  const compareBuffer = scryptSync(password, salt, 64);

  if (hashedBuffer.length !== compareBuffer.length) return false;
  return timingSafeEqual(hashedBuffer, compareBuffer);
}

export async function ensureBootstrapAdmin() {
  const defaultUsername = "admin";
  const defaultPassword = "admin123";

  const adminByUsername = await db.query.users.findFirst({
    where: eq(users.username, defaultUsername),
  });

  if (!adminByUsername) {
    await db.insert(users).values({
      username: defaultUsername,
      passwordHash: hashPassword(defaultPassword),
      role: "admin",
    });
    return;
  }

  if (adminByUsername.role !== "admin" || !verifyPassword(defaultPassword, adminByUsername.passwordHash)) {
    await db
      .update(users)
      .set({
        role: "admin",
        passwordHash: hashPassword(defaultPassword),
      })
      .where(eq(users.id, adminByUsername.id));
  }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function clearSession(sessionToken?: string) {
  if (!sessionToken) {
    return;
  }

  await db.delete(sessions).where(eq(sessions.token, sessionToken));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const row = await db
    .select({
      userId: users.id,
      username: users.username,
      role: users.role,
      teamId: users.teamId,
      teamName: teams.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const current = row[0];
  if (!current) return null;

  return {
    id: current.userId,
    username: current.username,
    role: current.role,
    teamId: current.teamId,
    teamName: current.teamName,
  };
}
