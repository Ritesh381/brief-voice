import axios from "axios";
import type {
  Meeting,
  MeetingDetail,
  SearchResult,
  OverviewStats,
  MeetingAnalytics,
} from "../types";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({ baseURL });

export const meetingsAPI = {
  list: () => api.get<Meeting[]>("/meetings").then((r) => r.data),

  get: (id: string) => api.get<MeetingDetail>(`/meetings/${id}`).then((r) => r.data),

  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ meetingId: string; filename: string; status: string }>(
        "/meetings/upload",
        form,
        {
          onUploadProgress: (e) => {
            if (onProgress && e.total) {
              onProgress(Math.round((e.loaded * 100) / e.total));
            }
          },
        }
      )
      .then((r) => r.data);
  },

  remove: (id: string) => api.delete(`/meetings/${id}`).then((r) => r.data),

  renameSpeakers: (id: string, labels: Record<string, string>) =>
    api.put(`/meetings/${id}/speakers`, { labels }).then((r) => r.data),

  toggleActionItem: (meetingId: string, itemId: string, completed: boolean) =>
    api
      .put(`/meetings/${meetingId}/action-items/${itemId}`, { completed })
      .then((r) => r.data),

  reportUrl: (id: string) => `${baseURL}/meetings/${id}/report`,
};

export const searchAPI = {
  search: (q: string, limit = 5) =>
    api
      .get<{ query: string; results: SearchResult[] }>("/search", {
        params: { q, limit },
      })
      .then((r) => r.data.results),
};

export const analyticsAPI = {
  overview: () => api.get<OverviewStats>("/analytics/overview").then((r) => r.data),
  meeting: (id: string) =>
    api.get<MeetingAnalytics>(`/analytics/meeting/${id}`).then((r) => r.data),
};
