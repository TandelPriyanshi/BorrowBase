import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("./Backend/.env") });

const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432'),
});

export default pool;
