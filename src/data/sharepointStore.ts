import { ClientSecretCredential } from "@azure/identity";
import { VacationEntry } from "../types";

let _credential: ClientSecretCredential | null = null;

function getCredential(): ClientSecretCredential {
  if (!_credential) {
    _credential = new ClientSecretCredential(
      process.env.TENANT_ID!,
      process.env.CLIENT_ID!,
      process.env.CLIENT_SECRET!
    );
  }
  return _credential;
}

async function getToken(): Promise<string> {
  const token = await getCredential().getToken("https://graph.microsoft.com/.default");
  if (!token) throw new Error("Graph API 토큰 발급 실패");
  return token.token;
}

async function graphRequest(
  url: string,
  method = "GET",
  body?: unknown
): Promise<Response> {
  const token = await getToken();
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function listBaseUrl(): string {
  const siteUrl = new URL(process.env.SHAREPOINT_SITE_URL!);
  const siteGraphPath = `${siteUrl.hostname}:${siteUrl.pathname}:`;
  const listName = encodeURIComponent(process.env.SHAREPOINT_LIST_NAME || "VacationCalendar");
  return `https://graph.microsoft.com/v1.0/sites/${siteGraphPath}/lists/${listName}`;
}

function rowToEntry(item: Record<string, unknown>): VacationEntry {
  const f = item.fields as Record<string, string>;
  return {
    id: String(item.id),
    userId: f.UserId ?? "",
    userDisplayName: f.UserDisplayName ?? "",
    startDate: f.StartDate ?? "",
    endDate: f.EndDate ?? "",
    leaveType: (f.LeaveType as VacationEntry["leaveType"]) ?? "연차",
    note: f.Note || undefined,
    color: f.Color ?? "#6264A7",
  };
}

export async function getAllVacations(): Promise<VacationEntry[]> {
  const res = await graphRequest(
    `${listBaseUrl()}/items?$expand=fields&$select=id,fields&$top=999`
  );
  if (!res.ok) throw new Error(`SharePoint 조회 실패: ${res.status} ${await res.text()}`);
  const data = await res.json() as { value: Record<string, unknown>[] };
  return data.value.map(rowToEntry);
}

export async function addVacation(
  entry: Omit<VacationEntry, "id">
): Promise<VacationEntry> {
  const res = await graphRequest(`${listBaseUrl()}/items`, "POST", {
    fields: {
      Title: entry.userId,
      UserId: entry.userId,
      UserDisplayName: entry.userDisplayName,
      StartDate: entry.startDate,
      EndDate: entry.endDate,
      LeaveType: entry.leaveType,
      Note: entry.note ?? "",
      Color: entry.color,
    },
  });
  if (!res.ok) throw new Error(`SharePoint 생성 실패: ${res.status} ${await res.text()}`);
  const item = await res.json() as { id: string };
  return { id: String(item.id), ...entry };
}

export async function updateVacation(
  id: string,
  patch: Partial<Omit<VacationEntry, "id">>
): Promise<VacationEntry> {
  const fields: Record<string, string> = {};
  if (patch.userId !== undefined) fields.UserId = patch.userId;
  if (patch.userDisplayName !== undefined) fields.UserDisplayName = patch.userDisplayName;
  if (patch.startDate !== undefined) fields.StartDate = patch.startDate;
  if (patch.endDate !== undefined) fields.EndDate = patch.endDate;
  if (patch.leaveType !== undefined) fields.LeaveType = patch.leaveType;
  if (patch.note !== undefined) fields.Note = patch.note ?? "";
  if (patch.color !== undefined) fields.Color = patch.color;

  const patchRes = await graphRequest(`${listBaseUrl()}/items/${id}/fields`, "PATCH", fields);
  if (!patchRes.ok) throw new Error(`SharePoint 수정 실패: ${patchRes.status} ${await patchRes.text()}`);

  const getRes = await graphRequest(
    `${listBaseUrl()}/items/${id}?$expand=fields&$select=id,fields`
  );
  if (!getRes.ok) throw new Error(`SharePoint 조회 실패: ${getRes.status}`);
  return rowToEntry(await getRes.json() as Record<string, unknown>);
}

export async function deleteVacation(id: string): Promise<void> {
  const res = await graphRequest(`${listBaseUrl()}/items/${id}`, "DELETE");
  if (!res.ok) throw new Error(`SharePoint 삭제 실패: ${res.status} ${await res.text()}`);
}
