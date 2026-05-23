import { buildApp } from "./app.js";
import { closeDatabase, pingDatabase } from "./shared/config/database.js";
import { env } from "./shared/config/env.js";
import { closeRedis, pingRedis } from "./shared/config/redis.js";

const startServer = async () => {
  const app = await buildApp();

  try {
    await pingDatabase(env);
    await pingRedis(env);

    await app.listen({
      host: "0.0.0.0",
      port: env.PORT,
    });

    const shutdown = async () => {
      await app.close();
      await closeDatabase();
      await closeRedis();
      process.exit(0);
    };

    process.once("SIGINT", () => void shutdown());
    process.once("SIGTERM", () => void shutdown());
  } catch (error) {
    app.log.error(error, "Failed to start server");
    await app.close();
    await closeDatabase();
    await closeRedis();
    process.exit(1);
  }
};

void startServer();
