import fs from "fs";
import path from "path";
import { Mutex } from "async-mutex";
import { VacationEntry } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "vacations.json");
const mutex = new Mutex();

async function ensureFile(): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.promises.access(DATA_FILE);
  } catch {
    await fs.promises.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<VacationEntry[]> {
  await ensureFile();
  const raw = await fs.promises.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as VacationEntry[];
}

async function writeAll(entries: VacationEntry[]): Promise<void> {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function getAllVacations(): Promise<VacationEntry[]> {
  return readAll();
}

export async function addVacation(
  entry: Omit<VacationEntry, "id">
): Promise<VacationEntry> {
  return mutex.runExclusive(async () => {
    const entries = await readAll();
    const newEntry: VacationEntry = { id: crypto.randomUUID(), ...entry };
    entries.push(newEntry);
    await writeAll(entries);
    return newEntry;
  });
}

export async function updateVacation(
  id: string,
  patch: Partial<Omit<VacationEntry, "id">>
): Promise<VacationEntry> {
  return mutex.runExclusive(async () => {
    const entries = await readAll();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Vacation ${id} not found`);
    entries[idx] = { ...entries[idx], ...patch };
    await writeAll(entries);
    return entries[idx];
  });
}

export async function deleteVacation(id: string): Promise<void> {
  return mutex.runExclusive(async () => {
    const entries = await readAll();
    const filtered = entries.filter((e) => e.id !== id);
    if (filtered.length === entries.length) throw new Error(`Vacation ${id} not found`);
    await writeAll(filtered);
  });
}
