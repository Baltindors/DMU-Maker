import { PreviewPane } from "./components/PreviewPane.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { DmuProvider } from "./context/DmuContext.tsx";

export default function App() {
  return (
    <DmuProvider>
      <div className="flex h-full overflow-hidden bg-slate-100 text-slate-900">
        <Sidebar />
        <PreviewPane />
      </div>
    </DmuProvider>
  );
}
