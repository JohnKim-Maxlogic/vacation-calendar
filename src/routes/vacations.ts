import { Router } from "express";
import {
  getAllVacations,
  addVacation,
  updateVacation,
  deleteVacation,
} from "../data/index";

const router = Router();

router.get("/vacations", async (_req, res) => {
  try {
    const entries = await getAllVacations();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/vacations", async (req, res) => {
  try {
    const { userId, userDisplayName, startDate, endDate, leaveType, note, color } = req.body;
    if (!userId || !userDisplayName || !startDate || !endDate || !leaveType || !color) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const entry = await addVacation({ userId, userDisplayName, startDate, endDate, leaveType, note, color });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/vacations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;
    const updated = await updateVacation(id, patch);
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

router.delete("/vacations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteVacation(id);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

export default router;
