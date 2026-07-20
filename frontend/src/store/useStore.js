import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ─── Auth ───────────────────────────────────────────────────────────────────
  user:    JSON.parse(localStorage.getItem('user') || 'null'),
  token:   localStorage.getItem('token') || null,
  isAuth:  !!localStorage.getItem('token'),

  setAuth: (user, token) => {
    localStorage.setItem('user',  JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuth: true });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuth: false });
  },

  // ─── Workers ────────────────────────────────────────────────────────────────
  workers:       [],
  workersLoading: false,
  stats:         null,

  setWorkers:     (workers) => set({ workers }),
  setStats:       (stats)   => set({ stats }),
  setWorkersLoading: (v)    => set({ workersLoading: v }),

  // Live update: replace a single worker by id
  updateWorker: (updatedWorker) =>
    set((state) => ({
      workers: state.workers.map((w) =>
        w.id === updatedWorker.id ? { ...w, ...updatedWorker } : w
      ),
    })),

  // Live update: add a new worker
  addWorker: (worker) =>
    set((state) => ({ workers: [worker, ...state.workers] })),

  // Live update: remove a worker
  removeWorker: (id) =>
    set((state) => ({ workers: state.workers.filter((w) => w.id !== id) })),

  // ─── Activity Feed ──────────────────────────────────────────────────────────
  activityFeed: [],
  addActivity: (event) =>
    set((state) => ({
      activityFeed: [event, ...state.activityFeed].slice(0, 50),
    })),
  setActivity: (events) => set({ activityFeed: events }),

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: {},
  setSettings: (settings) => set({ settings }),

  // ─── UI State ───────────────────────────────────────────────────────────────
  activeTab:    'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  searchQuery:  '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  statusFilter: '',
  setStatusFilter: (f) => set({ statusFilter: f }),

  supervisorFilter: '',
  setSupervisorFilter: (f) => set({ supervisorFilter: f }),
}));

export default useStore;
