import { Suspense } from "react";
import Link from "next/link";
import { signOut } from "@/server/auth";
import { getCurrentUser } from "@/server/session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/calendar" className="font-semibold">
            Scheduler
          </Link>
          <Link href="/settings" className="text-zinc-500 hover:text-current">
            설정
          </Link>
        </nav>
        <Suspense>
          <UserMenu />
        </Suspense>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
      className="flex items-center gap-3 text-sm"
    >
      <span className="text-zinc-500">{user.email}</span>
      <button type="submit" className="text-zinc-500 hover:text-current">
        로그아웃
      </button>
    </form>
  );
}
