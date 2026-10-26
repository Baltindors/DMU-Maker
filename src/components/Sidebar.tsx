import { useState, type FormEvent } from "react";
import { useDmu } from "../context/dmu-context.ts";
import { usesMockActivityData } from "../services/activitySource.ts";
import { exportDmuZip } from "../templates/exportDmuZip.ts";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type PreviewViewport = "desktop" | "tablet" | "phone";

const PREVIEW_VIEWPORTS: { id: PreviewViewport; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "phone", label: "Phone" },
];

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          onChange={(event) => {
            setDraft(null);
            onChange(event.target.value);
          }}
          className="h-10 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={shown}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (HEX_COLOR.test(next)) {
              onChange(next.toLowerCase());
            }
          }}
          onBlur={() => setDraft(null)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 uppercase"
        />
      </div>
    </label>
  );
}

export function Sidebar({
  previewViewport,
  onPreviewViewportChange,
}: {
  previewViewport: PreviewViewport;
  onPreviewViewportChange: (viewport: PreviewViewport) => void;
}) {
  const {
    activity,
    status,
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
  } = useDmu();
  const [code, setCode] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const mockData = usesMockActivityData();
  const uploadInFlight = uploadingFacultyIndex !== null;
  const searchLocked = status === "loading" || isExporting || uploadInFlight;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchLocked) {
      return;
    }
    if (!code.trim()) {
      setValidation("Enter an activity code to fetch DMU data.");
      return;
    }
    setValidation(null);
    void fetchActivity(code);
  }

  async function handleExport() {
    if (!activity || status === "loading" || isExporting || uploadInFlight) {
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      await exportDmuZip(activity, { primary: primaryColor, secondary: secondaryColor, cta: ctaColor });
    } catch (caught) {
      setExportError(caught instanceof Error ? caught.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">PRIME Education</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">DMU Maker</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-b border-slate-200 px-5 py-5">
        <label className="block" htmlFor="activity-code">
          <span className="text-sm font-medium text-slate-700">Activity code</span>
          <input
            id="activity-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="13WC2610"
            autoComplete="off"
            disabled={searchLocked}
            className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#388f69] focus:ring-2 focus:ring-[#388f69]/30 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </label>
        <p className="text-xs text-slate-500">
          {mockData
            ? "13WC2610, 13LV258, 13WC261, or 23LV261"
            : "Enter an activity code from Admin. Example: 13WC2610."}
        </p>
        {validation ? <p className="text-sm text-red-600">{validation}</p> : null}
        <button
          type="submit"
          disabled={searchLocked}
          className="w-full rounded-md bg-[#388f69] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2f7858] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Fetching…" : "Fetch activity"}
        </button>
        <div className="flex gap-2" role="group" aria-label="Preview size">
          {PREVIEW_VIEWPORTS.map((option) => {
            const active = previewViewport === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onPreviewViewportChange(option.id)}
                className={`flex-1 rounded-md px-2 py-2 text-sm font-semibold ${
                  active
                    ? "bg-[#388f69] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </form>

      <section className="space-y-4 border-b border-slate-200 px-5 py-5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Colors</h2>
        <ColorField label="Primary" hint="Header bars" value={primaryColor} onChange={setPrimaryColor} />
        <ColorField
          label="Secondary"
          hint="Panel behind the button and faculty"
          value={secondaryColor}
          onChange={setSecondaryColor}
        />
        <ColorField label="CTA" hint="Register button" value={ctaColor} onChange={setCtaColor} />
      </section>

      <section className="space-y-4 px-5 py-5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Faculty photos</h2>
        {activity ? (
          <ul className="space-y-4">
            {activity.faculty.map((member, index) => (
              <li key={`${member.name}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.photo_url}
                    alt=""
                    className="h-14 w-14 rounded-full bg-slate-100 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>
                <label className="mt-3 block text-xs font-medium text-slate-600">
                  Replace photo
                  <input
                    type="file"
                    accept={mockData ? "image/*" : "image/png,image/jpeg,image/webp"}
                    aria-label={`Replace photo for ${member.name}`}
                    disabled={searchLocked}
                    className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file || searchLocked) {
                        return;
                      }
                      void replaceFacultyPhoto(index, file);
                    }}
                  />
                </label>
                {uploadingFacultyIndex === index ? (
                  <p className="mt-2 text-xs text-slate-500">Uploading…</p>
                ) : null}
                {uploadErrorIndex === index && uploadError ? (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Fetch an activity to replace faculty photos.</p>
        )}
      </section>

      <section className="mt-auto border-t border-slate-200 px-5 py-5">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={!activity || status === "loading" || isExporting || uploadInFlight}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? "Exporting…" : "Export DMU"}
        </button>
        {exportError ? <p className="mt-2 text-sm text-red-600">{exportError}</p> : null}
      </section>
    </aside>
  );
}
