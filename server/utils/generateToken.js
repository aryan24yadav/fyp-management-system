const DAY_MS = 24 * 60 * 60 * 1000;

/** Cookie attributes shared by login (set) and logout (clear). */
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // not readable from JavaScript (XSS protection)
    secure: isProduction, // HTTPS only in production; plain http in local dev
    sameSite: isProduction ? "none" : "lax", // "none" is needed when frontend and API are on different domains
    path: "/",
  };
};

/**
 * Signs a JWT, stores it in an httpOnly cookie and sends the user back.
 * The token is intentionally NOT included in the JSON body so that browser
 * JavaScript can never read it.
 */
export const generateToken = (user, statusCode, message, res) => {
  const token = user.generateToken();
  const cookieDays = Number(process.env.COOKIE_EXPIRE) || 7;

  res
    .status(statusCode)
    .cookie("token", token, {
      ...getCookieOptions(),
      expires: new Date(Date.now() + cookieDays * DAY_MS),
    })
    .json({
      success: true,
      message,
      user, // the User schema's toJSON strips password and reset-token fields
    });
};
