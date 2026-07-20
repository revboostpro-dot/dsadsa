import { format } from 'date-fns';

function actionLabel(action) {
  const map = {
    batch_started:   { label: 'Batch Started',   color: 'text-primary',    dot: '🚀' },
    batch_finished:  { label: 'Batch Finished',  color: 'text-green-400',  dot: '✅' },
    batch_cancelled: { label: 'Batch Cancelled', color: 'text-red-400',    dot: '❌' },
    payment_made:    { label: 'Payment Made',    color: 'text-purple-400', dot: '💰' },
    cooldown_reset:  { label: 'Cooldown Reset',  color: 'text-yellow-400', dot: '⏰' },
    force_unlocked:  { label: 'Force Unlocked',  color: 'text-orange-400', dot: '🔓' },
  };
  return map[action] || { label: action, color: 'text-text-secondary', dot: '•' };
}

export default function ActivityFeed({ events, compact = false }) {
  if (!events?.length) return null;

  return (
    <div className={compact ? 'flex flex-col gap-2' : 'card p-4 flex flex-col gap-0'}>
      {events.map((event, idx) => {
        const { label, color, dot } = actionLabel(event.action);
        const message = event.details?.message || label;

        if (compact) {
          return (
            <div key={event.id || idx} className="flex items-center gap-3 py-2 border-b border-bg-border last:border-0 animate-fade-in">
              <span className="text-base flex-shrink-0">{dot}</span>
              <div className="flex-1 min-w-0">
                <p className="text-text-secondary text-xs truncate">{message}</p>
              </div>
              <p className="text-text-muted text-[10px] flex-shrink-0">
                {event.timestamp ? format(new Date(event.timestamp), 'HH:mm') : ''}
              </p>
            </div>
          );
        }

        return (
          <div key={event.id || idx} className="timeline-item animate-fade-in">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-center text-lg z-10">
              {dot}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-medium ${color}`}>{message}</p>
              {event.workerLabel && (
                <p className="text-text-muted text-xs">{event.workerLabel}</p>
              )}
              <p className="text-text-muted text-xs mt-0.5">
                {event.timestamp ? format(new Date(event.timestamp), 'dd MMM, HH:mm') : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
