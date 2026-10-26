import { useMemo } from "react";
import { useDmu } from "../context/dmu-context.ts";
import { usesMockActivityData } from "../services/activitySource.ts";
import { generateDmuHtml, withPreviewCss } from "../templates/generateDmuHtml.ts";
import { primeDmuCss } from "../templates/primeDmuCss.ts";
import type { PreviewViewport } from "./Sidebar.tsx";

const PREVIEW_WIDTH: Record<PreviewViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  phone: "375px",
};

export function PreviewPane({ previewViewport }: { previewViewport: PreviewViewport }) {
  const { activity, status, error, primaryColor, secondaryColor, ctaColor } = useDmu();

  const srcDoc = useMemo(() => {
    if (!activity) {
      return "";
    }
    const html = generateDmuHtml(activity, {
      primary: primaryColor,
      secondary: secondaryColor,
      cta: ctaColor,
    });
    return withPreviewCss(html, primeDmuCss);
  }, [activity, primaryColor, secondaryColor, ctaColor]);

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Live preview</h2>
        <p className="mt-1 text-sm text-slate-600">
          Rendered DMU. Color, photo, and activity changes update this view.
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {status === "error" && error ? <p className="px-6 pt-4 text-sm text-red-600">{error}</p> : null}
        {activity ? (
          <div className="flex min-h-0 flex-1 justify-center overflow-auto">
            <iframe
              title="DMU live preview"
              srcDoc={srcDoc}
              className="h-full min-h-0 shrink-0 border-0 bg-[#e6e6e6]"
              style={{ width: PREVIEW_WIDTH[previewViewport] }}
            />
          </div>
        ) : (
          <div className="p-6">
            {status === "loading" ? <p className="text-sm text-slate-600">Fetching activity…</p> : null}
            {status === "idle" ? (
              <p className="text-sm text-slate-600">
                {usesMockActivityData()
                  ? "Enter an activity code such as 13WC2610, 13LV258, 13WC261, or 23LV261."
                  : "Enter an activity code from Admin, such as 13WC2610."}
              </p>
            ) : null}
          </div>
        )}
        {status === "loading" && activity ? (
          <p className="border-t border-slate-200 bg-white px-6 py-2 text-sm text-slate-600">Fetching activity…</p>
        ) : null}
      </div>
    </main>
  );
}
