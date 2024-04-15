import { generateRandom10DigitString } from "./utils";

export const DEFAULTS = {
  BULL_BOARD_COOKIE_SECRET: generateRandom10DigitString(),
  BULL_BOARD_PATH_PREFIX: "/bullmq/admin",
  BULL_BOARD_SESSION_TIMEOUT: 600000, // 10 mins
};
