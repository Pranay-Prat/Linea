export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 3 * 24 * 60 * 60 * 1000,
};
export const AUTH_COOKIE = "linea-token";