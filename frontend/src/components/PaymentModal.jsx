import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, DollarSign } from 'lucide-react';
import { paymentsApi } from '../services/api';

export default function PaymentModal({ worker, onClose, onSuccess }) {
  const [amount, setAmount]   = useState(worker.balance?.toFixed(0) || '');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (numAmount > worker.balance) {
      toast.error('Amount exceeds worker balance');
      return;
    }

    setLoading(true);
    try {
      const res = await paymentsApi.create({ workerId: worker.id, amount: numAmount, note });
      toast.success(`₹${numAmount} paid to ${worker.name}!`);
      onSuccess(res.data.data.worker);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-bg-card border-t border-bg-border rounded-t-3xl p-6 animate-slide-up">
        {/* Handle */}
        <div className="w-12 h-1 rounded-full bg-bg-border mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Pay Worker</h2>
            <p className="text-text-muted text-sm">{worker.workerId} — {worker.name}</p>
          </div>
          <button id="close-payment-modal" className="btn-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance info */}
        <div className="card p-3 mb-4 flex justify-between items-center">
          <span className="text-text-secondary text-sm">Pending Balance</span>
          <span className="text-primary font-bold text-lg">₹{worker.balance?.toFixed(0)}</span>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <label className="text-text-muted text-xs mb-1 block">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
            <input
              id="payment-amount"
              type="number"
              className="input pl-8 text-lg font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              max={worker.balance}
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-3">
          {[worker.balance, worker.balance / 2, 100, 50].filter((v) => v > 0 && v <= worker.balance).map((v) => (
            <button
              key={v}
              id={`quick-pay-${v}`}
              onClick={() => setAmount(Math.floor(v).toString())}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              ₹{Math.floor(v)}
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-text-muted text-xs mb-1 block">Note (optional)</label>
          <input
            id="payment-note"
            type="text"
            className="input text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="UPI transfer, cash, etc."
          />
        </div>

        {/* UPI info */}
        {worker.upiId && (
          <div className="card p-3 mb-4 flex justify-between items-center">
            <span className="text-text-muted text-xs">UPI ID</span>
            <span className="text-text-primary text-sm font-medium">{worker.upiId}</span>
          </div>
        )}

        <button
          id="confirm-payment-btn"
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          onClick={handlePay}
          disabled={loading || !amount}
        >
          <DollarSign className="w-5 h-5" />
          {loading ? 'Processing...' : `Pay ₹${amount || 0}`}
        </button>
      </div>
    </div>
  );
}
