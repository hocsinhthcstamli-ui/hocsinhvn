import { DatabaseSync } from "node:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

export const tables = [
  "users",
  "sessions",
  "app_state",
  "audit",
  "recovery",
  "videos",
];
export function postgresOptions(connectionString) {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL phải là PostgreSQL.");
  // Do not let URL parameters override TLS verification.
  for (const name of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(name);
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );
  return {
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  };
}
export async function openDatabase({ dbPath, databaseUrl }) {
  if (!databaseUrl) {
    await mkdir(path.dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    let tail = Promise.resolve();
    return {
      kind: "sqlite",
      prepare: (sql) => db.prepare(sql),
      exec: (sql) => db.exec(sql),
      // Awaiting database calls must not allow SQLite requests to interleave.
      scope(fn) {
        const result = tail.then(fn);
        tail = result.catch(() => {});
        return result;
      },
      finish: async () => {},
      abort: async () => {},
      close: () => db.close(),
    };
  }
  const options = postgresOptions(databaseUrl);
  if (process.env.DATABASE_CA_FILE && options.ssl)
    options.ssl.ca = await readFile(process.env.DATABASE_CA_FILE, "utf8");
  const pool = new pg.Pool(options);
  pool.on("error", () => console.error("Kết nối PostgreSQL nền bị gián đoạn."));
  const context = new AsyncLocalStorage();
  const scope = async (fn) => {
    if (context.getStore()) return fn();
    const client = await pool.connect();
    const state = { client, active: true };
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '10s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      await client.query(
        "SET LOCAL idle_in_transaction_session_timeout = '30s'",
      );
      await client.query("SET LOCAL search_path = aac_private, pg_catalog");
      // Single snapshot application: serialize state/auth mutations across replicas.
      await client.query("SELECT pg_advisory_xact_lock(714208613)");
      const value = await context.run(state, fn);
      if (state.active) {
        await client.query("COMMIT");
        state.active = false;
      }
      return value;
    } catch (error) {
      if (state.active) await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  };
  const query = async (sql, params = []) => {
    const state = context.getStore();
    if (!state) return scope(() => query(sql, params));
    if (!state.active)
      throw new Error("Database transaction already finished.");
    let index = 0;
    sql = sql.replace(/\?/g, () => `$${++index}`);
    if (/^INSERT OR IGNORE /i.test(sql))
      sql =
        sql.replace("INSERT OR IGNORE", "INSERT") + " ON CONFLICT DO NOTHING";
    const result = await state.client.query(sql, params);
    for (const row of result.rows || [])
      if (Object.hasOwn(row, "n")) row.n = Number(row.n);
    return result;
  };
  return {
    kind: "postgres",
    scope,
    prepare: (sql) => ({
      get: async (...params) => (await query(sql, params)).rows[0],
      all: async (...params) => (await query(sql, params)).rows,
      run: async (...params) => ({
        changes: (await query(sql, params)).rowCount,
      }),
    }),
    exec: async (sql) => {
      if (["BEGIN IMMEDIATE", "COMMIT", "ROLLBACK"].includes(sql.trim()))
        return;
      return query(sql);
    },
    finish: async () => {
      const state = context.getStore();
      if (state?.active) {
        await state.client.query("COMMIT");
        state.active = false;
      }
    },
    abort: async () => {
      const state = context.getStore();
      if (state?.active) {
        await state.client.query("ROLLBACK");
        state.active = false;
      }
    },
    close: () => pool.end(),
  };
}

export async function initializeDatabase(db, initialData) {
  return db.scope(async () => {
    if (db.kind === "postgres") {
      await db.exec(`CREATE SCHEMA IF NOT EXISTS aac_private;
        REVOKE ALL ON SCHEMA aac_private FROM PUBLIC;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, child_ids TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires BIGINT NOT NULL);
        CREATE TABLE IF NOT EXISTS app_state(id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id BIGSERIAL PRIMARY KEY, at TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS recovery(id BIGSERIAL PRIMARY KEY, at TEXT NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS videos(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL);
        REVOKE ALL ON ALL TABLES IN SCHEMA aac_private FROM PUBLIC;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA aac_private FROM PUBLIC;`);
      for (const role of ["anon", "authenticated"]) {
        // Supabase may configure default grants for these roles. Explicitly
        // revoke them without requiring these roles on plain PostgreSQL.
        if (
          await db
            .prepare("SELECT rolname FROM pg_roles WHERE rolname=?")
            .get(role)
        ) {
          await db.exec(
            `REVOKE ALL ON SCHEMA aac_private FROM ${role}; REVOKE ALL ON ALL TABLES IN SCHEMA aac_private FROM ${role}; REVOKE ALL ON ALL SEQUENCES IN SCHEMA aac_private FROM ${role};`,
          );
        }
      }
      for (const table of tables)
        await db.exec(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    } else {
      await db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, child_ids TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS app_state(id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, at TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS recovery(id INTEGER PRIMARY KEY, at TEXT NOT NULL, data TEXT NOT NULL);`);
    }
    await db
      .prepare("INSERT OR IGNORE INTO app_state VALUES(1,0,?)")
      .run(JSON.stringify(initialData));
  });
}
