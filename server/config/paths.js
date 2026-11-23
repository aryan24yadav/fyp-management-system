import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the `server/` folder. */
export const SERVER_ROOT = path.resolve(__dirname, "..");

/** All uploaded files live under this folder (git-ignored). */
export const UPLOAD_ROOT = path.join(SERVER_ROOT, "uploads");
