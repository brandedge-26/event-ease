import jwt from "jsonwebtoken";
import { ENV } from "../config/envs.js";

const ACCESS_EXPIRY  = "15m";
const REFRESH_EXPIRY = "7d";

export function generateAccessToken(payload) {
    return jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateRefreshToken(payload) {
    return jwt.sign(payload, ENV.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, ENV.REFRESH_TOKEN_SECRET);
}
