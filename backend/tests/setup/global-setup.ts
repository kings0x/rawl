import { closeDatabase } from "../../src/shared/config/database.js";
import { closeRedis } from "../../src/shared/config/redis.js";

export default function globalSetup() {
  return async () => {
    await closeDatabase();
    await closeRedis();
  };
}
