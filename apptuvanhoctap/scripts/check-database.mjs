import pg from "pg";
import { postgresOptions } from "../database.mjs";
import { readFile } from "node:fs/promises";
let client;
try {
  if (!process.env.DATABASE_URL) throw new Error("missing-url");
  const options = postgresOptions(process.env.DATABASE_URL);
  if (process.env.DATABASE_CA_FILE && options.ssl)
    options.ssl.ca = await readFile(process.env.DATABASE_CA_FILE, "utf8");
  client = new pg.Client(options);
  await client.connect();
  await client.query("SELECT 1");
  console.log("PostgreSQL kết nối thành công. Chưa ghi dữ liệu.");
} catch (error) {
  console.error(
    `Không kết nối được PostgreSQL (${error.code || "configuration"}). Kiểm tra DATABASE_URL, mật khẩu, TLS và trạng thái project. Không cần service_role/anon key.`,
  );
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
