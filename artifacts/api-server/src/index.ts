import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import app from "./app";
import { logger } from "./lib/logger";

// Load .env from project root (dist/ -> api-server -> artifacts -> project root)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", "..", "..", ".env");
const result = config({ path: envPath, override: true });
if (result.error) {
  // fallback — env vars may already be loaded
  logger.warn("dotenv: could not load .env file, using existing env vars");
} else {
  // Trim all loaded values to strip Windows \r characters
  for (const key of Object.keys(result.parsed ?? {})) {
    const val = process.env[key];
    if (val) process.env[key] = val.trim();
  }
}
const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
