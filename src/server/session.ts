import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export type CurrentUser = { id: string; email: string | null; name: string | null; image: string | null };

/**
 * 현재 로그인 사용자를 반환하고, 없으면 /login 으로 보낸다.
 * connection()으로 요청 시점 렌더링임을 먼저 명시해야 Auth.js 내부의
 * crypto 호출이 prerender 단계에서 실행되지 않는다. (Cache Components)
 * 세션을 읽으므로 반드시 <Suspense> 안의 컴포넌트에서 호출할 것.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  return user;
}

export async function getOptionalUser(): Promise<CurrentUser | null> {
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}
