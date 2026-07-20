import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useWorkers } from '../hooks/useWorkers';
import useStore from '../store/useStore';
import WorkerCard from '../components/WorkerCard';
import SkeletonCard from '../components/SkeletonCard';

export default function WorkersPage() {
  const navigate = useNavigate();
  const { searchQuery, statusFilter, setSearchQuery, setStatusFilter } = useStore();
  const { workers, workersLoading } = useWorkers();

  const filteredWorkers = workers.filter((w) => {
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = (
        w.workerId.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.phone?.includes(q) ||
        w.upiId?.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q) ||
        String(w.balance).includes(q)
      );
    }
    if (statusFilter && statusFilter !== '__balance__') {
      match = match && w.status === statusFilter;
    }
    if (statusFilter === '__balance__') {
      match = match && w.balance > 0;
    }
    return match;
  });

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">Workers</h1>
        <span className="text-text-muted text-sm">{filteredWorkers.length} found</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          id="workers-search"
          type="search"
          className="input pl-10 text-sm"
          placeholder="Search by ID, name, phone, UPI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {[
          { value: '',            label: 'All' },
          { value: 'AVAILABLE',  label: '🟢 Available' },
          { value: 'LOCKED',     label: '🟡 Locked' },
          { value: 'COOLDOWN',   label: '🔴 Cooldown' },
          { value: '__balance__', label: '💰 Has Balance' },
        ].map((f) => (
          <button
            key={f.value || 'all'}
            id={`workers-filter-${f.value || 'all'}`}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              statusFilter === f.value
                ? 'bg-primary text-bg'
                : 'bg-bg-elevated border border-bg-border text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Workers List */}
      {workersLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-text-secondary font-medium">No workers found</p>
          <p className="text-text-muted text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onClick={() => navigate(`/workers/${worker.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
