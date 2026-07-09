import express from "express";
import { releaseCapacity, reserveCapacity } from "./event-client";
import {createBooking, updateBookingStatus, listBookings, getBookingById, cancelBooking} from "./booking-store";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "BookingService", status: "running" });
});

app.get("/bookings", async (req, res) => {
  try {
    const bookings = await listBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to list bookings" });
  }
});

app.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await getBookingById(String(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Failed to get booking" });
  }
});

app.put("/bookings/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }
    const updatedBooking = await updateBookingStatus(String(req.params.id), status);
    if (!updatedBooking) return res.status(404).json({ error: "Booking not found" });
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  try {
    const deletedBooking = await cancelBooking(String(req.params.id));
    if (!deletedBooking) return res.status(404).json({ error: "Booking not found" });
    res.json(deletedBooking);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const { userId, eventId, quantity } = req.body;
    if (!userId || !eventId || !quantity) {
      return res.status(400).json({ error: "userId, eventId and quantity are required" });
    }

    const reservation = await reserveCapacity(eventId, quantity);
    if (!reservation.success) {
      return res.status(409).json({ error: "Not enough capacity for the event." });
    }

    try {
      const booking = await createBooking({ userId, eventId, quantity });
      return res.status(201).json(booking);
    } catch (innerError) {
      await releaseCapacity(eventId, quantity).catch(() => {});
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to create booking" });
  }
});

export default app;