import { useState, useEffect, useCallback } from "react";
import { VacationEntry } from "../types";

const API = "/api/vacations";

export function useVacations() {
  const [vacations, setVacations] = useState<VacationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVacations(await res.json());
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addVacation = useCallback(
    async (entry: Omit<VacationEntry, "id">): Promise<VacationEntry> => {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: VacationEntry = await res.json();
      setVacations((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateVacation = useCallback(
    async (id: string, patch: Partial<Omit<VacationEntry, "id">>): Promise<VacationEntry> => {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: VacationEntry = await res.json();
      setVacations((prev) => prev.map((v) => (v.id === id ? updated : v)));
      return updated;
    },
    []
  );

  const deleteVacation = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setVacations((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { vacations, loading, error, addVacation, updateVacation, deleteVacation };
}
