if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;
export const HTTP_BACKEND_URL = process.env.HTTP_BACKEND_URL;
export const WS_BACKEND_URL = process.env.WS_BACKEND_URL;
