import { useState } from "react";
import { PreviewPane } from "./components/PreviewPane.tsx";
import { Sidebar, type PreviewViewport } from "./components/Sidebar.tsx";
import { DmuProvider } from "./context/DmuContext.tsx";

export default function App() {
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");

  return (
    <DmuProvider>
      <div className="flex h-full overflow-hidden bg-slate-100 text-slate-900">
        <Sidebar previewViewport={previewViewport} onPreviewViewportChange={setPreviewViewport} />
        <PreviewPane previewViewport={previewViewport} />
      </div>
    </DmuProvider>
  );
}
