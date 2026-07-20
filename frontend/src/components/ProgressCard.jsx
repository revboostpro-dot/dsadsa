/**
 * Large progress card displayed on worker detail page.
 * Shows filled/empty blocks like: ██░░░ 2/5
 */
export default function ProgressCard({ progress, maxProgress = 5, status }) {
  const pct = Math.round((progress / maxProgress) * 100);

  return (
    <div className="card-elevated p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Current Batch</h3>
        <span className="text-text-muted text-sm">{pct}%</span>
      </div>

      {/* Block progress visualization */}
      <div className="flex gap-2 mb-4 justify-center">
        {Array.from({ length: maxProgress }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-10 rounded-lg transition-all duration-500 ${
              i < progress
                ? 'bg-primary shadow-glow-sm'
                : 'bg-bg-border'
            }`}
          />
        ))}
      </div>

      {/* Text display */}
      <div className="text-center">
        <p className="text-4xl font-bold text-primary glow-text">
          {progress}
          <span className="text-xl text-text-muted font-normal"> / {maxProgress}</span>
        </p>
        <p className="text-text-secondary text-sm mt-1">QR scans completed</p>
      </div>

      {/* Unicode blocks style */}
      <div className="text-center mt-3 font-mono text-2xl tracking-widest">
        {Array.from({ length: maxProgress }, (_, i) => (
          <span key={i} className={i < progress ? 'text-primary' : 'text-bg-border'}>
            {i < progress ? '█' : '░'}
          </span>
        ))}
      </div>

      {status !== 'LOCKED' && (
        <div className="mt-4 text-center text-text-muted text-xs">
          Start a batch to track progress
        </div>
      )}
    </div>
  );
}
