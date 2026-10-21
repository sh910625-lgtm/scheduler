import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signIn } from "@/server/auth";
import { getOptionalUser } from "@/server/session";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <h1 className="text-2xl font-semibold">Scheduler</h1>
        <p className="mt-2 text-sm text-zinc-500">Google 캘린더와 연동해 일정을 관리하세요.</p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/calendar" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Google 계정으로 로그인
          </button>
        </form>
      </div>
    </main>
  );
}

async function RedirectIfSignedIn() {
  if (await getOptionalUser()) redirect("/calendar");
  return null;
}
