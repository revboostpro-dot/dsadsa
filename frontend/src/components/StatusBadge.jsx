export default function StatusBadge({ status }) {
  switch (status) {
    case 'AVAILABLE':
      return <span className="badge-available">🟢 Available</span>;
    case 'LOCKED':
      return <span className="badge-locked">🟡 Locked</span>;
    case 'COOLDOWN':
      return <span className="badge-cooldown">🔴 Cooldown</span>;
    default:
      return <span className="badge-available">{status}</span>;
  }
}
