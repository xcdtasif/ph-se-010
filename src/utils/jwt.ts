import config from "../config";
import type { TJwtPayload } from "../types";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const generateAccessToken = (payload: TJwtPayload): string => {
  const secret = config.access_token_secret;
  if (!secret) {
    throw new Error(
      "ACCESS_TOKEN_SECRET is missing from environment variables",
    );
  }
  return jwt.sign(payload, secret, {
    expiresIn: "1d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload | string => {
  try {
    const secret = config.access_token_secret;
    if (!secret) {
      throw new Error(
        "ACCESS_TOKEN_SECRET is missing from environment variables",
      );
    }
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid access token!");
  }
};
