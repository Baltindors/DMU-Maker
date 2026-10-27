import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { usesMockActivityData } from "../services/activitySource.ts";
import { fetchMockActivity } from "../services/mockDataService.ts";
import { fetchSynapseActivity, uploadFacultyPhoto, validateFacultyPhoto } from "../services/synapseApiService.ts";
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
  const [uploadingFacultyIndex, setUploadingFacultyIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorIndex, setUploadErrorIndex] = useState<number | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);
  const [ctaColor, setCtaColor] = useState(DEFAULT_CTA_COLOR);
  const requestId = useRef(0);
  const activityRef = useRef<DmuActivity | null>(null);
  const uploadingRef = useRef(false);
  const fetchInFlight = useRef(false);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
    setUploadErrorIndex(null);
  }, []);

  const commitFacultyPhoto = useCallback((index: number, photoUrl: string) => {
    const current = activityRef.current;
    if (!current || index < 0 || index >= current.faculty.length) {
      revokeBlobUrl(photoUrl);
      return;
    }

    revokeBlobUrl(current.faculty[index]?.photo_url);
    const faculty = current.faculty.map((member, memberIndex) =>
      memberIndex === index ? { ...member, photo_url: photoUrl, isReplaced: true } : member,
    );
    const next = { ...current, faculty };
    activityRef.current = next;
    setActivity(next);
  }, []);

  const fetchActivity = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || uploadingRef.current || fetchInFlight.current) {
      return;
    }

    const id = ++requestId.current;
    fetchInFlight.current = true;
    setStatus("loading");
    setError(null);
    clearUploadError();

    try {
      const data = usesMockActivityData()
        ? await fetchMockActivity(trimmed)
        : await fetchSynapseActivity(trimmed);
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
    } finally {
      if (id === requestId.current) {
        fetchInFlight.current = false;
      }
    }
  }, [clearUploadError]);

  const replaceFacultyPhoto = useCallback(async (index: number, file: File) => {
    const current = activityRef.current;
    if (
      !current ||
      uploadingRef.current ||
      fetchInFlight.current ||
      index < 0 ||
      index >= current.faculty.length
    ) {
      return;
    }

    if (usesMockActivityData()) {
      commitFacultyPhoto(index, URL.createObjectURL(file));
      clearUploadError();
      return;
    }

    const member = current.faculty[index];
    if (member?.id == null) {
      setUploadError("This faculty member has no id, so the photo cannot be replaced.");
      setUploadErrorIndex(index);
      return;
    }

    const invalid = validateFacultyPhoto(file);
    if (invalid) {
      setUploadError(invalid);
      setUploadErrorIndex(index);
      return;
    }

    const generation = requestId.current;
    const facultyId = member.id;
    const activityCode = current.activityCode;
    uploadingRef.current = true;
    setUploadingFacultyIndex(index);
    clearUploadError();

    try {
      const url = await uploadFacultyPhoto({ file, activityCode, facultyId });
      if (generation !== requestId.current) {
        return;
      }
      const latest = activityRef.current;
      if (!latest || latest.activityCode !== activityCode || latest.faculty[index]?.id !== facultyId) {
        return;
      }
      commitFacultyPhoto(index, url);
    } catch (caught) {
      if (generation !== requestId.current) {
        return;
      }
      setUploadError(caught instanceof Error ? caught.message : "Faculty photo upload failed.");
      setUploadErrorIndex(index);
    } finally {
      uploadingRef.current = false;
      setUploadingFacultyIndex(null);
    }
  }, [clearUploadError, commitFacultyPhoto]);

  const value = useMemo<DmuContextValue>(
    () => ({
      activity,
      status,
      error,
      uploadingFacultyIndex,
      uploadError,
      uploadErrorIndex,
      primaryColor,
      secondaryColor,
      ctaColor,
      fetchActivity,
      setPrimaryColor,
      setSecondaryColor,
      setCtaColor,
      replaceFacultyPhoto,
    }),
    [
      activity,
      status,
      error,
      uploadingFacultyIndex,
      uploadError,
      uploadErrorIndex,
      primaryColor,
      secondaryColor,
      ctaColor,
      fetchActivity,
      replaceFacultyPhoto,
    ],
  );

  return <DmuContext.Provider value={value}>{children}</DmuContext.Provider>;
}
