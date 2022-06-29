import { createClient } from "redis";
import { injectable, singleton } from "tsyringe";
import { ConnectiveBinding } from "../binding";
import { database } from "../../config";

// These types suck so like skill issue !
type RedisClient = ReturnType<typeof createClient>;

@singleton()
@injectable()
class RedisConnection implements ConnectiveBinding {
  readonly redis: RedisClient;

  constructor() {
    this.redis = createClient({
      url: database.redis.uri,
      password: database.redis.password,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.redis.isOpen) {
      return;
    }

    await this.redis.disconnect();
  }
}

export default RedisConnection;
