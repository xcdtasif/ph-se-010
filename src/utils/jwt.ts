import config from "../config";
import type { TJwtPayload } from "../types";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const generateAccessToken = (payload: TJwtPayload): string => {
  return jwt.sign(payload, config.access_token_secret as string, {
    expiresIn: "1d",
  });
};

export const generateRefreshToken = (payload: TJwtPayload): string => {
  return jwt.sign(payload, config.refresh_token_secret as string, {
    expiresIn: "10d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, config.access_token_secret as string);
  } catch (error) {
    throw new Error("Invalid access token!");
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(
      token,
      config.refresh_token_secret as string,
    ) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token!");
  }
};
