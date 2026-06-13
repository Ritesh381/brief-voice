import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import UploadPage from "./pages/UploadPage";
import MeetingsPage from "./pages/MeetingsPage";
import MeetingDetailPage from "./pages/MeetingDetailPage";
import SearchPage from "./pages/SearchPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/meetings" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}
