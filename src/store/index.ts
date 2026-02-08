'use client';

import { create } from 'zustand';
import type {
  ContentPost, Lead, Sequence, Suppression, Engagement,
  Signal, Experiment, Learning, DailyMetrics, ActivityEntry,
  OverviewStats, Alert, FunnelStep, WeeklyKPI,
} from '@/types';

interface DashboardState {
  // Data
  overview: OverviewStats;
  alerts: Alert[];
  content: ContentPost[];
  leads: Lead[];
  sequences: Sequence[];
  suppression: Suppression[];
  engagements: Engagement[];
  signals: Signal[];
  experiments: Experiment[];
  learnings: Learning[];
  dailyMetrics: DailyMetrics[];
  weeklyKPIs: WeeklyKPI[];
  activityLog: ActivityEntry[];
  funnel: FunnelStep[];

  // UI state
  loading: Record<string, boolean>;
  lastSynced: string | null;
  feedOpen: boolean;
  realOnly: boolean;

  // Actions
  setOverview: (data: OverviewStats) => void;
  setAlerts: (data: Alert[]) => void;
  setContent: (data: ContentPost[]) => void;
  setLeads: (data: Lead[]) => void;
  setSequences: (data: Sequence[]) => void;
  setSuppression: (data: Suppression[]) => void;
  setEngagements: (data: Engagement[]) => void;
  setSignals: (data: Signal[]) => void;
  setExperiments: (data: Experiment[]) => void;
  setLearnings: (data: Learning[]) => void;
  setDailyMetrics: (data: DailyMetrics[]) => void;
  setWeeklyKPIs: (data: WeeklyKPI[]) => void;
  setActivityLog: (data: ActivityEntry[]) => void;
  setFunnel: (data: FunnelStep[]) => void;
  setLoading: (key: string, value: boolean) => void;
  setLastSynced: (ts: string) => void;
  toggleFeed: () => void;
  toggleRealOnly: () => void;
}

export const useDashboard = create<DashboardState>((set) => ({
  overview: { posts_today: 0, engagement_today: 0, emails_sent: 0, pipeline_count: 0 },
  alerts: [],
  content: [],
  leads: [],
  sequences: [],
  suppression: [],
  engagements: [],
  signals: [],
  experiments: [],
  learnings: [],
  dailyMetrics: [],
  weeklyKPIs: [],
  activityLog: [],
  funnel: [],
  loading: {},
  lastSynced: null,
  feedOpen: false,
  realOnly: false,

  setOverview: (data) => set({ overview: data }),
  setAlerts: (data) => set({ alerts: data }),
  setContent: (data) => set({ content: data }),
  setLeads: (data) => set({ leads: data }),
  setSequences: (data) => set({ sequences: data }),
  setSuppression: (data) => set({ suppression: data }),
  setEngagements: (data) => set({ engagements: data }),
  setSignals: (data) => set({ signals: data }),
  setExperiments: (data) => set({ experiments: data }),
  setLearnings: (data) => set({ learnings: data }),
  setDailyMetrics: (data) => set({ dailyMetrics: data }),
  setWeeklyKPIs: (data) => set({ weeklyKPIs: data }),
  setActivityLog: (data) => set({ activityLog: data }),
  setFunnel: (data) => set({ funnel: data }),
  setLoading: (key, value) => set((s) => ({ loading: { ...s.loading, [key]: value } })),
  setLastSynced: (ts) => set({ lastSynced: ts }),
  toggleFeed: () => set((s) => ({ feedOpen: !s.feedOpen })),
  toggleRealOnly: () => set((s) => ({ realOnly: !s.realOnly })),
}));

// Fetch helper
export async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}
