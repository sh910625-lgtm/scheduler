import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { signIn } from "@/server/auth";
import { getOptionalUser } from "@/server/session";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-surface p-4">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-surface-container-lowest p-8 text-center shadow-md">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
          <Icon name="event_repeat" className="text-[32px]" />
        </span>
        <h1 className="mt-4 text-headline-lg-mobile tracking-tight text-primary">SyncCal</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Google 캘린더와 연동해 일정을 관리하세요.</p>
        <form
          className="mt-8 w-full"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/today" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-container py-3.5 text-label-lg font-semibold text-on-primary-container shadow-[0_4px_12px_rgba(26,115,232,0.3)] active:scale-[0.98]"
          >
            <Icon name="login" className="text-[20px]" />
            Google 계정으로 로그인
          </button>
        </form>
      </div>
    </main>
  );
}

async function RedirectIfSignedIn() {
  if (await getOptionalUser()) redirect("/today");
  return null;
}
