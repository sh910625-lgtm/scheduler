import "server-only";
import { google } from "googleapis";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { missingCalendarScopes } from "./scopes";

async function findGoogleAccount(userId: string) {
  return db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "google")),
  });
}

/** 사용자가 아직 허용하지 않은 캘린더 권한 (비어 있으면 정상) */
export async function getMissingCalendarScopes(userId: string) {
  return missingCalendarScopes((await findGoogleAccount(userId))?.scope);
}

/**
 * 사용자의 저장된 토큰으로 인증된 Google Calendar 클라이언트를 만든다.
 * access token이 만료되면 googleapis가 refresh_token으로 자동 갱신하고,
 * 갱신된 토큰은 tokens 이벤트에서 DB에 다시 저장한다.
 */
export async function getCalendarClient(userId: string) {
  const account = await findGoogleAccount(userId);
  if (!account?.refresh_token) {
    throw new Error("Google 계정이 연동되지 않았거나 refresh token이 없습니다.");
  }
  if (missingCalendarScopes(account.scope).length > 0) {
    throw new Error("Google 캘린더 권한이 허용되지 않았습니다. 다시 로그인해 권한을 허용해 주세요.");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  oauth2.on("tokens", async (tokens) => {
    await db
      .update(accounts)
      .set({
        access_token: tokens.access_token ?? account.access_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      })
      .where(
        and(
          eq(accounts.provider, "google"),
          eq(accounts.providerAccountId, account.providerAccountId),
        ),
      );
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}
