import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("EventService HTTP", () => {
  it("returns healthy status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ service: "EventService", status: "running" });
  });

  it("returns event list", async () => {
    const response = await request(app).get("/events");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
