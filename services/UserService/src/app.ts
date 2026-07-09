import express from "express";
import { listUsers, getUserById, createUser, deleteUser } from "./user-store";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "UserService", status: "running" });
});

app.get("/users", async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: "email and name are required" });
    const user = await createUser({ email, name });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default app;