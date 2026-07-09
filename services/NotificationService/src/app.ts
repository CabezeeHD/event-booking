import express, { Request, Response } from "express";
import { listNotifications, getNotificationById, createNotification, markAsRead } from "./notification-store";

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ service: "NotificationService", status: "running" });
});

app.get("/notifications", async (_req: Request, res: Response) => {
try {
    const notifications = await listNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to list notifications" });
  }
});

app.get("/notifications/:id", async (req: Request, res: Response) => {
  try {
    const notification = await getNotificationById(String(req.params.id));    
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to get notification" });
  }
});

app.post("/notifications", async (req: Request, res: Response) => {
  try {
    const { title, userId, message } = req.body;
    if (!title ||!userId || !message) {
      return res.status(400).json({ error: "title, userId and message are required" });
    }
  const notification = await createNotification({ title, message, recipient: userId, read: false, createdAt: new Date() });
  res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

app.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  try {
    const notification = await markAsRead(String(req.params.id));
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default app;
