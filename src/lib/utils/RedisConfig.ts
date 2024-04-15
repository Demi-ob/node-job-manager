import IORedis from "ioredis";

let connection: IORedis | null = null;

const initialiseRedisConnection = (
  opts: {
    port?: number;
    host?: string;
    username?: string;
    password?: string;
  } = {}
) => {
  if (connection) {
    return connection;
  }

  console.log("Initialising Redis connection");

  let config: any = {};
  if (opts.port) {
    config.port = opts.port;
  }
  if (opts.host) {
    config.host = opts.host;
  }
  if (opts.username) {
    config.username = opts.username;
  }
  if (opts.password) {
    config.password = opts.password;
  }

  connection = new IORedis({
    ...config,
    maxRetriesPerRequest: null,
  });

  return connection;
};

export { initialiseRedisConnection, connection };
