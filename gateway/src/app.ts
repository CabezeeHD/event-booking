import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import { login, requireAuth } from "./auth";
import crypto from "crypto";

function generateTraceparent(existing?: string): string {
  if (existing) return existing;
  const traceId = crypto.randomBytes(16).toString("hex");
  const spanId = crypto.randomBytes(8).toString("hex");
  return `00-${traceId}-${spanId}-01`;
}

const app = express();
const frontendPath = [
  process.env.FRONTEND_PATH,
  path.join(process.cwd(), "public"),
  path.join(__dirname, "../../frontend")
].find((candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)));

app.use(cors());

app.use((req, res, next) => {
  const traceparent = generateTraceparent(req.headers["traceparent"] as string | undefined);
  req.headers["traceparent"] = traceparent;
  res.setHeader("traceparent", traceparent);
  next();
});

if (frontendPath) {
  app.use(express.static(frontendPath));
}

app.get("/", (req, res) => {
  res.json({
    service: "Gateway",
    status: "running",
    routes: ["/health", "/api/auth/login", "/api/users", "/api/events", "/api/bookings", "/api/payments", "/api/notifications"]
  });
});

app.get("/health", (req, res) => {
  res.json({ service: "Gateway", status: "running" });
});

app.post("/api/auth/login", express.json(), login);

app.use("/api", requireAuth);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/users",
    target: "http://user-service:3001",
    changeOrigin: true,
    pathRewrite: { "^/api/users": "/users" },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/events",
    target: "http://event-service:3002",
    changeOrigin: true,
    pathRewrite: { "^/api/events": "/events" },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/bookings",
    target: "http://booking-service:3003",
    changeOrigin: true,
    pathRewrite: { "^/api/bookings": "/bookings" },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/payments",
    target: "http://payment-service:3004",
    changeOrigin: true,
    pathRewrite: { "^/api/payments": "/payments" },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/notifications",
    target: "http://notification-service:3005",
    changeOrigin: true,
    pathRewrite: { "^/api/notifications": "/notifications" },
  })
);

export default app;
