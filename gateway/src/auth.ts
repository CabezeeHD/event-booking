import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = "1h";

export interface AuthenticatedRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  status: "active" | "inactive" | "suspended";
}

async function findUser(username: string): Promise<UserRecord | null> {
  const userServiceUrl = process.env.USER_SERVICE_URL ?? "http://user-service:3001";
  const response = await fetch(`${userServiceUrl}/users`);

  if (!response.ok) {
    throw new Error(`UserService returned ${response.status}`);
  }

  const users = (await response.json()) as UserRecord[];
  const normalizedUsername = username.trim().toLowerCase();

  return users.find(user =>
    user.email.toLowerCase() === normalizedUsername ||
    user.name.toLowerCase() === normalizedUsername
  ) ?? null;
}

export async function login(req: Request<object, object, LoginRequest>, res: Response) {
  const { username, password } = req.body;
  const expectedPassword = process.env.LOGIN_PASSWORD ?? process.env.FAKE_USER_PASSWORD ?? "password";
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  if (password !== expectedPassword) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  let user: UserRecord | null;
  try {
    user = await findUser(username);
  } catch {
    return res.status(503).json({ error: "UserService is unavailable" });
  }

  if (!user || user.status !== "active") {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const role = user.name.toLowerCase() === "admin" || user.email.toLowerCase() === "admin"
    ? "admin"
    : "user";

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.name,
      email: user.email,
      role
    },
    secret,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

  return res.json({
    token,
    tokenType: "Bearer",
    expiresIn: TOKEN_EXPIRES_IN,
    user: {
      id: user.id,
      username: user.name,
      email: user.email,
      role
    }
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
