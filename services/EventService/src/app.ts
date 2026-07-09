import express, { Request, Response } from "express";
import { listEvents } from "./event-store";
import eventRouting from "./eventRouting";

const app = express();
app.use(express.json());
app.use("/events", eventRouting);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ service: "EventService", status: "running" });
});


export default app;