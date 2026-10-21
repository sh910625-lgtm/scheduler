import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const TEST_DB = "scheduler_test";
const ADMIN_URL = "postgres://postgres:postgres@localhost:5432/postgres";

/** 테스트 전용 DB를 새로 만들고 마이그레이션을 적용한다. */
export default async function setup() {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  const client = postgres(`postgres://postgres:postgres@localhost:5432/${TEST_DB}`, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "src/server/db/migrations" });
  await client.end();
}
