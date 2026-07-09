import { Router } from "express";
import { listEvents, getEventById, createEvent, updateEvent, deleteEvent } from "./event-store";


const router = Router();


router.get('/', async (req, res) => {
    try {
        const events = await listEvents();
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }  
});

router.get('/:id', async (req, res) => {
    try {
        const event = await getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    } 
});  

router.post('/', async (req, res) => {
    try {
        const { title, location, capacity, price } = req.body;
        if (!title || !location || capacity == null || price == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newEvent = await createEvent({ title, location, capacity, price });
        res.status(201).json(newEvent);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const event = await updateEvent(req.params.id, req.body);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await deleteEvent(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});


    
export default router;