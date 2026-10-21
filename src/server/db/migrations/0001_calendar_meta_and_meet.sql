ALTER TABLE "calendar" ADD COLUMN "access_role" text DEFAULT 'reader' NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar" ADD COLUMN "primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "meet_url" text;--> statement-breakpoint
-- 기존 이벤트에 meet_url을 채우기 위해 다음 동기화를 전체 동기화로 되돌린다
UPDATE "calendar" SET "sync_token" = NULL;
