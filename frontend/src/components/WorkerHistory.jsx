import { format } from 'date-fns';

export default function WorkerHistory({ batches = [], payments = [], history = [] }) {
  // Merge and sort all events
  const events = [
    ...batches
      .filter((b) => b.status === 'FINISHED')
      .map((b) => ({
        id:   b.id,
        type: 'batch',
        date: b.finishedAt || b.startedAt,
        passed:  b.passed,
        failed:  b.failed,
        supervisor: b.supervisor?.name,
      })),
    ...payments.map((p) => ({
      id:     p.id,
      type:   'payment',
      date:   p.paidAt,
      amount: p.amount,
      note:   p.note,
      paidBy: p.paidBy?.name,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (events.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-secondary">No history yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {events.map((e) => (
        <div key={e.id} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                e.type === 'batch'
                  ? 'bg-primary/10'
                  : 'bg-purple-900/30'
              }`}>
                {e.type === 'batch' ? '📦' : '💰'}
              </div>
              <div>
                {e.type === 'batch' ? (
                  <>
                    <p className="text-text-primary font-medium text-sm">
                      Passed {e.passed} · Failed {e.failed}
                    </p>
                    <p className="text-primary text-xs font-medium">
                      +₹{(e.passed * 5).toFixed(0)} earned
                    </p>
                    {e.supervisor && (
                      <p className="text-text-muted text-xs">{e.supervisor}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-text-primary font-medium text-sm">
                      Paid ₹{e.amount?.toFixed(0)}
                    </p>
                    {e.note && <p className="text-text-muted text-xs">{e.note}</p>}
                    {e.paidBy && <p className="text-text-muted text-xs">by {e.paidBy}</p>}
                  </>
                )}
              </div>
            </div>
            <p className="text-text-muted text-xs">
              {e.date ? format(new Date(e.date), 'dd MMM') : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
