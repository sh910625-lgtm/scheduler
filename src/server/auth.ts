import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import { GOOGLE_SCOPE } from "@/server/google/scopes";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Google({
      authorization: {
        params: {
          scope: GOOGLE_SCOPE,
          // refresh_token을 받기 위해 필수
          access_type: "offline",
          prompt: "consent",
          // 이전에 허용한 권한도 함께 유지
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Auth.js는 기존 계정으로 재로그인할 때 account row를 갱신하지 않으므로,
    // 권한을 다시 받은 경우를 위해 토큰과 scope를 직접 저장한다.
    async signIn({ account }) {
      if (account?.provider !== "google") return;
      await db
        .update(accounts)
        .set({
          access_token: account.access_token,
          expires_at: account.expires_at,
          scope: account.scope,
          id_token: account.id_token,
          ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
        })
        .where(and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, account.providerAccountId)));
    },
  },
});
