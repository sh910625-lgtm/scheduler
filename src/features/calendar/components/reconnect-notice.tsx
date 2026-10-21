import { Icon } from "@/components/ui/icon";
import { signIn } from "@/server/auth";

/** 캘린더 권한이 빠져 있을 때 다시 동의받도록 안내 */
export function ReconnectNotice() {
  return (
    <div className="rounded-2xl bg-error-container p-4 text-on-error-container shadow-sm">
      <p className="flex items-center gap-1.5 text-headline-sm">
        <Icon name="lock" className="text-[20px]" />
        Google 캘린더 권한이 필요합니다
      </p>
      <p className="mt-1 text-body-md">
        다시 로그인한 뒤 동의 화면에서 <strong>캘린더 관련 항목을 모두 체크</strong>해 주세요.
      </p>
      <form
        className="mt-3"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/today" });
        }}
      >
        <button
          type="submit"
          className="rounded-xl bg-primary-container px-4 py-2 text-label-lg font-semibold text-on-primary-container shadow-sm active:scale-95"
        >
          권한 다시 허용하기
        </button>
      </form>
    </div>
  );
}
