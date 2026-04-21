import * as jsonStore from "./store";
import * as spStore from "./sharepointStore";
import { VacationEntry } from "../types";

const useSharePoint = !!(
  process.env.TENANT_ID &&
  process.env.CLIENT_ID &&
  process.env.CLIENT_SECRET &&
  process.env.SHAREPOINT_SITE_URL
);

const active = useSharePoint ? spStore : jsonStore;

if (useSharePoint) {
  console.log("[store] SharePoint List 모드로 실행 중");
} else {
  console.log("[store] 로컬 JSON 파일 모드로 실행 중");
}

export const getAllVacations = () => active.getAllVacations();
export const addVacation = (e: Omit<VacationEntry, "id">) => active.addVacation(e);
export const updateVacation = (id: string, patch: Partial<Omit<VacationEntry, "id">>) =>
  active.updateVacation(id, patch);
export const deleteVacation = (id: string) => active.deleteVacation(id);
