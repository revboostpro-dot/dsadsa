import StatusBadge from './StatusBadge';

export default function WorkerCard({ worker, onClick }) {
  const activeBatch = worker.batches?.find((b) => b.status === 'ACTIVE');
  const progress    = activeBatch?.progress ?? 0;
  const maxProgress = activeBatch?.maxProgress ?? 5;

  return (
    <div
      className="worker-card animate-fade-in"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
            worker.status === 'AVAILABLE' ? 'bg-primary/15 text-primary' :
            worker.status === 'LOCKED'    ? 'bg-yellow-500/15 text-yellow-400' :
                                            'bg-red-500/15 text-red-400'
          }`}>
            {worker.workerId?.replace('W-', '')}
          </div>
          <div>
            <p className="text-text-primary font-semibold text-sm">{worker.name}</p>
            <p className="text-text-muted text-xs">{worker.workerId}</p>
          </div>
        </div>
        <StatusBadge status={worker.status} />
      </div>

      {/* Balance + Supervisor row */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1">
          <span className="text-text-muted">Balance:</span>
          <span className={`font-bold ${worker.balance > 0 ? 'text-primary' : 'text-text-muted'}`}>
            ₹{worker.balance?.toFixed(0) || '0'}
          </span>
        </div>
        {worker.supervisor && (
          <span className="text-text-muted">
            {worker.supervisor.name}
          </span>
        )}
      </div>

      {/* Locked by indicator */}
      {worker.status === 'LOCKED' && worker.lockedBy && (
        <p className="text-yellow-400 text-xs mb-2 flex items-center gap-1">
          🔒 Locked by {worker.lockedBy.name}
        </p>
      )}

      {/* Cooldown indicator */}
      {worker.status === 'COOLDOWN' && worker.cooldownUntil && (
        <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
          ⏱ Until {new Date(worker.cooldownUntil).toLocaleTimeString()}
        </p>
      )}

      {/* Progress bar (shown during active batch) */}
      {worker.status === 'LOCKED' && activeBatch && (
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-muted text-xs">Progress</span>
            <span className="text-primary text-xs font-medium">{progress} / {maxProgress}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress / maxProgress) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
