import type { DmuActivity, FacultyMember } from "../types/dmu.ts";

const ACTIVITY_PATH = "/client/integrations/dmu-maker/activities";
const UPLOAD_PATH = "/client/integrations/dmu-maker/upload";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const NOT_FOUND_MESSAGE = "Activity not found in Synapse.";
const AUTH_MESSAGE = "Authentication failed. The client id or secret is invalid or not allowlisted.";
const VALIDATION_MESSAGE = "The file was rejected. Use a PNG, JPEG, or WebP image that is 10MB or smaller.";
const NETWORK_MESSAGE =
  "Could not reach the Synapse QA API. Check that you are on VPN and that QA is reachable.";

export class SynapseApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SynapseApiError";
    this.status = status;
  }
}

export function validateFacultyPhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
    return "Photo must be a PNG, JPEG, or WebP file.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 10MB or smaller.";
  }
  return null;
}

export async function fetchSynapseActivity(activityCode: string): Promise<DmuActivity> {
  const code = activityCode.trim();
  if (!code) {
    throw new Error("Activity code is required.");
  }

  const response = await synapseFetch(`${ACTIVITY_PATH}/${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new SynapseApiError(response.status, await errorMessage(response));
  }

  const body = await readJson(response);
  const data = record(body?.data);
  if (!data) {
    throw new Error("Synapse returned an activity response without data.");
  }

  return mapActivity(data, code);
}

export async function uploadFacultyPhoto(input: {
  file: File;
  activityCode: string;
  facultyId: number;
}): Promise<string> {
  const invalid = validateFacultyPhoto(input.file);
  if (invalid) {
    throw new Error(invalid);
  }

  const form = new FormData();
  form.set("file", input.file);
  form.set("kind", "faculty_photo");
  form.set("activity_code", input.activityCode);
  form.set("faculty_id", String(input.facultyId));

  const response = await synapseFetch(UPLOAD_PATH, { method: "POST", body: form });
  if (response.status !== 201) {
    throw new SynapseApiError(response.status, await errorMessage(response));
  }

  const body = await readJson(response);
  const url = record(body?.data)?.url;
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Synapse upload did not return an image URL.");
  }
  return url;
}

function apiUrl(path: string): string {
  if (import.meta.env.DEV) {
    return path;
  }
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}

function authHeaders(): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("X-Client-Id", import.meta.env.VITE_API_CLIENT_ID ?? "");
  headers.set("X-Client-Secret", import.meta.env.VITE_API_CLIENT_SECRET ?? "");
  return headers;
}

async function synapseFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = authHeaders();
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  try {
    return await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new SynapseApiError(0, NETWORK_MESSAGE);
  }
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return record(await response.json());
  } catch {
    throw new Error("Synapse returned a response that was not JSON.");
  }
}

async function errorMessage(response: Response): Promise<string> {
  if (response.status === 404) {
    return NOT_FOUND_MESSAGE;
  }
  if (response.status === 401 || response.status === 403) {
    return AUTH_MESSAGE;
  }
  if (response.status === 422) {
    const detail = await validationDetail(response);
    return detail || VALIDATION_MESSAGE;
  }
  return `Synapse request failed (${response.status}).`;
}

async function validationDetail(response: Response): Promise<string> {
  try {
    return collectValidationMessages(await response.json());
  } catch {
    return "";
  }
}

function collectValidationMessages(body: unknown): string {
  const payload = record(body);
  if (!payload) {
    return "";
  }

  const parts: string[] = [];
  if (typeof payload.message === "string" && payload.message.trim()) {
    parts.push(payload.message.trim());
  }

  const errors = record(payload.errors);
  if (errors) {
    for (const value of Object.values(errors)) {
      if (typeof value === "string" && value.trim()) {
        parts.push(value.trim());
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string" && entry.trim()) {
            parts.push(entry.trim());
          }
        }
      }
    }
  }

  return parts.join(" ");
}

function mapActivity(data: Record<string, unknown>, requestedCode: string): DmuActivity {
  const credits = record(data.cme_credits);
  const activityCode = text(data.activity_code).trim() || requestedCode;
  const cacheBuster = "?t=" + Date.now();
  const faculty = Array.isArray(data.faculty)
    ? data.faculty.flatMap((value) => {
        const member = record(value);
        return member ? [mapFaculty(member, cacheBuster)] : [];
      })
    : [];

  return {
    activityCode,
    title: text(data.title),
    date: text(data.event_date) || text(data.release_date),
    cme_credits: credits ? creditAmount(credits.amount) : "",
    overview: text(data.marketing_overview),
    artwork_url: withCacheBuster(text(data.artwork_url), cacheBuster),
    commercial_support_statement: text(data.commercial_support_statement),
    faculty,
  };
}

function mapFaculty(member: Record<string, unknown>, cacheBuster: string): FacultyMember {
  const id = facultyId(member.id);
  return {
    ...(id === undefined ? {} : { id }),
    role: text(member.role),
    name: text(member.name),
    titles: [breakTagsToNewlines(text(member.title)), breakTagsToNewlines(text(member.affiliations))]
      .filter(Boolean)
      .join("\n"),
    photo_url: withCacheBuster(text(member.photo_url), cacheBuster),
  };
}

function withCacheBuster(url: string, cacheBuster: string): string {
  const trimmed = url.trim();
  return trimmed ? trimmed + cacheBuster : "";
}

function breakTagsToNewlines(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function facultyId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  return undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function creditAmount(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
