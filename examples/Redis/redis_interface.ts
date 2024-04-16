import IORedis from "ioredis";

const redisConfig: any = {
  port: 6379,
  host: "localhost",
  username: "",
  password: "",
};

console.log("Initialising redis connection");

export const connection = new IORedis({
  ...redisConfig,
  maxRetriesPerRequest: null,
});
