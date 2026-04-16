const { Pool } = require("pg");
const logger = require("./logger");

let pool = null;

function getPool() {
  if (!pool) {
    if (process.env.NODE_ENV === "test") {
      logger.info("[DB] Skipping DB connection in test mode");
      return null;
    }

    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    logger.info("[DB] Database pool initialized");
  }

  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error("DB not available in test mode");
  }
  return p.query(text, params);
}

module.exports = {
  getPool,
  query,
};
