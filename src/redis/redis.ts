import { createClient } from "redis";
import { database } from "../config";

// These types suck so like skill issue !
type RedisClient = ReturnType<typeof createClient>;
const redis: RedisClient = createClient({
  url: database.redis.uri,
  password: database.redis.password,
});

const connect = async () => redis.connect();
const disconnect = async () => redis.disconnect();

export { redis, connect, disconnect };
