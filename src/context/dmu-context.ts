import { createContext, useContext } from "react";
import type { DmuActivity, FetchStatus } from "../types/dmu.ts";

export type DmuContextValue = {
  activity: DmuActivity | null;
  status: FetchStatus;
  error: string | null;
  uploadingFacultyIndex: number | null;
  uploadError: string | null;
  uploadErrorIndex: number | null;
  primaryColor: string;
  secondaryColor: string;
  ctaColor: string;
  fetchActivity: (code: string) => Promise<void>;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  setCtaColor: (hex: string) => void;
  replaceFacultyPhoto: (index: number, file: File) => Promise<void>;
};

export const DmuContext = createContext<DmuContextValue | null>(null);

export function useDmu() {
  const context = useContext(DmuContext);
  if (!context) {
    throw new Error("useDmu must be used within a DmuProvider.");
  }
  return context;
}
