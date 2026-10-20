import { randomBytes } from "crypto";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export interface ActiveSession {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export async function createSession(userId: string): Promise<ActiveSession> {
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ sessionToken, userId, expires });

  return { sessionToken, userId, expires };
}

export async function getActiveSession(
  sessionToken: string
): Promise<ActiveSession | null> {
  const [row] = await db
    .select({
      sessionToken: sessions.sessionToken,
      userId: sessions.userId,
      expires: sessions.expires,
    })
    .from(sessions)
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);

  if (!row) return null;

  if (row.expires.getTime() <= Date.now()) {
    await deleteSession(sessionToken);
    return null;
  }

  return row;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
