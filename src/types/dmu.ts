export const DEFAULT_PRIMARY_COLOR = "#388f69";
export const DEFAULT_SECONDARY_COLOR = "#444444";
export const DEFAULT_CTA_COLOR = "#358e27";

export type FacultyMember = {
  id?: number;
  role: string;
  name: string;
  titles: string;
  photo_url: string;
};

export type DmuActivity = {
  activityCode: string;
  title: string;
  date: string;
  cme_credits: number | string;
  overview: string;
  artwork_url: string;
  commercial_support_statement: string;
  faculty: FacultyMember[];
};

export type FetchStatus = "idle" | "loading" | "success" | "error";
