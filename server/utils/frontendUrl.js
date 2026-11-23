/**
 * FRONTEND_URL may hold several comma-separated origins (used for CORS).
 * Links in e-mails must point to exactly one of them: the first one.
 */
export const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
