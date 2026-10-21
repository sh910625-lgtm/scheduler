import { signIn } from "@/server/auth";

/** 캘린더 권한이 빠져 있을 때 다시 동의받도록 안내 */
export function ReconnectNotice() {
  return (
    <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
      <p className="font-medium">Google 캘린더 권한이 필요합니다</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        다시 로그인한 뒤 동의 화면에서 <strong>캘린더 관련 항목을 모두 체크</strong>해 주세요.
      </p>
      <form
        className="mt-3"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/calendar" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          권한 다시 허용하기
        </button>
      </form>
    </div>
  );
}
