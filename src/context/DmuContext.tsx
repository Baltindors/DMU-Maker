import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchMockActivity } from "../services/mockDataService.ts";
import {
  DEFAULT_CTA_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  type DmuActivity,
  type FetchStatus,
} from "../types/dmu.ts";
import { DmuContext, type DmuContextValue } from "./dmu-context.ts";

function revokeBlobUrl(url: string | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function DmuProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<DmuActivity | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);
  const [ctaColor, setCtaColor] = useState(DEFAULT_CTA_COLOR);
  const requestId = useRef(0);
  const activityRef = useRef<DmuActivity | null>(null);

  const fetchActivity = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }

    const id = ++requestId.current;
    setStatus("loading");
    setError(null);

    try {
      const data = await fetchMockActivity(trimmed);
      if (id !== requestId.current) {
        return;
      }

      activityRef.current?.faculty.forEach((member) => revokeBlobUrl(member.photo_url));
      activityRef.current = data;
      setActivity(data);
      setStatus("success");
    } catch (caught) {
      if (id !== requestId.current) {
        return;
      }
      activityRef.current?.faculty.forEach((member) => revokeBlobUrl(member.photo_url));
      activityRef.current = null;
      setActivity(null);
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Failed to fetch activity.");
    }
  }, []);

  const setFacultyPhoto = useCallback((index: number, objectUrl: string) => {
    const current = activityRef.current;
    if (!current || index < 0 || index >= current.faculty.length) {
      revokeBlobUrl(objectUrl);
      return;
    }

    revokeBlobUrl(current.faculty[index]?.photo_url);
    const faculty = current.faculty.map((member, memberIndex) =>
      memberIndex === index ? { ...member, photo_url: objectUrl } : member,
    );
    const next = { ...current, faculty };
    activityRef.current = next;
    setActivity(next);
  }, []);

  const value = useMemo<DmuContextValue>(
    () => ({
      activity,
      status,
      error,
      primaryColor,
      secondaryColor,
      ctaColor,
      fetchActivity,
      setPrimaryColor,
      setSecondaryColor,
      setCtaColor,
      setFacultyPhoto,
    }),
    [
      activity,
      status,
      error,
      primaryColor,
      secondaryColor,
      ctaColor,
      fetchActivity,
      setFacultyPhoto,
    ],
  );

  return <DmuContext.Provider value={value}>{children}</DmuContext.Provider>;
}
