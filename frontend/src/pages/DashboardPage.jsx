import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, Package, CreditCard,
  CheckCircle2, XCircle, DollarSign, Activity, TrendingUp
} from 'lucide-react';
import { useWorkers } from '../hooks/useWorkers';
import useStore from '../store/useStore';
import WorkerCard from '../components/WorkerCard';
import ActivityFeed from '../components/ActivityFeed';
import SkeletonCard from '../components/SkeletonCard';

function StatCard({ icon: Icon, label, value, color = 'primary', suffix = '' }) {
  const colorMap = {
    primary:  'text-primary bg-primary/10 border-primary/20',
    yellow:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    red:      'text-red-400 bg-red-400/10 border-red-400/20',
    blue:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
    purple:   'text-purple-400 bg-purple-400/10 border-purple-400/20',
    orange:   'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
        <Icon className="w-4.5 h-4.5" size={18} />
      </div>
      <div className="mt-2">
        <p className="text-text-muted text-xs">{label}</p>
        <p className="text-text-primary text-xl font-bold mt-0.5">
          {value !== undefined && value !== null ? value : '—'}
          {suffix && <span className="text-sm font-normal text-text-secondary ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, activityFeed, searchQuery, statusFilter, setSearchQuery, setStatusFilter } = useStore();
  const { workers, workersLoading, stats, refetch } = useWorkers();

  const filteredWorkers = workers.filter((w) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.workerId.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      w.phone?.includes(q) ||
      w.upiId?.toLowerCase().includes(q) ||
      w.status.toLowerCase().includes(q) ||
      String(w.balance).includes(q)
    );
  });

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-text-muted text-xs">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
          <h1 className="text-xl font-bold text-text-primary">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary text-xs">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={Users}        label="Available"       value={stats?.available}      color="primary" />
        <StatCard icon={Clock}        label="On Cooldown"     value={stats?.cooldown}       color="red"     />
        <StatCard icon={Package}      label="Active Batches"  value={stats?.activeBatches}  color="yellow"  />
        <StatCard icon={CreditCard}   label="Pending Payments" value={stats?.pendingPayments} color="orange" />
        <StatCard icon={CheckCircle2} label="Today Passed"   value={stats?.todayPassed}    color="primary" />
        <StatCard icon={XCircle}      label="Today Failed"   value={stats?.todayFailed}    color="red"     />
        <div className="col-span-2">
          <StatCard
            icon={DollarSign}
            label="Today's Payroll"
            value={stats?.todayPayroll !== undefined ? `₹${stats.todayPayroll.toFixed(0)}` : '—'}
            color="purple"
          />
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="worker-search"
            type="search"
            className="input pl-10 text-sm"
            placeholder="Search worker ID, name, phone, balance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['', 'AVAILABLE', 'LOCKED', 'COOLDOWN'].map((s) => (
            <button
              key={s || 'all'}
              id={`filter-${s || 'all'}`}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                statusFilter === s
                  ? 'bg-primary text-bg'
                  : 'bg-bg-elevated border border-bg-border text-text-secondary'
              }`}
            >
              {s === '' ? 'All' : s === 'AVAILABLE' ? '🟢 Available' : s === 'LOCKED' ? '🟡 Locked' : '🔴 Cooldown'}
            </button>
          ))}
          <button
            id="filter-balance"
            onClick={() => setStatusFilter(statusFilter === '__balance__' ? '' : '__balance__')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              statusFilter === '__balance__'
                ? 'bg-primary text-bg'
                : 'bg-bg-elevated border border-bg-border text-text-secondary'
            }`}
          >
            💰 Has Balance
          </button>
        </div>
      </div>

      {/* Workers Section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Available Workers
        </h2>
        <span className="text-text-muted text-xs">{filteredWorkers.length} workers</span>
      </div>

      {workersLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="card p-8 text-center animate-fade-in">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No workers found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your search or filters</p>
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

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Live Activity</h2>
          </div>
          <ActivityFeed events={activityFeed.slice(0, 5)} compact />
        </div>
      )}
    </div>
  );
}
