import type { ConnectionOptions } from "bullmq";

export function createRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL est requis pour BullMQ.");
  }

  const parsed = new URL(redisUrl);
  const connection: ConnectionOptions = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    maxRetriesPerRequest: null
  };

  if (parsed.username) {
    connection.username = decodeURIComponent(parsed.username);
  }

  if (parsed.password) {
    connection.password = decodeURIComponent(parsed.password);
  }

  const db = parsed.pathname.replace("/", "");
  if (db) {
    connection.db = Number(db);
  }

  if (parsed.protocol === "rediss:") {
    connection.tls = {};
  }

  return connection;
}
